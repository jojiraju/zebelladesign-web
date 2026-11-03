"use client";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { Price } from "@/components/ui/Price";
import { ProductPurchase } from "./ProductPurchase";
import type { Product } from "@/lib/types";

export function QuickView({ product, onClose }: { product: Product; onClose(): void }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", esc); };
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-[75] grid place-items-center bg-espresso/55 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose}>
      <motion.div role="dialog" aria-modal="true" aria-label={`Quick view: ${product.name}`} onClick={(e) => e.stopPropagation()}
        className="relative grid max-h-[92vh] w-full max-w-4xl overflow-y-auto bg-ivory md:grid-cols-2"
        initial={{ y: 30, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
        <div className="relative aspect-[3/4] bg-cream md:aspect-auto md:min-h-[32rem]">
          {product.images[0] && <Image src={product.images[0].url} alt={product.images[0].alt || product.name} fill sizes="(min-width:768px) 400px, 100vw" className="object-cover" />}
        </div>
        <div className="p-6 sm:p-9">
          <button autoFocus onClick={onClose} aria-label="Close quick view" className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center bg-ivory/80"><X size={20} /></button>
          <p className="eyebrow">{product.categorySlug.replace(/-/g, " ")}</p>
          <h2 className="mt-2 font-serif text-3xl leading-tight">{product.name}</h2>
          <Price product={product} className="mt-2" size="lg" />
          <ProductPurchase product={product} onAdded={onClose} />
          <Link href={`/products/${product.slug}`} className="link-underline mt-8 inline-block text-xs uppercase tracking-[0.22em]">View full details</Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
