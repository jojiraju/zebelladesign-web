import { formatINR, discountPercent } from "@/lib/commerce/money";
import { effectivePrice } from "@/lib/commerce/catalog-rules";
import type { Product } from "@/lib/types";

/** Shows the selling price; shows MRP and a % off ONLY when the product genuinely has a lower sale price. */
export function Price({ product, className = "", size = "base", variant = "default" }: { product: Pick<Product, "price" | "salePrice">; className?: string; size?: "base" | "lg"; variant?: "default" | "card" }) {
  const sell = effectivePrice(product);
  const off = discountPercent(product.price, sell);
  if (variant === "card") {
    // Storefront card: bold red selling price with the struck-through MRP (the % off lives on the image badge).
    return (
      <p className={`flex flex-wrap items-baseline gap-x-2 text-[0.95rem] ${className}`}>
        <span className={`font-bold ${off > 0 ? "text-[#b3123f]" : ""}`}>{formatINR(sell)}</span>
        {off > 0 && <s className="text-sm text-taupe-deep" aria-label={`Original price ${formatINR(product.price)}`}>{formatINR(product.price)}</s>}
      </p>
    );
  }
  return (
    <p className={`flex flex-wrap items-baseline gap-x-3 ${size === "lg" ? "text-xl" : "text-[0.95rem]"} ${className}`}>
      <span className="font-medium">{formatINR(sell)}</span>
      {off > 0 && (
        <>
          <s className="text-taupe-deep" aria-label={`Original price ${formatINR(product.price)}`}>{formatINR(product.price)}</s>
          <span className="text-xs uppercase tracking-widest text-gold-deep">{off}% off</span>
        </>
      )}
    </p>
  );
}
