"use client";
import { useState } from "react";
import { Check, RotateCcw, ShieldCheck, Tag, Truck, X } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { formatINR } from "@/lib/commerce/money";
import type { Quote } from "@/lib/types";

/** Progress towards complimentary shipping — the classic fashion-store nudge. */
export function FreeShippingBar({ quote }: { quote: Quote | null }) {
  if (!quote || !quote.lines.length) return null;
  const after = quote.subtotal - quote.discount;
  const remaining = quote.freeShippingRemaining;
  const unlocked = !remaining;
  const pct = unlocked ? 100 : Math.max(6, Math.min(100, Math.round((after / (after + remaining)) * 100)));
  return (
    <div className="rounded-2xl border border-line bg-white/70 p-4" role="status">
      <p className="flex items-center gap-2 text-sm">
        {unlocked ? <Check size={16} className="text-ok" aria-hidden /> : <Truck size={16} className="text-gold-deep" aria-hidden />}
        {unlocked ? <span><b className="font-medium">You&apos;ve unlocked complimentary shipping</b></span> : <span>Add <b className="font-medium">{formatINR(remaining)}</b> more for complimentary shipping</span>}
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blush" aria-hidden>
        <div className="h-full rounded-full bg-gradient-to-r from-rose-soft via-gold to-gold-deep transition-[width] duration-700 ease-[var(--ease-lux)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Summary({ quote, loading }: { quote: Quote | null; loading: boolean }) {
  const row = "flex items-baseline justify-between py-1 text-sm";
  return (
    <dl className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
      <div className={row}><dt className="text-taupe-deep">Subtotal</dt><dd className="tabular-nums">{quote ? formatINR(quote.subtotal) : "—"}</dd></div>
      {quote && quote.discount > 0 && <div className={`${row} text-ok`}><dt>Discount {quote.couponCode && `(${quote.couponCode})`}</dt><dd className="tabular-nums">−{formatINR(quote.discount)}</dd></div>}
      <div className={row}><dt className="text-taupe-deep">Shipping</dt><dd className="tabular-nums">{quote ? (quote.shipping === 0 ? <span className="text-ok">Complimentary</span> : formatINR(quote.shipping)) : "—"}</dd></div>
      <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-line pt-4"><dt className="font-serif text-2xl">Total</dt><dd className="font-serif text-3xl tabular-nums">{quote ? formatINR(quote.total) : "—"}</dd></div>
      {quote && quote.taxIncluded > 0 && <p className="mt-1 text-right text-xs text-taupe-deep">Includes {formatINR(quote.taxIncluded)} GST</p>}
    </dl>
  );
}

export function CouponBox({ quote }: { quote: Quote | null }) {
  const cart = useCart();
  const [code, setCode] = useState("");
  const applied = cart.couponCode && quote?.couponCode;
  return (
    <div>
      {applied ? (
        <p className="flex items-center justify-between rounded-xl border border-ok/30 bg-green-50 px-4 py-3 text-sm text-ok">
          <span className="inline-flex items-center gap-2"><Tag size={15} aria-hidden /> <b className="font-medium">{quote.couponCode}</b> applied</span>
          <button className="inline-flex items-center gap-1 text-xs underline" onClick={() => cart.setCoupon("")}><X size={12} aria-hidden />Remove</button>
        </p>
      ) : (
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (code.trim()) { cart.setCoupon(code.trim().toUpperCase()); setCode(""); } }}>
          <label htmlFor="coupon" className="sr-only">Coupon code</label>
          <div className="relative min-w-0 flex-1">
            <Tag size={16} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-taupe-deep" />
            <input id="coupon" className="field !min-h-12 !pl-11 uppercase" placeholder="Coupon code" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <button className="btn btn-ghost !min-h-12 px-5" type="submit">Apply</button>
        </form>
      )}
      {cart.couponCode && quote?.couponError && <p role="alert" className="mt-2 text-sm text-danger">{quote.couponError} <button className="underline" onClick={() => cart.setCoupon("")}>Clear</button></p>}
    </div>
  );
}

const TRUST = [
  { icon: ShieldCheck, text: "Secure payment" },
  { icon: RotateCcw, text: "7-day returns" },
  { icon: Truck, text: "Pan-India delivery" },
];
export function TrustRow() {
  return (
    <ul className="grid grid-cols-3 gap-2 text-center">
      {TRUST.map(({ icon: Icon, text }) => (
        <li key={text} className="rounded-xl bg-blush/50 px-2 py-3 text-[0.68rem] leading-4 text-taupe-deep"><Icon size={17} strokeWidth={1.5} className="mx-auto mb-1.5 text-gold-deep" aria-hidden />{text}</li>
      ))}
    </ul>
  );
}
