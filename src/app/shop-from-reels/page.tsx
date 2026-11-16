import type { Metadata } from "next";
import { ReelsGrid } from "@/components/home/ShopReels";
import { getReelProducts } from "@/lib/reels";
import { getCategories, getPublishedProducts, getSettings, toPublicProduct } from "@/lib/server/catalog";

export const revalidate = 60;
export const metadata: Metadata = { title: "Shop From Reels", alternates: { canonical: "/shop-from-reels" } };

export default async function ShopFromReelsPage() {
  const [products, settings, categories] = await Promise.all([getPublishedProducts(), getSettings(), getCategories()]);
  // Videos from /public/reels first, then products with their own video, then photo reels.
  const ordered = (await getReelProducts(products)).map(toPublicProduct);
  return <ReelsGrid products={ordered} categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} instagram={settings.social.instagram} />;
}
