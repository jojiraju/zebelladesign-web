import Link from "next/link";
import Image from "next/image";
import { Gem, Headphones, ShieldCheck, Undo2 } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/ui/motion";
import { ART } from "@/lib/art";
import type { Category, Product } from "@/lib/types";
import { ShelfHead } from "./ShelfHead";
import { ScrollRail } from "./ScrollRail";

/* ---------- Shop by category: rounded tiles with the name underneath ---------- */
export function CategoryRail({ categories, products }: { categories: Category[]; products: Product[] }) {
  if (!categories.length) return null;
  const firstImage = new Map<string, string>();
  for (const p of products) if (p.images[0]?.url && !firstImage.has(p.categorySlug)) firstImage.set(p.categorySlug, p.images[0].url);

  return (
    <section className="container-x mt-8 sm:mt-12" aria-labelledby="cat-h">
      <ShelfHead id="cat-h" title="Shop by" accent="Category" subtitle="Find your style, your way" />
      {/* Tiles share the page width evenly (like the product grids); with many categories they keep a minimum size and scroll. */}
      <ul className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:gap-6 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {categories.map((c, i) => (
          <Reveal as="li" key={c.id} delay={Math.min(i, 8) * 0.04} y={14} className="min-w-[104px] max-w-[260px] flex-1 shrink-0 sm:min-w-[140px] lg:min-w-[150px]">
            <Link href={`/categories/${c.slug}`} className="group flex flex-col items-center gap-3">
              <span className="relative block aspect-square w-full overflow-hidden rounded-2xl bg-cream shadow-sm transition-transform duration-500 ease-[var(--ease-lux)] group-hover:-translate-y-1.5">
                <Image src={c.imageUrl || firstImage.get(c.slug) || ART.productPlaceholder} alt="" fill sizes="(min-width:1024px) 20vw, 30vw" className="object-cover object-top transition-transform duration-700 group-hover:scale-105" />
              </span>
              <span className="line-clamp-2 text-center font-serif text-base leading-tight text-espresso sm:text-xl">{c.name}</span>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Best sellers: two rows (swipeable on phones, 4 across on desktop) ---------- */
export function BestSellers({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <section className="container-x mt-12 sm:mt-20" aria-labelledby="bs-h">
      <ShelfHead id="bs-h" title="Best" accent="Sellers" subtitle="The pieces everyone is loving" href="/shop?sort=popular" seeAllLabel="View All" />
      <ul className="-mx-4 grid scroll-px-4 snap-x auto-cols-[46%] grid-flow-col grid-rows-2 gap-x-3 gap-y-8 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:auto-cols-[31%] sm:px-0 md:auto-cols-auto md:grid-flow-row md:grid-cols-4 md:grid-rows-none md:gap-x-5 md:gap-y-10 md:overflow-visible [&::-webkit-scrollbar]:hidden">
        {products.slice(0, 8).map((p, i) => (
          <li key={p.id} className="snap-start"><ProductCard product={p} priority={i < 4} /></li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- New arrivals: one swipeable row ---------- */
export function NewArrivals({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <section className="container-x mt-14 sm:mt-24" aria-labelledby="na-h">
      <ShelfHead id="na-h" title="New" accent="Arrivals" subtitle="Fresh from the design studio" href="/shop?sort=newest" seeAllLabel="View All" />
      {/* 2 across on phones, 3 on tablets, exactly 4 across the page width on desktop; more by swiping or the arrows */}
      <ScrollRail>
        {products.slice(0, 10).map((p) => (
          <li key={p.id} className="w-[calc((100%-0.75rem)/2)] shrink-0 snap-start sm:w-[calc((100%-2.5rem)/3)] lg:w-[calc((100%-3.75rem)/4)]"><ProductCard product={p} /></li>
        ))}
      </ScrollRail>
    </section>
  );
}

/* ---------- Trust cards (sit under the advertisement carousel) ---------- */
const TRUST = [
  { icon: Gem, title: "Premium Quality", text: "Crafted with care, detail by detail" },
  { icon: Headphones, title: "24/7 Support", text: "Here whenever you need us" },
  { icon: Undo2, title: "Easy Returns", text: "Hassle-free, no fuss" },
  { icon: ShieldCheck, title: "Secure Shopping", text: "Safe & protected checkout" },
];

const SPARKLE_PATH = "M0,-14 C1,-5 5,-1 14,0 C5,1 1,5 0,14 C-1,5 -5,1 -14,0 C-5,-1 -1,-5 0,-14 Z";
const SPARKS: [string, string][] = [["left-[6%] top-[14%] h-4 w-4", "0s"], ["right-[8%] top-[10%] h-5 w-5", "-1.4s"], ["left-[22%] bottom-[12%] h-3.5 w-3.5", "-2.2s"], ["right-[20%] bottom-[16%] h-4 w-4", "-0.7s"], ["left-1/2 top-[8%] h-3 w-3", "-2.8s"]];

export function TrustStrip() {
  return (
    <section className="container-x mt-6 sm:mt-8" aria-labelledby="promise-h">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-[linear-gradient(120deg,#1d0f13_0%,#3a1b2c_50%,#1d0f13_100%)] px-4 pb-8 pt-10 shadow-[0_40px_80px_-46px_rgba(53,25,42,.9)] ring-1 ring-white/10 sm:px-10 sm:pb-12 sm:pt-14">
          {/* gold hairline, glows and twinkling sparkles */}
          <div aria-hidden className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
          <div aria-hidden className="absolute -left-20 top-1/3 -z-10 h-72 w-72 rounded-full bg-gold-deep/25 blur-3xl" />
          <div aria-hidden className="absolute -right-24 bottom-0 -z-10 h-80 w-80 rounded-full bg-[#7a3550]/35 blur-3xl" />
          {SPARKS.map(([c, d], i) => (
            <svg key={i} viewBox="-16 -16 32 32" aria-hidden className={`fx-twinkle absolute -z-10 text-[#f0cf9c]/80 ${c}`} style={{ "--d": d } as React.CSSProperties}><path d={SPARKLE_PATH} fill="currentColor" /></svg>
          ))}

          <div className="mx-auto max-w-xl text-center">
            <p className="eyebrow !text-[#e9b8c4]">Shop with confidence</p>
            <h2 id="promise-h" className="mt-3 font-serif text-3xl leading-tight text-ivory sm:text-5xl">The Zebella <span className="italic text-[#f0cf9c]">Promise</span></h2>
          </div>

          <ul className="relative mt-8 grid grid-cols-2 gap-x-3 gap-y-9 sm:mt-12 lg:grid-cols-4">
            {/* dotted thread joining the four icons (desktop) */}
            <li aria-hidden className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-10 hidden border-t border-dashed border-white/20 lg:block" />
            {TRUST.map(({ icon: Icon, title, text }) => (
              <li key={title} className="group relative flex flex-col items-center text-center">
                <span className="rounded-full bg-gradient-to-br from-[#f0cf9c] via-rose-soft to-gold-deep p-[1.5px] shadow-[0_0_0_6px_rgba(185,110,124,.10)] transition duration-500 group-hover:-translate-y-1.5 group-hover:shadow-[0_0_0_8px_rgba(185,110,124,.16),0_14px_40px_-6px_rgba(240,207,156,.45)]">
                  <span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#4a2438,#24111b)] text-[#f6d9a8] sm:h-20 sm:w-20">
                    <Icon size={30} strokeWidth={1.2} aria-hidden className="transition duration-500 group-hover:scale-110" />
                  </span>
                </span>
                <span className="mt-5 font-serif text-xl leading-tight text-ivory transition-colors duration-500 group-hover:text-[#f6d9a8] sm:text-2xl">{title}</span>
                <span className="mt-2 max-w-[15rem] px-2 text-xs leading-relaxed text-ivory/65 sm:text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
