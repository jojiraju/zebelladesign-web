"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { Product } from "@/lib/types";
import { ShelfHead } from "./ShelfHead";

const FIRST_PAGE = 8; // two rows of four
const STEP = 12;

/**
 * All Products with category chips. Starts with two rows; "See All" switches on continuous scrolling,
 * where more pieces load automatically just before you reach the end.
 */
export function AllProducts({ products, categories }: { products: Product[]; categories: { slug: string; name: string }[] }) {
  const [cat, setCat] = useState("all");
  const [expanded, setExpanded] = useState(false);
  const [shown, setShown] = useState(FIRST_PAGE);
  const sentinel = useRef<HTMLDivElement>(null);

  const chips = useMemo(() => {
    const has = new Set(products.map((p) => p.categorySlug));
    return categories.filter((c) => has.has(c.slug));
  }, [products, categories]);

  const filtered = useMemo(() => (cat === "all" ? products : products.filter((p) => p.categorySlug === cat)), [products, cat]);
  const more = shown < filtered.length;

  useEffect(() => {
    if (!expanded || !more || !sentinel.current) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setShown((n) => n + STEP); }, { rootMargin: "700px 0px" });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [expanded, more, shown]);

  const pick = (slug: string) => { setCat(slug); setShown(expanded ? STEP : FIRST_PAGE); };
  const seeAll = () => { setExpanded(true); setShown((n) => n + STEP); };

  if (!products.length) return null;

  const chipCls = (on: boolean) => `shrink-0 cursor-pointer rounded-full border px-5 py-2 text-sm font-medium transition ${on ? "border-gold-deep bg-gold-deep text-white shadow-md" : "border-line bg-white text-espresso hover:border-gold hover:bg-blush"}`;

  return (
    <section className="container-x mt-20 sm:mt-28" aria-labelledby="ap-h">
      <ShelfHead id="ap-h" eyebrow="The full edit" title="All Products" onSeeAll={!expanded && filtered.length > FIRST_PAGE ? seeAll : undefined} />

      <div className="-mx-4 mb-8 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        <div role="group" aria-label="Filter by category" className="flex w-max gap-2.5">
          <button type="button" aria-pressed={cat === "all"} onClick={() => pick("all")} className={chipCls(cat === "all")}>All</button>
          {chips.map((c) => (
            <button key={c.slug} type="button" aria-pressed={cat === c.slug} onClick={() => pick(c.slug)} className={chipCls(cat === c.slug)}>{c.name}</button>
          ))}
        </div>
      </div>

      {filtered.length ? <ProductGrid products={filtered.slice(0, shown)} /> : <p className="py-10 text-center text-taupe-deep">No pieces in this category yet.</p>}

      {expanded && more && <div ref={sentinel} aria-hidden className="mt-10 flex h-16 items-center justify-center"><span className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" /></div>}

      {!expanded && filtered.length > FIRST_PAGE && (
        <div className="mt-12 flex justify-center">
          <button type="button" onClick={seeAll} className="btn btn-ghost cursor-pointer">See all {filtered.length} pieces <ArrowRight size={15} className="arrow" aria-hidden /></button>
        </div>
      )}

      {expanded && !more && filtered.length > FIRST_PAGE && (
        <div className="mt-14 text-center">
          <p className="font-serif text-xl">You&rsquo;ve seen all {filtered.length} pieces</p>
          <Link href="/shop" className="link-underline mt-3 text-xs font-semibold uppercase tracking-[0.2em]">Refine in the shop →</Link>
        </div>
      )}
    </section>
  );
}
