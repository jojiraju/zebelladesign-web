import type { Collection, Product } from "./types";

export type AdTheme = "rose" | "lilac" | "sage" | "sand";

export interface AdSlideData {
  id: string;
  theme: AdTheme;
  eyebrow: string;
  title: string;
  accent?: string;
  text?: string;
  /** Big headline number, e.g. "Up to 21% off". Only ever built from real catalogue data. */
  stat?: { prefix: string; value: string; unit: string; suffix: string };
  tag?: string;
  ctas: { label: string; href: string; variant: "solid" | "ghost" }[];
  images: string[];
}

/** The carousel shows at most this many banners; slides are added in priority order (sale, new, collection, favourites, reels). */
const MAX_SLIDES = 3;
const THEMES: AdTheme[] = ["rose", "lilac", "sage", "sand"];
const imgs = (ps: Product[], n = 3) => ps.map((p) => p.images[0]?.url).filter((u): u is string => !!u).slice(0, n);

/** Builds the advertisement slides from the live catalogue — nothing here is invented copy about prices or stock. */
export function buildAdSlides({ maxOff, best, fresh, reels, collections, products }: {
  maxOff: number; best: Product[]; fresh: Product[]; reels: Product[]; collections: Collection[]; products: Product[];
}): AdSlideData[] {
  const slides: Omit<AdSlideData, "theme">[] = [];

  if (best.length) slides.push({
    id: "sale", eyebrow: "Exclusive offers", title: "Style More,", accent: "Spend Less",
    stat: maxOff > 0 ? { prefix: "Up to", value: String(maxOff), unit: "%", suffix: "off" } : undefined,
    tag: maxOff > 0 ? "On selected styles" : undefined,
    ctas: [{ label: "Shop now", href: "/shop", variant: "solid" }, { label: "Best sellers", href: "/shop?sort=popular", variant: "ghost" }],
    images: imgs(best),
  });

  if (fresh.length) slides.push({
    id: "new", eyebrow: "Just landed", title: "Fresh", accent: "Arrivals",
    text: "Our newest designs, straight from the studio.",
    ctas: [{ label: "Shop new arrivals", href: "/shop?sort=newest", variant: "solid" }],
    images: imgs(fresh),
  });

  const col = collections.find((c) => products.filter((p) => p.collectionIds.includes(c.id)).length >= 2);
  if (col) slides.push({
    id: `col-${col.id}`, eyebrow: "The collection", title: col.name,
    text: col.description?.slice(0, 110) || "Curated edits for every occasion.",
    ctas: [{ label: "Explore collection", href: `/collections/${col.slug}`, variant: "solid" }],
    images: imgs(products.filter((p) => p.collectionIds.includes(col.id))),
  });

  if (best.length > 3) slides.push({
    id: "fav", eyebrow: "Most loved", title: "Customer", accent: "Favourites",
    text: "The pieces everyone keeps coming back to.",
    ctas: [{ label: "Shop best sellers", href: "/shop?sort=popular", variant: "solid" }],
    images: imgs(best.slice(3)),
  });

  if (reels.length) slides.push({
    id: "reels", eyebrow: "Watch & shop", title: "Shop from", accent: "Reels",
    text: "See each piece in motion, then bring it home in a tap.",
    ctas: [{ label: "Watch reels", href: "/shop-from-reels", variant: "solid" }],
    images: imgs(reels),
  });

  return slides.filter((s) => s.images.length).slice(0, MAX_SLIDES).map((s, i) => ({ ...s, theme: THEMES[i % THEMES.length] }));
}
