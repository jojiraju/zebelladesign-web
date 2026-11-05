"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Heart, Lock, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { ART } from "@/lib/art";
import { useCart } from "@/components/providers/CartProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { useQuote } from "@/lib/use-quote";
import { formatINR } from "@/lib/commerce/money";
import { MAX_QTY_PER_LINE } from "@/lib/commerce/catalog-rules";
import type { PricedLine } from "@/lib/types";
import { CouponBox, FreeShippingBar, Summary, TrustRow } from "./parts";

type Variant = "page" | "drawer";

function EmptyBag({ onNavigate, variant }: { onNavigate?: () => void; variant: Variant }) {
  return (
    <div className={`grid place-items-center text-center ${variant === "page" ? "py-16 sm:py-24" : "flex-1 py-10"}`}>
      <div>
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-blush to-rose-soft/50 text-gold-deep"><ShoppingBag size={30} strokeWidth={1.4} aria-hidden /></span>
        <p className="mt-6 font-serif text-3xl sm:text-4xl">Your bag is empty</p>
        <p className="mx-auto mt-2 max-w-xs text-taupe-deep">Discover something you&apos;ll love — new arrivals are waiting.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/shop?sort=newest" onClick={onNavigate} className="btn btn-solid">New arrivals</Link>
          <Link href="/collections" onClick={onNavigate} className="btn btn-ghost">Collections</Link>
        </div>
      </div>
    </div>
  );
}

function Line({ l, compact, onNavigate }: { l: PricedLine; compact: boolean; onNavigate?: () => void }) {
  const cart = useCart();
  const wish = useWishlist();
  const toast = useToast();
  const loading = l.name === "Loading…";
  const max = Math.min(MAX_QTY_PER_LINE, l.available || MAX_QTY_PER_LINE);
  const onSale = l.listPrice > l.unitPrice;

  function saveForLater() {
    if (!wish.has(l.productId)) wish.toggle(l.productId);
    cart.remove(l.productId, l.variantId);
    toast("Saved to your wishlist");
  }

  return (
    <li className={compact ? "flex gap-3.5 py-4" : "flex gap-4 rounded-2xl border border-line bg-white p-4 shadow-[0_18px_40px_-34px_rgba(143,74,91,.6)] sm:gap-5 sm:p-5"}>
      <Link href={l.slug ? `/products/${l.slug}` : "#"} onClick={onNavigate} className={`relative block shrink-0 overflow-hidden rounded-xl bg-cream ${compact ? "aspect-[3/4] w-20" : "aspect-[3/4] w-24 sm:w-32"}`}>
        {loading ? <div className="skeleton h-full w-full" /> : <Image src={l.image || ART.productPlaceholder} alt="" fill sizes="128px" className="object-cover object-top" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={l.slug ? `/products/${l.slug}` : "#"} onClick={onNavigate} className={`block truncate font-serif leading-tight hover:underline ${compact ? "text-lg" : "text-xl sm:text-2xl"}`}>{l.name}</Link>
            <p className="mt-1.5 flex flex-wrap gap-1.5">
              {l.size && <span className="rounded-full bg-blush/70 px-2.5 py-0.5 text-[0.66rem] font-medium uppercase tracking-wider text-taupe-deep">Size {l.size}</span>}
              {l.color && <span className="rounded-full bg-blush/70 px-2.5 py-0.5 text-[0.66rem] font-medium uppercase tracking-wider text-taupe-deep">{l.color}</span>}
            </p>
          </div>
          {compact && <button onClick={() => cart.remove(l.productId, l.variantId)} aria-label={`Remove ${l.name}`} className="-m-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-taupe-deep transition hover:bg-blush hover:text-danger"><Trash2 size={16} strokeWidth={1.5} /></button>}
        </div>
        {l.issue && <p role="alert" className="mt-2 text-sm text-danger">{l.issue}</p>}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
          <div className="inline-flex items-center rounded-full border border-line bg-white" role="group" aria-label={`Quantity for ${l.name}`}>
            <button className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-blush disabled:opacity-40" disabled={l.quantity <= 1} onClick={() => cart.setQty(l.productId, l.variantId, l.quantity - 1)} aria-label="Decrease quantity"><Minus size={14} /></button>
            <span className="w-7 text-center text-sm tabular-nums" aria-live="polite">{l.quantity}</span>
            <button className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-blush disabled:opacity-40" disabled={l.quantity >= max} onClick={() => cart.setQty(l.productId, l.variantId, l.quantity + 1)} aria-label="Increase quantity"><Plus size={14} /></button>
          </div>
          <p className="text-right tabular-nums">
            {l.issue ? "—" : <span className="font-serif text-xl">{formatINR(l.lineTotal)}</span>}
            {!l.issue && onSale && !loading && <s className="ml-2 text-xs text-taupe-deep">{formatINR(l.listPrice * l.quantity)}</s>}
          </p>
        </div>

        {!compact && !loading && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-3 text-[0.68rem] font-medium uppercase tracking-[0.1em] text-taupe-deep sm:gap-x-5 sm:text-xs sm:tracking-[0.14em] [&_button]:whitespace-nowrap">
            <button onClick={saveForLater} className="inline-flex items-center gap-1.5 transition hover:text-espresso"><Heart size={14} aria-hidden />Save for later</button>
            <button onClick={() => cart.remove(l.productId, l.variantId)} className="inline-flex items-center gap-1.5 transition hover:text-danger"><Trash2 size={14} aria-hidden />Remove</button>
          </div>
        )}
      </div>
    </li>
  );
}

