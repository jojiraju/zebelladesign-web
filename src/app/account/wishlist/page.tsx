import type { Metadata } from "next";
import { WishlistGrid } from "@/components/product/ClientProductList";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };
export default function Page() {
  return <WishlistGrid />;
}
