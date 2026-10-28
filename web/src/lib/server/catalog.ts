import "server-only";
import { unstable_cache } from "next/cache";
import { adminDb, isAdminConfigured } from "./admin";
import { serialize } from "./serialize";
import { availableUnits, effectivePrice } from "../commerce/catalog-rules";
import {
  DEFAULT_HOMEPAGE, DEFAULT_SETTINGS,
  type Banner, type HomepageContent, type StoreSettings, type Testimonial,
} from "../content";
import type { Category, Collection, Product } from "../types";

export const CATALOG_TAG = "catalog";
export const CONTENT_TAG = "content";
const REVALIDATE = 60;

/** Wraps a reader so a missing/unreachable backend yields a fallback instead of crashing pages. */
async function safe<T>(fallback: T, fn: () => Promise<T>): Promise<T> {
  if (!isAdminConfigured()) return fallback;
  try {
    return await fn();
  } catch (e) {
    console.error("[catalog] read failed", e);
    return fallback;
  }
}

const docs = <T>(snap: FirebaseFirestore.QuerySnapshot) =>
  snap.docs.map((d) => serialize<T>({ id: d.id, ...d.data() }));

/** Every published product. Cached; filtering happens in memory (boutique-scale catalogs). */
export const getPublishedProducts = unstable_cache(
  () =>
    safe<Product[]>([], async () => {
      const snap = await adminDb().collection("products").where("status", "==", "published").limit(500).get();
      return docs<Product>(snap).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    }),
  ["published-products"],
  { revalidate: REVALIDATE, tags: [CATALOG_TAG] },
);

export const getCategories = unstable_cache(
  () =>
    safe<Category[]>([], async () => {
      const snap = await adminDb().collection("categories").where("visible", "==", true).get();
      return docs<Category>(snap).sort((a, b) => a.order - b.order);
    }),
  ["categories"],
  { revalidate: REVALIDATE, tags: [CATALOG_TAG] },
);

export const getCollections = unstable_cache(
  () =>
    safe<Collection[]>([], async () => {
      const snap = await adminDb().collection("collections").where("visible", "==", true).get();
      return docs<Collection>(snap).sort((a, b) => a.order - b.order);
    }),
  ["collections"],
  { revalidate: REVALIDATE, tags: [CATALOG_TAG] },
);

export const getSettings = unstable_cache(
  () =>
    safe<StoreSettings>(DEFAULT_SETTINGS, async () => {
      const s = await adminDb().collection("settings").doc("store").get();
      return { ...DEFAULT_SETTINGS, ...(s.exists ? serialize<Partial<StoreSettings>>(s.data()) : {}) };
    }),
  ["settings"],
  { revalidate: REVALIDATE, tags: [CONTENT_TAG] },
);

export const getHomepage = unstable_cache(
  () =>
    safe<HomepageContent>(DEFAULT_HOMEPAGE, async () => {
      const s = await adminDb().collection("homepageContent").doc("main").get();
      return { ...DEFAULT_HOMEPAGE, ...(s.exists ? serialize<Partial<HomepageContent>>(s.data()) : {}) };
    }),
  ["homepage"],
  { revalidate: REVALIDATE, tags: [CONTENT_TAG] },
);

export const getBanners = unstable_cache(
  () =>
    safe<Banner[]>([], async () => {
      const snap = await adminDb().collection("banners").where("status", "==", "published").get();
      const now = Date.now();
      return docs<Banner>(snap)
        .filter((b) => (!b.startsAt || b.startsAt <= now) && (!b.endsAt || b.endsAt >= now))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }),
  ["banners"],
  { revalidate: REVALIDATE, tags: [CONTENT_TAG] },
);

export const getTestimonials = unstable_cache(
  () =>
    safe<Testimonial[]>([], async () => {
      const snap = await adminDb().collection("testimonials").where("status", "==", "published").get();
      // Only genuinely verified testimonials are ever shown.
      return docs<Testimonial>(snap).filter((t) => t.verified);
    }),
  ["testimonials"],
  { revalidate: REVALIDATE, tags: [CONTENT_TAG] },
);

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return (await getPublishedProducts()).find((p) => p.slug === slug);
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const set = new Set(ids);
  return (await getPublishedProducts()).filter((p) => set.has(p.id));
}

export interface ProductFilters {
  q?: string;
  category?: string;
  collection?: string; // slug
  minPrice?: number; // paise
  maxPrice?: number;
  inStock?: boolean;
  sizes?: string[];
  colors?: string[];
  sort?: "newest" | "price-asc" | "price-desc" | "popular";
  page?: number;
  pageSize?: number;
}

export interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  pageCount: number;
  facets: { sizes: string[]; colors: { name: string; hex?: string }[]; minPrice: number; maxPrice: number };
}

export async function queryProducts(f: ProductFilters): Promise<ProductPage> {
  const [all, collections] = await Promise.all([getPublishedProducts(), getCollections()]);
  const collectionId = f.collection ? collections.find((c) => c.slug === f.collection)?.id : undefined;
  const q = f.q?.trim().toLowerCase();

  const base = all.filter((p) => {
    if (f.category && p.categorySlug !== f.category) return false;
    if (f.collection && (!collectionId || !p.collectionIds.includes(collectionId))) return false;
    if (q && !`${p.name} ${p.sku} ${p.description} ${p.categorySlug}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const sizes = new Set<string>();
  const colorMap = new Map<string, string | undefined>();
  let lo = Infinity, hi = 0;
  for (const p of base) {
    const price = effectivePrice(p);
    lo = Math.min(lo, price); hi = Math.max(hi, price);
    for (const v of p.variants) {
      if (v.size) sizes.add(v.size);
      if (v.color) colorMap.set(v.color, v.colorHex);
    }
  }

  const filtered = base.filter((p) => {
    const price = effectivePrice(p);
    if (f.minPrice != null && price < f.minPrice) return false;
    if (f.maxPrice != null && price > f.maxPrice) return false;
    if (f.inStock && !p.variants.some((v) => availableUnits(v) > 0)) return false;
    if (f.sizes?.length && !p.variants.some((v) => v.size && f.sizes!.includes(v.size) && availableUnits(v) > 0)) return false;
    if (f.colors?.length && !p.variants.some((v) => v.color && f.colors!.includes(v.color))) return false;
    return true;
  });

  const sorters: Record<NonNullable<ProductFilters["sort"]>, (a: Product, b: Product) => number> = {
    newest: (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0),
    "price-asc": (a, b) => effectivePrice(a) - effectivePrice(b),
    "price-desc": (a, b) => effectivePrice(b) - effectivePrice(a),
    popular: (a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0),
  };
  filtered.sort(sorters[f.sort ?? "newest"]);

  const pageSize = f.pageSize ?? 12;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(Math.max(1, f.page ?? 1), pageCount);
  return {
    items: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    page,
    pageCount,
    facets: {
      sizes: [...sizes],
      colors: [...colorMap].map(([name, hex]) => ({ name, hex })),
      minPrice: Number.isFinite(lo) ? lo : 0,
      maxPrice: hi,
    },
  };
}

/** Only public-safe product data should reach the browser: strip internal reservation counts. */
export function toPublicProduct(p: Product): Product {
  return { ...p, variants: p.variants.map((v) => ({ ...v, stock: availableUnits(v), reserved: 0 })) };
}