/** Shared bag UI used by the slide-in drawer and the full /cart page. All figures come from the server quote. */
export function CartContents({ onNavigate, variant = "page" }: { onNavigate?: () => void; variant?: Variant }) {
  const cart = useCart();
  const { quote, loading, error, configured } = useQuote(cart.items, cart.couponCode);
  const compact = variant === "drawer";

  if (cart.items.length === 0) return <EmptyBag onNavigate={onNavigate} variant={variant} />;

  const lines: PricedLine[] = quote?.lines ?? cart.items.map((i) => ({ ...i, name: "Loading…", unitPrice: 0, lineTotal: 0, image: undefined, slug: "", size: undefined, color: undefined, issue: undefined, available: MAX_QTY_PER_LINE, sku: "", listPrice: 0, collectionIds: [] }));

  const checkout = (
    <Link href="/checkout" onClick={onNavigate} aria-disabled={!quote?.valid}
      className={`btn w-full !rounded-xl !border-transparent !text-white shadow-[0_14px_28px_-14px_rgba(35,26,29,.8)] hover:brightness-125 ${!quote?.valid ? "pointer-events-none opacity-50" : ""}`}
      style={{ backgroundImage: "linear-gradient(90deg, #231a1d 0%, #5a2e3a 100%)" }}>
      <Lock size={15} aria-hidden /> Checkout <ArrowRight size={16} className="arrow" aria-hidden />
    </Link>
  );

  return (
    <div className={variant === "page" ? "grid gap-8 lg:grid-cols-[1fr_25rem] lg:gap-10" : "flex min-h-0 flex-1 flex-col"}>
      <div className={compact ? "min-h-0 flex-1 overflow-y-auto px-6" : "min-w-0 space-y-5"}>
        {!configured && <p className="mb-4 rounded-xl bg-cream p-3 text-sm">The store backend is not connected yet, so prices can&apos;t be confirmed.</p>}
        {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-danger">{error}</p>}
        <div className={compact ? "pt-1" : ""}><FreeShippingBar quote={quote} /></div>
        <ul className={compact ? "divide-y divide-line" : "space-y-4"}>
          {lines.map((l) => <Line key={`${l.productId}:${l.variantId}`} l={l} compact={compact} onNavigate={onNavigate} />)}
        </ul>
      </div>

      <aside className={compact ? "space-y-4 border-t border-line bg-white/60 px-6 pb-6 pt-5" : "h-fit min-w-0 space-y-5 rounded-2xl border border-line bg-white p-6 shadow-[0_30px_60px_-40px_rgba(143,74,91,.55)] lg:sticky lg:top-28"} aria-label="Order summary" aria-busy={loading}>
        {!compact && <h2 className="font-serif text-2xl">Order summary</h2>}
        <CouponBox quote={quote} />
        <Summary quote={quote} loading={loading} />
        {checkout}
        {compact ? <Link href="/cart" onClick={onNavigate} className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-espresso/25 bg-white text-xs font-semibold uppercase tracking-[0.2em] text-espresso transition duration-300 hover:border-gold-deep hover:bg-blush hover:text-gold-deep"><ShoppingBag size={15} aria-hidden />View full bag<ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden /></Link> : <TrustRow />}
        {quote && !quote.valid && <p className="text-center text-sm text-danger">Fix the items marked above to continue.</p>}
      </aside>
    </div>
  );
}
