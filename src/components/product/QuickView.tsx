"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, RotateCcw, Truck, X } from "lucide-react";
import { ART } from "@/lib/art";
import { Price } from "@/components/ui/Price";
import { ProductPurchase } from "./ProductPurchase";
import type { Product } from "@/lib/types";

export function QuickView({ product, onClose }: { product: Product; onClose(): void }) {
  const panel = useRef<HTMLDivElement>(null);
  const [img, setImg] = useState(0);
  const images = product.images.length ? product.images : [{ url: ART.productPlaceholder, alt: product.name }];
  const badge = product.newArrival ? "New" : product.bestSeller ? "Best seller" : null;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus({ preventScroll: true });
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", esc); };
  }, [onClose]);

  // Portal to <body>: product cards use transforms, which would otherwise become the containing block for `fixed`.
  return createPortal(
    <motion.div className="fixed inset-0 z-[75] grid items-end bg-espresso/60 backdrop-blur-sm sm:place-items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose}>
      <motion.div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`Quick view: ${product.name}`} onClick={(e) => e.stopPropagation()}
        className="relative grid max-h-[94svh] w-full max-w-5xl grid-rows-[15rem_minmax(0,1fr)] overflow-hidden rounded-t-[2rem] bg-ivory shadow-[0_40px_100px_-30px_rgba(0,0,0,.65)] outline-none sm:h-[min(42rem,90svh)] sm:grid-cols-[1fr_1.08fr] sm:grid-rows-1 sm:rounded-[2rem]"
        initial={{ y: 40, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>

        <button onClick={onClose} aria-label="Close quick view" className="absolute right-4 top-4 z-20 grid h-11 w-11 place-items-center rounded-full bg-white/90 shadow-md outline-none transition hover:rotate-90 hover:bg-blush focus-visible:ring-2 focus-visible:ring-gold-deep"><X size={19} /></button>

        {/* Photo */}
        <div className="relative min-h-0 bg-cream">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={img} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <Image src={images[img].url} alt={images[img].alt || product.name} fill sizes="(min-width:640px) 480px, 100vw" className="object-cover object-top" priority />
            </motion.div>
          </AnimatePresence>
          <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-espresso/45 to-transparent" />
          {badge && <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3.5 py-1.5 text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-gold-deep shadow">{badge}</span>}
          {images.length > 1 && (
            <ul className="absolute bottom-4 left-4 flex gap-2" aria-label="Photos">
              {images.map((im, i) => (
                <li key={im.url}>
                  <button type="button" onClick={() => setImg(i)} aria-label={`Photo ${i + 1}`} aria-current={i === img} className={`relative block h-16 w-12 overflow-hidden rounded-lg border-2 bg-cream shadow-md transition ${i === img ? "border-white" : "border-white/40 opacity-80 hover:opacity-100"}`}>
                    <Image src={im.url} alt="" fill sizes="48px" className="object-cover object-top" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Details */}
        <div className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-3 pt-5 sm:px-8 sm:pt-7 no-scrollbar">
            <p className="eyebrow">{product.categorySlug.replace(/-/g, " ")}</p>
            <h2 className="mt-2 pr-12 font-serif text-3xl leading-[1.1] sm:text-[2rem]">{product.name}</h2>
            <Price product={product} className="mt-2" size="lg" />
            <ProductPurchase compact product={product} onAdded={onClose} />
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-line bg-white/60 px-6 py-4 sm:px-9">
            <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-taupe-deep">
              <span className="inline-flex items-center gap-1.5"><Truck size={14} className="text-gold-deep" aria-hidden />Free shipping over ₹2,999</span>
              <span className="inline-flex items-center gap-1.5"><RotateCcw size={14} className="text-gold-deep" aria-hidden />7-day returns</span>
            </p>
            <Link href={`/products/${product.slug}`} className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold-deep">Full details <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" aria-hidden /></Link>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
