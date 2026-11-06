"use client";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { ArrowRight } from "lucide-react";
import { ART } from "@/lib/art";
import { formatINR } from "@/lib/commerce/money";
import { effectivePrice } from "@/lib/commerce/catalog-rules";
import { Price } from "@/components/ui/Price";
import type { Product } from "@/lib/types";

const ease = [0.22, 1, 0.36, 1] as const;
/** Small alternating tilt + vertical wobble per card, so the ring feels hand-placed. */
const TILT = [7, -7, 0];
const WOB = [-14, 11, -6, 15];
/** How many card-widths the ring travels across the whole pinned scroll. */
const TRAVEL = 0.8;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * "Signature Edit": a pinned, scroll-driven 3D carousel of featured pieces.
 * Each card is positioned by its distance from the centre: the focused piece is large, sharp and bright,
 * its neighbours shrink, blur, darken, tilt and turn away in perspective. Scroll drives it; drag and keyboard focus also move it.
 * Under prefers-reduced-motion the pinned section is replaced by a plain swipeable row (no JS motion at all).
 */
export function ProductRing({ products }: { products: Product[] }) {
  const items = products.slice(0, 8);
  const n = items.length;

  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLAnchorElement | null)[]>([]);
  const ring = useRef<HTMLDivElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const shape = useRef<SVGSVGElement>(null);
  const badge = useRef<HTMLDivElement>(null);
  const state = useRef({ drag: 0, spacing: 260, best: -1 });
  const gesture = useRef({ on: false, x: 0, moved: 0 });
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.7 });

  const render = useCallback(() => {
    if (!n) return;
    const s = state.current;
    const progress = smooth.get();
    const off = progress * n * TRAVEL + s.drag;
    // Lag between the raw scroll position and the eased one gives the cards a little sway while you scroll fast.
    const sway = clamp((scrollYProgress.get() - progress) * n * 60, -8, 8);
    let best = 0, bestE = -1;
    for (let i = 0; i < n; i++) {
      const el = cards.current[i];
      if (!el) continue;
      let p = (((i - off) % n) + n) % n;
      if (p > n / 2) p -= n;
      const a = Math.abs(p);
      const f = Math.max(0, 1 - a / 1.15);
      const e = f * f * (3 - 2 * f); // smoothstep: 1 at the centre, 0 one card away
      const scale = 0.62 + 0.5 * e;
      const x = p * s.spacing;
      const y = WOB[i % 4] * (1 - 0.5 * e);
      const rotZ = TILT[i % 3] * (1 - 0.4 * e) + sway * (0.4 + 0.6 * e);
      const rotY = clamp(-p * 22, -34, 34);
      const z = -Math.min(a, 2.5) * 110;
      el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(0)}px) rotateY(${rotY.toFixed(1)}deg) rotateZ(${rotZ.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      el.style.filter = `brightness(${(0.72 + 0.28 * e).toFixed(3)}) blur(${((1 - e) * 3).toFixed(2)}px)`;
      el.style.zIndex = String(Math.round(e * 10));
      el.style.opacity = clamp((n / 2 - 0.2 - a) * 2, 0, 1).toFixed(2);
      if (e > bestE) { bestE = e; best = i; }
    }
    if (ring.current) ring.current.style.transform = `rotate(${(progress * 540 + s.drag * 30).toFixed(1)}deg)`;
    if (best !== s.best) { s.best = best; setActive(best); }
  }, [n, smooth, scrollYProgress]);

  useMotionValueEvent(smooth, "change", render);

  useEffect(() => {
    const measure = () => {
      const el = cards.current[0];
      if (el) state.current.spacing = el.offsetWidth * 1.12;
      render();
      if (stage.current) stage.current.style.opacity = "1"; // revealed once positioned, so cards never flash stacked
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [render]);

  if (n < 4) return null;

  const onMove = (e: ReactPointerEvent) => {
    const g = gesture.current;
    if (g.on) {
      const dx = e.clientX - g.x;
      g.x = e.clientX;
      g.moved += Math.abs(dx);
      state.current.drag -= dx / state.current.spacing;
      render();
    }
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    if (stage.current) stage.current.style.transform = `translate3d(${(-nx * 14).toFixed(1)}px,${(-ny * 8).toFixed(1)}px,0)`;
    if (shape.current) shape.current.style.transform = `translate3d(${(nx * 22).toFixed(1)}px,${(ny * 10).toFixed(1)}px,0)`;
    if (badge.current) badge.current.style.transform = `translate3d(${(nx * 10).toFixed(1)}px,${(ny * 6).toFixed(1)}px,0)`;
  };
  const resetParallax = () => {
    gesture.current.on = false;
    for (const el of [stage.current, badge.current, shape.current]) if (el) el.style.transform = "";
  };
  /** Keyboard users tabbing through the links bring that card to the centre. */
  const focusCard = (i: number) => { if (pin.current) pin.current.scrollLeft = 0; state.current.drag = i - smooth.get() * n * TRAVEL; render(); };

  const cur = items[active] ?? items[0];

  return (
    <section ref={section} aria-label="The Signature Edit" className="relative mt-24 h-[360vh] sm:mt-32 motion-reduce:h-auto">
      {/* ---- Pinned 3D stage (hidden for reduced motion) ---- */}
      <div ref={pin} className="sticky top-0 h-svh min-h-[40rem] overflow-hidden motion-reduce:hidden"
        onPointerMove={onMove} onPointerLeave={resetParallax}>
        <div className="container-x absolute inset-x-0 top-24 z-10 sm:top-28">
          <p className="eyebrow mb-2">Curated for you</p>
          <h2 className="h-section font-serif">The Signature Edit</h2>
        </div>

        <p aria-hidden className="pointer-events-none absolute inset-x-0 top-[22%] select-none whitespace-nowrap text-center font-serif text-[clamp(6rem,21vw,19rem)] leading-[.8] tracking-tighter text-transparent [-webkit-text-stroke:2px_var(--color-line)]">ZEBELLA</p>

        <svg ref={shape} aria-hidden viewBox="0 0 1407 601" preserveAspectRatio="none" className="absolute -left-[6%] bottom-0 h-[46%] w-[112%] text-wine transition-transform duration-700 ease-out">
          <path d="M0 130C230 20 430 200 710 120S1180 20 1407 130V601H0Z" fill="currentColor" />
        </svg>

        {/* Rotating text badge: turns with the scroll */}
        <div ref={badge} aria-hidden className="absolute right-[max(1rem,5vw)] top-40 z-10 grid h-[clamp(5.5rem,11vw,9.5rem)] w-[clamp(5.5rem,11vw,9.5rem)] place-items-center transition-transform duration-700 ease-out sm:top-44">
          <div ref={ring} className="absolute inset-0">
            <svg viewBox="0 0 200 200" className="h-full w-full">
              <defs><path id="zb-ring-path" d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0" /></defs>
              <text className="fill-espresso text-[11.6px] font-semibold uppercase tracking-[0.22em]"><textPath href="#zb-ring-path">Scroll to explore · Scroll to explore · </textPath></text>
            </svg>
          </div>
          <span className="grid h-1/3 w-1/3 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-deep text-white">↓</span>
        </div>

        {/* The 3D ring of pieces */}
        <div ref={stage} role="group" aria-label="Featured pieces. Scroll or drag to browse." style={{ ["--cw" as string]: "clamp(9.5rem, 23vw, 17rem)", opacity: 0 }}
          className="absolute inset-x-0 top-[44%] h-0 cursor-grab touch-pan-y select-none transition-[transform,opacity] duration-700 ease-out [perspective:1400px] [transform-style:preserve-3d] active:cursor-grabbing"
          onPointerDown={(e) => { gesture.current = { on: true, x: e.clientX, moved: 0 }; }}
          onPointerUp={() => { gesture.current.on = false; }} onPointerCancel={() => { gesture.current.on = false; }}
          onClickCapture={(e) => { if (gesture.current.moved > 8) { e.preventDefault(); e.stopPropagation(); gesture.current.moved = 0; } }}>
          {items.map((p, i) => {
            const img = p.images[0];
            return (
              <Link key={p.id} href={`/products/${p.slug}`} ref={(el) => { cards.current[i] = el; }} aria-label={p.name} draggable={false}
                onFocus={() => focusCard(i)}
                style={{ width: "var(--cw)", marginLeft: "calc(var(--cw) / -2)", marginTop: "calc(var(--cw) * -0.6667)" }}
                className="absolute left-1/2 top-0 block will-change-transform">
                <span className="relative block aspect-[3/4] overflow-hidden rounded-[1.6rem] bg-cream shadow-[0_40px_70px_-35px_rgba(35,26,29,.75)] ring-1 ring-white/60">
                  <Image src={img?.url || ART.productPlaceholder} alt="" fill draggable={false} sizes="(min-width:768px) 24vw, 40vw" className="object-cover object-top" />
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-espresso/25 via-transparent to-white/10" />
                </span>
              </Link>
            );
          })}
        </div>

        {/* Caption for the focused piece, sitting on the curved shape */}
        <div className="pointer-events-none absolute inset-x-0 bottom-20 z-10 text-center text-ivory sm:bottom-24" aria-live="polite">
          <motion.div key={cur.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-rose-soft">{String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</p>
            <h3 className="mt-1 font-serif text-3xl leading-tight sm:text-5xl">{cur.name}</h3>
            <p className="mt-1 text-base text-ivory/80">{formatINR(effectivePrice(cur))}</p>
            <Link href={`/products/${cur.slug}`} className="btn btn-light pointer-events-auto mt-4 !min-h-10 !px-6">View piece <ArrowRight size={14} className="arrow" aria-hidden /></Link>
          </motion.div>
        </div>
      </div>

      {/* ---- Reduced motion: a plain swipeable row, no pinning ---- */}
      <div className="container-x hidden motion-reduce:block">
        <p className="eyebrow mb-3">Curated for you</p>
        <h2 className="h-section mb-8 font-serif">The Signature Edit</h2>
        <ul className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-4">
          {items.map((p) => (
            <li key={p.id} className="w-56 shrink-0 snap-start sm:w-64">
              <Link href={`/products/${p.slug}`} className="group block">
                <span className="relative block aspect-[3/4] overflow-hidden rounded-2xl bg-cream">
                  <Image src={p.images[0]?.url || ART.productPlaceholder} alt={p.images[0]?.alt || p.name} fill sizes="16rem" className="object-cover object-top" />
                </span>
                <span className="mt-3 block font-serif text-lg leading-snug">{p.name}</span>
                <Price product={p} className="mt-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
