import type { Metadata } from "next";
import { ReelsGrid } from "@/components/home/ShopReels";
import { getPublishedProducts, getSettings, toPublicProduct } from "@/lib/server/catalog";

export const revalidate = 60;
export const metadata: Metadata = { title: "Shop From Reels", alternates: { canonical: "/shop-from-reels" } };

export default async function ShopFromReelsPage() {
  const [products, settings] = await Promise.all([getPublishedProducts(), getSettings()]);
  // Video reels first, then image-only products.
  const ordered = [...products.filter((p) => p.videoUrl), ...products.filter((p) => !p.videoUrl)].map(toPublicProduct);
  return <ReelsGrid products={ordered} instagram={settings.social.instagram} />;
}
