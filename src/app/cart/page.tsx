import type { Metadata } from "next";
import Link from "next/link";
import { CartContents } from "@/components/cart/CartContents";

export const metadata: Metadata = { title: "Your bag", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-x py-10 sm:py-16">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
        <div><p className="eyebrow mb-3">Shopping bag</p><h1 className="font-serif text-4xl sm:text-6xl">Your bag</h1></div>
        <Link href="/shop" className="link-underline text-xs font-semibold uppercase tracking-[0.18em]">Continue shopping</Link>
      </header>
      <CartContents />
    </div>
  );
}
