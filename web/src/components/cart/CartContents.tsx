"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { useQuote } from "@/lib/use-quote";
import { formatINR } from "@/lib/commerce/money";
import { MAX_QTY_PER_LINE } from "@/lib/commerce/catalog-rules";
import type { Quote } from "@/lib/types";

/** Shared bag UI used by the slide-in drawer and the full /cart page. All figures come from the server quote. */
export function CartContents({ onNavigate, variant = "page" }: { onNavigate?: () => void; variant?: "page" | "drawer" }) {
  const cart = useCart();
  const { quote, loading, error, configured } = useQuote(cart.items, cart.couponCode);

  if (cart.items.length === 0)
    return (
      <div className="py-16 text-center">
        <p className="font-serif text-3xl">Your bag is empty</p>
        <p className="mt-2 text-taupe-deep">Discover something you&apos;ll love.</p>
        <Link href="/shop" onClick={onNavigate} className="btn btn-solid mt-8">Continue shopping</Link>
      </div>
    );

  return (
    <div className={variant === "page" ? "grid gap-12 lg:grid-cols-[1fr_24rem]" : "flex min-h-0 flex-1 flex-col"}>
      <div className={variant === "drawer" ? "min-h-0 flex-1 overflow-y-auto" : ""}>
        {!configured && <p className="mb-4 bg-cream p-3 text-sm">The store backend is not connected yet, so prices can&apos;t be confirmed.</p>}
        {error && <p role="alert" className="mb-4 bg-red-50 p-3 text-sm text-danger">{error}</p>}
        <ul className="divide-y divide-line">
          {(quote?.lines ?? cart.items.map((i) => ({ ...i, name: "Loading…", unitPrice: 0, lineTotal: 0, quantity: i.quantity, image: undefined, slug: "", size: undefined, color: undefined, issue: undefined, available: MAX_QTY_PER_LINE, sku: "", listPrice: 0, collectionIds: [] }))).map((l) => (
            <li key={`${l.productId}:${l.variantId}`} className="flex gap-4 py-5">
              <Link href={l.slug ? `/products/${l.slug}` : "#"} onClick={onNavigate} className="relative block aspect-[3/4] w-24 shrink-0 bg-cream">
                {l.image ? <Image src={l.image} alt="" fill sizes="96px" className="object-cover" /> : <div className="skeleton h-full w-full" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-serif text-xl leading-tight">{l.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-widest text-taupe-deep">{[l.size, l.color].filter(Boolean).join(" · ")}</p>
                  </div>
                  <button onClick={() => cart.remove(l.productId, l.variantId)} aria-label={`Remove ${l.name}`} className="-m-2 grid h-10 w-10 place-items-center text-taupe-deep hover:text-espresso"><X size={16} /></button>
                </div>
                {l.issue && <p role="alert" className="mt-2 text-sm text-danger">{l.issue}</p>}
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="inline-flex items-center border border-line" role="group" aria-label={`Quantity for ${l.name}`}>
                    <button className="grid h-10 w-10 place-items-center disabled:opacity-40" disabled={l.quantity <= 1} onClick={() => cart.setQty(l.productId, l.variantId, l.quantity - 1)} aria-label="Decrease quantity"><Minus size={14} /></button>
                    <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">{l.quantity}</span>
                    <button className="grid h-10 w-10 place-items-center disabled:opacity-40" disabled={l.quantity >= Math.min(MAX_QTY_PER_LINE, l.available || MAX_QTY_PER_LINE)} onClick={() => cart.setQty(l.productId, l.variantId, l.quantity + 1)} aria-label="Increase quantity"><Plus size={14} /></button>
                  </div>
                  <p className="text-sm tabular-nums">{l.issue ? "—" : formatINR(l.lineTotal)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className={variant === "drawer" ? "border-t border-line pt-5" : "h-fit bg-white p-6 lg:sticky lg:top-28"} aria-label="Order summary" aria-busy={loading}>
        <Summary quote={quote} loading={loading} />
        <CouponBox quote={quote} />
        <Link href="/checkout" onClick={onNavigate} aria-disabled={!quote?.valid}
          className={`btn btn-solid mt-5 w-full ${!quote?.valid ? "pointer-events-none opacity-50" : ""}`}>Checkout <span className="arrow">→</span></Link>
        {variant === "drawer" && <Link href="/cart" onClick={onNavigate} className="link-underline mt-4 block text-center text-xs uppercase tracking-[0.2em]">View bag</Link>}
        {quote && !quote.valid && <p className="mt-3 text-center text-sm text-danger">Fix the items marked above to continue.</p>}
      </aside>
    </div>
  );
}

function Summary({ quote, loading }: { quote: Quote | null; loading: boolean }) {
  const row = "flex justify-between py-1 text-sm";
  return (
    <dl className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
      <div className={row}><dt>Subtotal</dt><dd className="tabular-nums">{quote ? formatINR(quote.subtotal) : "—"}</dd></div>
      {quote && quote.discount > 0 && <div className={`${row} text-ok`}><dt>Discount {quote.couponCode && `(${quote.couponCode})`}</dt><dd className="tabular-nums">−{formatINR(quote.discount)}</dd></div>}
      <div className={row}><dt>Shipping</dt><dd className="tabular-nums">{quote ? (quote.shipping === 0 ? "Complimentary" : formatINR(quote.shipping)) : "—"}</dd></div>
      {quote?.freeShippingRemaining ? <p className="py-1 text-xs text-gold-deep">Add {formatINR(quote.freeShippingRemaining)} more for complimentary shipping</p> : null}
      <div className="mt-2 flex justify-between border-t border-line pt-3 font-serif text-2xl"><dt>Estimated total</dt><dd className="tabular-nums">{quote ? formatINR(quote.total) : "—"}</dd></div>
      {quote && quote.taxIncluded > 0 && <p className="mt-1 text-xs text-taupe-deep">Includes {formatINR(quote.taxIncluded)} GST</p>}
    </dl>
  );
}

function CouponBox({ quote }: { quote: Quote | null }) {
  const cart = useCart();
  const [code, setCode] = useState("");
  return (
    <div className="mt-5">
      {cart.couponCode && quote?.couponCode ? (
        <p className="flex items-center justify-between text-sm">Coupon <b>{quote.couponCode}</b> applied <button className="underline" onClick={() => cart.setCoupon("")}>Remove</button></p>
      ) : (
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (code.trim()) { cart.setCoupon(code.trim().toUpperCase()); setCode(""); } }}>
          <label htmlFor="coupon" className="sr-only">Coupon code</label>
          <input id="coupon" className="field uppercase" placeholder="Coupon code" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn btn-ghost px-5" type="submit">Apply</button>
        </form>
      )}
      {cart.couponCode && quote?.couponError && <p role="alert" className="mt-2 text-sm text-danger">{quote.couponError} <button className="underline" onClick={() => cart.setCoupon("")}>Clear</button></p>}
    </div>
  );
}
