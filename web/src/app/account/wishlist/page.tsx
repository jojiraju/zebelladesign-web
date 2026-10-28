import type { Metadata } from "next";
import { WishlistGrid } from "@/components/product/ClientProductList";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };
export default function Page() {
  // The wishlist works for guests too (stored locally), so it is not behind the account guard.
  return <div className="container-x py-12 sm:py-16"><h1 className="mb-10 font-serif text-5xl">Wishlist</h1><WishlistGrid /></div>;
}
