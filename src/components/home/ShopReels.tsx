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

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Eye, Play, ShoppingBag, Volume2, VolumeX, X } from "lucide-react";
import { Reveal } from "@/components/ui/motion";
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
    <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
      <p className="eyebrow justify-center">Watch &amp; shop</p>
      <H id="reels-h" className="mt-4 font-serif text-4xl leading-tight sm:text-6xl">Shop from <span className="italic text-gradient">Reels</span></H>
      <p className="mt-4 text-taupe-deep">See each piece in motion, then bring it home in a tap.</p>
      <a href={instagram || "#"} target="_blank" rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium shadow-sm transition hover:-translate-y-0.5 hover:border-gold hover:text-gold-deep">
        <span className="text-gold-deep">{IG_GLYPH}</span>@zebelladesigns
      </a>
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
      <Image src={coverOf(product)} alt={product.name} fill sizes={sizes} className={`object-cover object-top ${hasVideo ? "" : "reel-drift"}`} style={hasVideo ? undefined : { animationDelay: `${-(index % 5) * 1.6}s` }} />
      {hasVideo && (
        <video ref={videoRef} src={product.videoUrl} poster={coverOf(product)} muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" />
      )}
      {caption && (
        <>
          <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/10 to-espresso/25" />
          <span className="absolute left-3.5 top-3.5 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md">{String(index + 1).padStart(2, "0")}</span>
          <span aria-hidden className="absolute right-3.5 top-3.5 grid h-8 w-8 place-items-center rounded-full bg-white/25 text-white backdrop-blur-md">
            {hasVideo ? <Play size={12} fill="currentColor" /> : <Eye size={14} />}
          </span>
          <span className="absolute inset-x-0 bottom-0 p-4 text-left text-ivory">
            <span className="line-clamp-2 block font-serif text-lg leading-snug">{product.name}</span>
            <span className="mt-1 flex items-center justify-between text-xs tracking-wide text-ivory/85">
              {formatINR(effectivePrice(product))}
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em]">Shop <ArrowRight size={11} aria-hidden /></span>
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
    <div role="dialog" aria-modal="true" aria-label="Shop from reels" className="reel-player fixed inset-0 z-[100] flex items-center justify-center bg-black/80" onClick={onClose} onWheel={onWheel}>
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

/* ------------------------------------------------------------------ */
/* Home page section                                                   */
/* ------------------------------------------------------------------ */
export function ShopReels({ products, instagram }: { products: Product[]; instagram?: string }) {
  const [active, setActive] = useState<number | null>(null);
  const strip = useRef<HTMLUListElement>(null);
  const reels = products.slice(0, 12);
  if (!reels.length) return null;
  const scrollBy = (d: number) => strip.current?.scrollBy({ left: d * 400, behavior: "smooth" });

  return (
    <section className="container-x mt-24 sm:mt-32" aria-labelledby="reels-h">
      <ReelsHeading instagram={instagram} />

      <div className="relative">
        <ul ref={strip} className="reel-bleed flex snap-x items-start gap-4 overflow-x-auto pb-12 pt-2[scrollbar-width:none] sm:gap-5 [&::-webkit-scrollbar]:hidden">
          {reels.map((p, i) => (
            <Reveal as="li" key={p.id} delay={Math.min(i, 5) * 0.06} className={`shrink-0 snap-start ${i % 2 ? "sm:mt-10" : ""}`}>
              <button type="button" onClick={() => setActive(i)} aria-label={`View reel ${i + 1}: ${p.name}`}
                className="group relative block aspect-[9/16] w-[200px] cursor-pointer overflow-hidden rounded-[1.75rem] bg-espresso shadow-[0_30px_50px_-30px_rgba(35,26,29,.7)] ring-1 ring-black/5 transition duration-500 hover:-translate-y-2 hover:shadow-[0_40px_60px_-28px_rgba(143,74,91,.55)] md:w-[250px]">
                <ReelThumb product={p} sizes="250px" caption index={i} />
              </button>
            </Reveal>
          ))}
        </ul>
        {reels.length > 5 && (
          <>
            <button type="button" onClick={() => scrollBy(-1)} aria-label="Scroll reels left" className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white shadow-lg md:grid"><ChevronLeft size={18} /></button>
            <button type="button" onClick={() => scrollBy(1)} aria-label="Scroll reels right" className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white shadow-lg md:grid"><ChevronRight size={18} /></button>
          </>
        )}
      </div>

      <div className="flex justify-center">
        <Link href="/shop-from-reels" className="btn btn-ghost">View all reels <ArrowRight size={15} className="arrow" aria-hidden /></Link>
      </div>

      {active !== null && <ReelViewer reels={reels} startIndex={active} onClose={() => setActive(null)} />}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* /shop-from-reels: every reel in a tight grid                        */
/* ------------------------------------------------------------------ */
const PAGE_SIZE = 24;

export function ReelsGrid({ products, instagram }: { products: Product[]; instagram?: string }) {
  const [shown, setShown] = useState(PAGE_SIZE);
  const [hover, setHover] = useState<number | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const list = products.slice(0, shown);
  const more = shown < products.length;

  useEffect(() => {
    if (!more || !sentinel.current) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setShown((n) => n + PAGE_SIZE); }, { rootMargin: "400px 0px" });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [more]);

  return (
    <section className="container-x pb-24 pt-12" aria-labelledby="reels-h">
      <ReelsHeading instagram={instagram} as="h1" />
      {!products.length && (
        <div role="status" className="py-10 text-center">
          <p>There are no shoppable reels available yet.</p>
          <Link href="/shop" className="underline">Shop all products</Link>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-4">
        {list.map((p, i) => (
          <button key={p.id} type="button" onClick={() => setActive(i)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
            aria-label={`View reel ${i + 1}: ${p.name}`} className="group relative aspect-[9/16] w-full cursor-pointer overflow-hidden rounded-3xl bg-espresso shadow-[0_24px_40px_-30px_rgba(35,26,29,.6)] transition duration-500 hover:-translate-y-1">
            <ReelThumb product={p} sizes="(min-width:1024px) 20vw, 50vw" previewMode="hover" hovered={hover === i} caption index={i} />
          </button>
        ))}
      </div>
      {more && <div ref={sentinel} className="h-16" />}
      {active !== null && <ReelViewer reels={list} startIndex={active} onClose={() => setActive(null)} />}
    </section>
  );
}
