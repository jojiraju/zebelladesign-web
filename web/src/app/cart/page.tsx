import type { Metadata } from "next";
import { CartContents } from "@/components/cart/CartContents";

export const metadata: Metadata = { title: "Your bag", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-x py-12 sm:py-16">
      <h1 className="mb-10 font-serif text-5xl">Your bag</h1>
      <CartContents />
    </div>
  );
}
