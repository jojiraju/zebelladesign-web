"use client";

/**
 * Shop From Reels — modelled on the shoppable-reels flow of a reference boutique store:
 *  - Landing: horizontal strip of 9:16 cards. Video cards loop a muted 3-second preview while on screen.
 *  - Click a card: full-screen player. One reel at a time; change reel with wheel / swipe / ↑↓ keys / side buttons.
 *    Active reel autoplays muted (mute toggle), neighbours are preloaded. Esc or X closes.
 *  - Bottom "buying card": product thumbnail, name, price (+MRP and % off). Products that need a size/colour
 *    open a bottom sheet to choose and add to bag; simple products add straight to bag. Cart button top right.
 *  - "View all" opens /shop-from-reels, a grid of every reel.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, ChevronUp, Play, ShoppingBag, Volume2, VolumeX, X } from "lucide-react";
import { Reveal } from "@/components/ui/motion";
import { ShelfHead } from "./ShelfHead";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { useCart } from "@/components/providers/CartProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { formatINR } from "@/lib/commerce/money";
import { availableUnits, effectivePrice, needsColor, needsSize, totalAvailable } from "@/lib/commerce/catalog-rules";
import { ART } from "@/lib/art";
import type { Product } from "@/lib/types";

const WHEEL_COOLDOWN_MS = 600;
const SWIPE_PX = 50;

const coverOf = (p: Product) => p.images[0]?.url || ART.productPlaceholder;

const IG_GLYPH = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".6" fill="currentColor" />
  </svg>
);

export function ReelsHeading({ instagram, as: H = "h2" }: { instagram?: string; as?: "h1" | "h2" }) {
  return (
    <div className="mx-auto mb-8 flex max-w-2xl flex-col items-center text-center sm:mb-12">
      <a href={instagram || "#"} target="_blank" rel="noopener noreferrer" aria-label="Zebella on Instagram"
        className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white shadow-lg transition hover:scale-105">
        {IG_GLYPH}
      </a>
      <H id="reels-h" className="mt-4 font-serif text-4xl leading-tight sm:text-6xl">Shop From <span className="italic text-gradient">Reels</span></H>
      <p className="mt-3 text-taupe-deep">See each piece in motion, then bring it home in a tap.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Card: still image, or a muted looping 3s preview while visible      */
