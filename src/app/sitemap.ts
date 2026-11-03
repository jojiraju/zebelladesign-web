import type { MetadataRoute } from "next";
import { getCategories, getCollections, getPublishedProducts } from "@/lib/server/catalog";
import { abs } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, collections] = await Promise.all([getPublishedProducts(), getCategories(), getCollections()]);
  const statics = ["/", "/shop", "/collections", "/about", "/contact", "/shipping-policy", "/returns-policy", "/privacy-policy", "/terms"];
  return [
    ...statics.map((p) => ({ url: abs(p), changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.6 })),
    ...categories.map((c) => ({ url: abs(`/categories/${c.slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...collections.map((c) => ({ url: abs(`/collections/${c.slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.filter((p) => !p.isDemo).map((p) => ({ url: abs(`/products/${p.slug}`), lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
