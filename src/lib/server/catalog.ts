import "server-only";
import { availableUnits, effectivePrice } from "../commerce/catalog-rules";
import { isApiConfigured, useMockApi } from "../api/client";
import { mockCatalog } from "../mock/api";
import {
  DEFAULT_HOMEPAGE, DEFAULT_SETTINGS,
  type Banner, type HomepageContent, type StoreSettings, type Testimonial,
} from "../content";
import type { Category, Collection, Product } from "../types";

export const CATALOG_TAG = "catalog";
export const CONTENT_TAG = "content";
const REVALIDATE = 60;
const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

/**
 * Public, cached read from the backend API (server components only).
 * A missing/unreachable backend yields the fallback instead of crashing pages.
 */
async function read<T>(path: string, fallback: T, tag: string): Promise<T> {
  if (useMockApi) return (mockCatalog(path) as T | undefined) ?? fallback;
  if (!isApiConfigured()) return fallback;
  try {
    const res = await fetch(`${BASE}${path}`, { next: { revalidate: REVALIDATE, tags: [tag] } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return (await res.json()) as T;
  } catch (e) {
    console.error(`[catalog] GET ${path} failed`, e);
    return fallback;
  }
}

/** GET /catalog/products -> Product[] (published only). Filtering happens in memory (boutique-scale catalogs). */
export const getPublishedProducts = async (): Promise<Product[]> =>
  (await read<Product[]>("/catalog/products", [], CATALOG_TAG)).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

/** GET /catalog/categories -> Category[] (visible only) */
export const getCategories = async (): Promise<Category[]> =>
  (await read<Category[]>("/catalog/categories", [], CATALOG_TAG)).sort((a, b) => a.order - b.order);

/** GET /catalog/collections -> Collection[] (visible only) */
export const getCollections = async (): Promise<Collection[]> =>
  (await read<Collection[]>("/catalog/collections", [], CATALOG_TAG)).sort((a, b) => a.order - b.order);

/** GET /content/settings -> Partial<StoreSettings> */
export const getSettings = async (): Promise<StoreSettings> =>
  ({ ...DEFAULT_SETTINGS, ...(await read<Partial<StoreSettings>>("/content/settings", {}, CONTENT_TAG)) });

/** GET /content/homepage -> Partial<HomepageContent> */
export const getHomepage = async (): Promise<HomepageContent> =>
  ({ ...DEFAULT_HOMEPAGE, ...(await read<Partial<HomepageContent>>("/content/homepage", {}, CONTENT_TAG)) });

/** GET /content/banners -> Banner[] (published; the API may or may not pre-filter by schedule) */
export const getBanners = async (): Promise<Banner[]> => {
  const now = Date.now();
  return (await read<Banner[]>("/content/banners", [], CONTENT_TAG))
    .filter((b) => (!b.startsAt || b.startsAt <= now) && (!b.endsAt || b.endsAt >= now))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

/** GET /content/testimonials -> Testimonial[]. Only genuinely verified testimonials are ever shown. */
export const getTestimonials = async (): Promise<Testimonial[]> =>
  (await read<Testimonial[]>("/content/testimonials", [], CONTENT_TAG)).filter((t) => t.verified);

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return (await getPublishedProducts()).find((p) => p.slug === slug);
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