/* ------------------------------------------------------------------ */
function ReelThumb({ product, sizes, previewMode = "visible", hovered = false, caption = false, index = 0 }: { product: Product; sizes: string; previewMode?: "visible" | "hover"; hovered?: boolean; caption?: boolean; index?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const hasVideo = !!product.videoUrl;
  const playing = hasVideo && (previewMode === "hover" ? hovered : visible);

  useEffect(() => {
    if (!hasVideo || previewMode !== "visible" || !ref.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "100px", threshold: 0.35 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [hasVideo, previewMode]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) v.play().catch(() => {}); else v.pause();
  }, [playing]);

  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden bg-espresso">
      {/* the zoom lives on this wrapper so it never fights the photo drift animation */}
      <div className="absolute inset-0 transition-transform duration-[1400ms] ease-[var(--ease-lux)] group-hover:scale-[1.06]">
        <Image src={coverOf(product)} alt={product.name} fill sizes={sizes} className={`object-cover object-top ${hasVideo ? "" : "reel-drift"}`} style={hasVideo ? undefined : { animationDelay: `${-(index % 5) * 1.6}s` }} />
        {hasVideo && (
          <video ref={videoRef} src={product.videoUrl} poster={coverOf(product)} muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" />
        )}
      </div>
      {caption && (
        <>
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-espresso/85 via-espresso/30 to-transparent" />
          {hasVideo && (
            <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff5c8a]" />Reel
            </span>
          )}
          <span aria-hidden className="absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full bg-white/25 text-white ring-1 ring-white/40 backdrop-blur-md transition duration-300 group-hover:scale-110 group-hover:bg-white group-hover:text-gold-deep">
            <Play size={14} fill="currentColor" className="ml-0.5" />
          </span>
          <span className="absolute inset-x-0 bottom-0 p-3 text-left text-ivory sm:p-4">
            <span className="line-clamp-2 block font-serif text-[0.95rem] leading-snug sm:text-lg">{product.name}</span>
            <span className="mt-1.5 flex items-center justify-between gap-2">
              <span className="text-xs font-medium tracking-wide sm:text-sm">{formatINR(effectivePrice(product))}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-espresso transition group-hover:bg-gold-deep group-hover:text-white">Shop <ArrowRight size={10} aria-hidden /></span>
            </span>
          </span>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Buying card + options sheet                                         */
/* ------------------------------------------------------------------ */
function PriceBlock({ product, size = "base" }: { product: Product; size?: "base" | "lg" }) {
  const now = effectivePrice(product);
  const off = now < product.price ? Math.round(((product.price - now) / product.price) * 100) : 0;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span className={`font-bold ${size === "lg" ? "text-lg" : "text-base"}`}>{formatINR(now)}</span>
      {off > 0 && <><del className="text-sm text-gray-500">{formatINR(product.price)}</del><span className="text-sm text-orange-500">({off}% OFF)</span></>}
    </div>
  );
}

/** Solid, high-contrast brand button so it clearly reads as tappable. */
const CTA = "mt-2 inline-flex h-10 cursor-pointer min-w-[130px] items-center justify-center gap-2 rounded-full bg-gold-deep px-5 text-[13px] font-semibold tracking-wide text-white shadow-[0_8px_18px_-6px_rgba(143,74,91,.8)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-95";

function BuyingCard({ product, onShopNow }: { product: Product; onShopNow: () => void }) {
  const cart = useCart();
  const toast = useToast();
  const soldOut = totalAvailable(product) <= 0;
  const simple = !needsSize(product) && !needsColor(product);
  const variant = simple ? product.variants.find((v) => availableUnits(v) > 0) : undefined;

  function addSimple() {
    if (!variant) return;
    cart.add({ productId: product.id, variantId: variant.id, quantity: 1 });
    toast(`${product.name} added to your bag`);
  }

  return (
    <div className="flex items-stretch gap-3 rounded-2xl bg-white p-3 text-left shadow-[0_20px_50px_-10px_rgba(0,0,0,.55)]">
      <Link href={`/products/${product.slug}`} aria-label={`View ${product.name} details`} className="relative w-20 shrink-0 self-stretch overflow-hidden rounded-xl bg-cream">
        <Image src={coverOf(product)} alt="" fill sizes="80px" className="object-cover object-top" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col items-start">
        <Link href={`/products/${product.slug}`} className="line-clamp-2 font-serif text-base leading-snug text-espresso hover:underline">{product.name}</Link>
        <PriceBlock product={product} />
        {soldOut ? (
          <button type="button" disabled className="mt-2 h-[34px] min-w-[90px] cursor-not-allowed rounded-lg bg-gray-200 px-4 text-xs font-semibold text-gray-600">Sold out</button>
        ) : simple ? (
          <button type="button" onClick={addSimple} className={CTA}>Add to Cart <ShoppingBag size={14} aria-hidden /></button>
        ) : (
          <button type="button" onClick={onShopNow} className={CTA}>Shop Now <ArrowRight size={14} aria-hidden /></button>
        )}
      </div>
    </div>
  );
}

function OptionsSheet({ product, onClose }: { product: Product; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-black/30" onClick={onClose} onWheel={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <div className="relative max-h-[75%] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start gap-3">
          <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-cream">
            <Image src={coverOf(product)} alt={product.name} fill sizes="80px" className="object-cover object-top" />
          </div>
          <div className="min-w-0 flex-1">
            <Link href={`/products/${product.slug}`} className="text-base font-semibold text-gray-800 hover:underline">{product.name}</Link>
            <div className="mt-1"><PriceBlock product={product} size="lg" /></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 transition hover:text-gray-600"><X size={18} /></button>
        </div>
        <ProductPurchase product={product} compact hideWishlist onAdded={onClose} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Full-screen player                                                  */
/* ------------------------------------------------------------------ */
export function ReelViewer({ reels, startIndex, onClose }: { reels: Product[]; startIndex: number; onClose: () => void }) {
  const router = useRouter();
  const cart = useCart();
  const [index, setIndex] = useState(() => Math.min(Math.max(startIndex, 0), reels.length - 1));
  const [muted, setMuted] = useState(true);
  const [sheet, setSheet] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastWheel = useRef(0);
  const drag = useRef<{ y: number; done: boolean } | null>(null);

  const go = useCallback((d: number) => {
    setSheet(false);
    setIndex((i) => Math.min(Math.max(i + d, 0), reels.length - 1));
  }, [reels.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (sheet) setSheet(false); else onClose(); }
      else if (e.key === "ArrowDown" && !sheet) { e.preventDefault(); go(1); }
      else if (e.key === "ArrowUp" && !sheet) { e.preventDefault(); go(-1); }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [go, onClose, sheet]);

  // Keep the live <video> in sync with the mute toggle.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    if (!muted) v.play().catch(() => {});
  }, [muted, index]);

  // Warm the neighbours' video so swiping feels instant.
  useEffect(() => {
    const links: HTMLVideoElement[] = [];
    for (const n of [reels[index + 1], reels[index - 1]]) {
      if (!n?.videoUrl) continue;
      const v = document.createElement("video");
      v.preload = "metadata"; v.muted = true; v.src = n.videoUrl;
      links.push(v);
    }
    return () => links.forEach((v) => { v.removeAttribute("src"); v.load(); });
  }, [index, reels]);

  const onWheel = (e: React.WheelEvent) => {
    if (sheet) return;
    const now = Date.now();
    if (now - lastWheel.current < WHEEL_COOLDOWN_MS) return;
    lastWheel.current = now;
    if (e.deltaY > 0) go(1); else if (e.deltaY < 0) go(-1);
  };
  const onPointerDown = (e: React.PointerEvent) => { if (!sheet) drag.current = { y: e.clientY, done: false }; };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.done) return;
    const dy = e.clientY - d.y;
    if (Math.abs(dy) > SWIPE_PX) { d.done = true; go(dy < 0 ? 1 : -1); }
  };
  const onPointerEnd = () => { drag.current = null; };

  const current = reels[index];

  return (
    <div role="dialog" aria-modal="true" aria-label="Shop From Reels" className="reel-player fixed inset-0 z-[100] flex items-center justify-center bg-black/80" onClick={onClose} onWheel={onWheel}>
      <div className="relative aspect-[9/16] h-full max-h-[100dvh] max-w-full overflow-hidden bg-black sm:h-[94dvh] sm:rounded-[2rem]" onClick={(e) => e.stopPropagation()}
        style={{ touchAction: "pan-x" }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}>

        {/* vertical track */}
        <div className="flex h-full flex-col transition-transform duration-[400ms] ease-[cubic-bezier(.22,1,.36,1)] will-change-transform" style={{ transform: `translateY(-${index * 100}%)` }}>
          {reels.map((r, i) => (
            <div key={r.id} className="relative min-h-0 w-full flex-[0_0_100%]">
              {i === index && r.videoUrl ? (
                <video ref={videoRef} src={r.videoUrl} poster={coverOf(r)} autoPlay muted playsInline loop preload="metadata" disablePictureInPicture
                  controlsList="nodownload noplaybackrate" className="h-full w-full bg-black object-cover" />
              ) : Math.abs(i - index) <= 1 ? (
                <Image src={coverOf(r)} alt={r.name} fill sizes="(max-width:768px) 100vw, 60vh" className="bg-black object-cover object-top" priority={i === index} />
              ) : null}
              {i === index && (
                <div className="absolute inset-x-0 bottom-3 mx-auto w-[95%] max-w-sm">
                  <BuyingCard product={r} onShopNow={() => setSheet(true)} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* soft top / bottom shading for legibility, plus a reel counter */}
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent" />
        <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="pointer-events-none absolute left-4 top-6 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-md">
          {String(index + 1).padStart(2, "0")} / {String(reels.length).padStart(2, "0")}
        </span>

        {/* top-right: close + cart */}
        <div className="absolute right-3 z-10 flex flex-col gap-3" style={{ top: "calc(40px + env(safe-area-inset-top, 0px))" }}>
          <button type="button" onClick={onClose} aria-label="Close reel player" className="grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white transition hover:bg-black/70"><X size={18} /></button>
          <button type="button" onClick={() => { onClose(); router.push("/cart"); }} aria-label={cart.count === 1 ? "Cart, 1 item" : `Cart, ${cart.count} items`}
            className="relative grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80">
            <ShoppingBag size={18} />
            {cart.count > 0 && <span className="absolute -right-2 -top-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold-deep px-1 text-[11px] font-semibold leading-none text-white">{cart.count}</span>}
          </button>
        </div>

        {/* mute toggle (video reels only) */}
        {current.videoUrl && (
          <div className="absolute bottom-36 right-3 z-10">
            <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Unmute reel" : "Mute reel"} className="grid h-11 w-11 place-items-center text-white drop-shadow-[0_0_2px_rgba(0,0,0,.6)]">
              {muted ? <VolumeX size={26} /> : <Volume2 size={26} />}
            </button>
          </div>
        )}

        {sheet && <OptionsSheet product={current} onClose={() => setSheet(false)} />}
      </div>

      {/* desktop prev / next */}
      <div className="ml-4 hidden flex-col gap-2 self-center md:flex" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => go(-1)} disabled={index === 0} aria-label="Show previous reel" className="grid h-9 w-9 place-items-center rounded-full bg-white transition hover:bg-gray-100 disabled:opacity-40"><ChevronUp size={18} /></button>
        <button type="button" onClick={() => go(1)} disabled={index === reels.length - 1} aria-label="Show next reel" className="grid h-9 w-9 place-items-center rounded-full bg-white transition hover:bg-gray-100 disabled:opacity-40"><ChevronDown size={18} /></button>
      </div>
    </div>
  );
}

/** Shared look of every reel card: soft rounded frame, gentle shadow, lifts on hover. */
const REEL_CARD = "group relative block aspect-[9/16] w-full cursor-pointer overflow-hidden rounded-2xl bg-espresso shadow-[0_24px_40px_-28px_rgba(35,26,29,.7)] ring-1 ring-black/5 transition duration-500 ease-[var(--ease-lux)] hover:-translate-y-1.5 hover:shadow-[0_34px_50px_-26px_rgba(143,74,91,.65)]";

/* ------------------------------------------------------------------ */
/* Home page section                                                   */
/* ------------------------------------------------------------------ */
export function ShopReels({ products }: { products: Product[] }) {
  const [active, setActive] = useState<number | null>(null);
  const reels = products.slice(0, 12);
  if (!reels.length) return null;

  return (
    <section className="container-x mt-16 sm:mt-24" aria-labelledby="reels-h">
      <ShelfHead id="reels-h" title="Shop From" accent="Reels" subtitle="See the latest styles in action" href="/shop-from-reels" seeAllLabel="View All" />

      {/* Swipeable on phones/tablets; on desktop exactly five reels sit across the page (the rest are under "View All"). */}
      <ul className="-mx-4 flex scroll-px-4 snap-x gap-3 overflow-x-auto px-4 pb-8 pt-1 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:pb-2 lg:[&>li:nth-child(n+6)]:hidden [&::-webkit-scrollbar]:hidden">
        {reels.map((p, i) => (
          <Reveal as="li" key={p.id} delay={Math.min(i, 5) * 0.06} className="w-[46%] shrink-0 snap-start sm:w-[30%] lg:w-auto">
            <button type="button" onClick={() => setActive(i)} aria-label={`Play reel ${i + 1}: ${p.name}`} className={REEL_CARD}>
              <ReelThumb product={p} sizes="(min-width:1024px) 20vw, 46vw" caption index={i} />
            </button>
          </Reveal>
        ))}
      </ul>

      {active !== null && <ReelViewer reels={reels} startIndex={active} onClose={() => setActive(null)} />}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* /shop-from-reels: every reel in a tight grid                        */
/* ------------------------------------------------------------------ */
const PAGE_SIZE = 10; // first 10 reels, then 10 more each time you reach the bottom
const LOAD_DELAY_MS = 650; // short beat so the loader is seen and the next videos/photos can start fetching
const GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5";

export function ReelsGrid({ products, categories = [], instagram }: { products: Product[]; categories?: { slug: string; name: string }[]; instagram?: string }) {
  const [cat, setCat] = useState("all");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [active, setActive] = useState<number | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  const chips = useMemo(() => {
    const has = new Set(products.map((p) => p.categorySlug));
    return categories.filter((c) => has.has(c.slug));
  }, [products, categories]);
  const filtered = useMemo(() => (cat === "all" ? products : products.filter((p) => p.categorySlug === cat)), [products, cat]);
  const list = filtered.slice(0, shown);
  const more = shown < filtered.length;

  // Infinite scroll: when the loader row scrolls into view, wait a beat, then reveal the next page.
  useEffect(() => {
    if (!more || !sentinel.current) return;
    let timer: number | undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && timer === undefined) timer = window.setTimeout(() => { timer = undefined; setShown((n) => n + PAGE_SIZE); }, LOAD_DELAY_MS);
    }, { rootMargin: "150px 0px" });
    io.observe(sentinel.current);
    return () => { io.disconnect(); window.clearTimeout(timer); };
  }, [more, shown]);

  const pick = (slug: string) => { setCat(slug); setShown(PAGE_SIZE); };
  const chipCls = (on: boolean) => `shrink-0 cursor-pointer rounded-full border px-5 py-2 text-sm font-medium transition ${on ? "border-gold-deep bg-gold-deep text-white shadow-md" : "border-line bg-white text-espresso hover:border-gold hover:bg-blush"}`;
  const skeletonShow = ["", "", "hidden sm:block", "hidden md:block", "hidden lg:block"];

  return (
    <section className="bg-[linear-gradient(to_bottom,#fbeaed,transparent_26rem)] pb-24 pt-10 sm:pt-14" aria-labelledby="reels-h">
      <div className="container-x">
        <ReelsHeading instagram={instagram} as="h1" />

        {chips.length > 0 && (
          <div className="-mx-4 mb-8 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
            <div role="group" aria-label="Filter reels by category" className="mx-auto flex w-max gap-2.5">
              <button type="button" aria-pressed={cat === "all"} onClick={() => pick("all")} className={chipCls(cat === "all")}>All</button>
              {chips.map((c) => (
                <button key={c.slug} type="button" aria-pressed={cat === c.slug} onClick={() => pick(c.slug)} className={chipCls(cat === c.slug)}>{c.name}</button>
              ))}
            </div>
          </div>
        )}

        {!filtered.length && (
          <div role="status" className="py-10 text-center">
            <p>There are no shoppable reels available yet.</p>
            <Link href="/shop" className="underline">Shop all products</Link>
          </div>
        )}

        <div className={GRID}>
          {list.map((p, i) => (
            <button key={p.id} type="button" onClick={() => setActive(i)} aria-label={`Play reel ${i + 1}: ${p.name}`} className={REEL_CARD}>
              <ReelThumb product={p} sizes="(min-width:1024px) 20vw, (min-width:768px) 25vw, (min-width:640px) 33vw, 50vw" caption index={i} />
            </button>
          ))}
        </div>

        {/* loader: shimmer placeholders for the next page + a spinner; this row also triggers the next page */}
        {more && (
          <div ref={sentinel} role="status" aria-live="polite" className="mt-3 sm:mt-4">
            <div aria-hidden className={GRID}>
              {skeletonShow.map((hide, i) => <div key={i} className={`aspect-[9/16] animate-pulse rounded-2xl bg-gradient-to-b from-blush to-cream ${hide}`} />)}
            </div>
            <p className="mt-8 flex items-center justify-center gap-3 text-sm text-taupe-deep">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-gold border-t-transparent" />Loading more reels&hellip;
            </p>
          </div>
        )}

        {!more && filtered.length > PAGE_SIZE && (
          <div className="mt-14 text-center">
            <p className="font-serif text-2xl">You&rsquo;ve seen all {filtered.length} reels</p>
            <Link href="/shop" className="btn btn-ghost mt-5">Shop all products <ArrowRight size={15} className="arrow" aria-hidden /></Link>
          </div>
        )}
      </div>
      {active !== null && <ReelViewer reels={list} startIndex={active} onClose={() => setActive(null)} />}
    </section>
  );
}
