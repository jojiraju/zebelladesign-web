"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, Heart } from "lucide-react";
import { Price } from "@/components/ui/Price";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { totalAvailable } from "@/lib/commerce/catalog-rules";
import type { Product } from "@/lib/types";
import dynamic from "next/dynamic";

const QuickView = dynamic(() => import("./QuickView").then((m) => m.QuickView), { ssr: false });

export function ProductCard({ product, priority = false, sizes = "(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw" }: { product: Product; priority?: boolean; sizes?: string }) {
  const wish = useWishlist();
  const toast = useToast();
  const [quick, setQuick] = useState(false);
  const wished = wish.has(product.id);
  const [img1, img2] = product.images;
  const colors = [...new Map(product.variants.filter((v) => v.color).map((v) => [v.color!, v.colorHex])).entries()];
  const soldOut = totalAvailable(product) <= 0;
  const badge = soldOut ? "Sold out" : product.newArrival ? "New" : product.bestSeller ? "Best seller" : null;

  return (
    <article className="group relative transition-transform duration-500 ease-[var(--ease-lux)] hover:-translate-y-1.5">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-cream shadow-sm transition-shadow duration-500 group-hover:shadow-[0_28px_50px_-24px_rgba(143,74,91,.55)]">
        <Link href={`/products/${product.slug}`} aria-label={product.name} className="absolute inset-0 z-[1]">
          {img1 ? (
            <>
              <Image src={img1.url} alt={img1.alt || product.name} fill sizes={sizes} priority={priority}
                className={`object-cover transition-all duration-[1100ms] ease-[var(--ease-lux)] group-hover:scale-[1.04] ${img2 ? "group-hover:opacity-0" : ""} ${soldOut ? "opacity-70" : ""}`} />
              {img2 && <Image src={img2.url} alt="" fill sizes={sizes} className="object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100" />}
            </>
          ) : <div className="grid h-full place-items-center text-sm text-taupe-deep">No image</div>}
        </Link>
        {badge && <span className="absolute left-3 top-3 z-[2] rounded-full bg-ivory px-3 py-1 text-[0.62rem] font-medium uppercase tracking-[0.22em]">{badge}</span>}
        <button type="button" aria-pressed={wished} aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          onClick={() => toast(wish.toggle(product.id) ? "Saved to your wishlist" : "Removed from wishlist")}
          className="absolute right-2 top-2 z-[2] grid h-10 w-10 place-items-center rounded-full bg-ivory/85 backdrop-blur transition hover:bg-ivory">
          <Heart size={17} strokeWidth={1.5} className={`transition-all duration-300 ${wished ? "scale-110 fill-gold-deep text-gold-deep" : ""}`} />
        </button>
        <button type="button" onClick={() => setQuick(true)} aria-label={`Quick view ${product.name}`}
          className="absolute inset-x-3 bottom-3 z-[2] hidden translate-y-3 items-center justify-center gap-2 rounded-full bg-ivory/95 py-3 text-[0.68rem] font-medium uppercase tracking-[0.22em] opacity-0 transition-all duration-500 focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 md:flex">
          <Eye size={14} /> Quick view
        </button>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-serif text-xl leading-snug"><Link href={`/products/${product.slug}`} className="link-underline">{product.name}</Link></h3>
          <Price product={product} className="mt-1" />
        </div>
        {colors.length > 1 && (
          <ul className="mt-1.5 flex shrink-0 gap-1" aria-label="Available colours">
            {colors.slice(0, 4).map(([name, hex]) => <li key={name} title={name} className="h-3 w-3 rounded-full border border-line" style={{ background: hex || "#d8cbb8" }} />)}
            {colors.length > 4 && <li className="text-[0.65rem] text-taupe-deep">+{colors.length - 4}</li>}
          </ul>
        )}
      </div>
      {quick && <QuickView product={product} onClose={() => setQuick(false)} />}
    </article>
  );
}
