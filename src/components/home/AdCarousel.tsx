"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { AdSlideData, AdTheme } from "@/lib/home-ads";
import type { AdBanner } from "@/lib/ad-banners";

const AUTOPLAY_MS = 6000;
const SPARKLE = "M0,-14 C1,-5 5,-1 14,0 C5,1 1,5 0,14 C-1,5 -5,1 -14,0 C-5,-1 -1,-5 0,-14 Z";

const THEME: Record<AdTheme, { bg: string; glow: string; glow2: string }> = {
  rose: { bg: "bg-[linear-gradient(115deg,#fdeff1_0%,#f9d3dc_42%,#e9a3b6_100%)]", glow: "bg-white/60", glow2: "bg-[#f6b6c6]/70" },
  lilac: { bg: "bg-[linear-gradient(115deg,#f8f3fc_0%,#e8dbf6_45%,#c6aee6_100%)]", glow: "bg-white/60", glow2: "bg-[#d6c0f0]/70" },
  sage: { bg: "bg-[linear-gradient(115deg,#f5f8f1_0%,#dfebd6_45%,#a9c79a_100%)]", glow: "bg-white/60", glow2: "bg-[#bfd8b0]/70" },
  sand: { bg: "bg-[linear-gradient(115deg,#fff8ec_0%,#fbe5c2_45%,#eebd7e_100%)]", glow: "bg-white/60", glow2: "bg-[#f6d39a]/70" },
};

// Fan of up to three tilted product photos: left, centre (front), right.
const SLOTS = [
  { box: "left-[2%] top-[14%] w-[34%] rotate-[-9deg]", z: "z-0", d: "0s" },
  { box: "left-[33%] top-[2%] w-[38%]", z: "z-10", d: "-1.6s" },
  { box: "right-[2%] top-[14%] w-[34%] rotate-[9deg]", z: "z-0", d: "-3.2s" },
];

function Slide({ s, priority }: { s: AdSlideData; priority: boolean }) {
  const t = THEME[s.theme];
  const fan = s.images.slice(0, 3);
  const order = fan.length === 3 ? [1, 0, 2] : fan.map((_, i) => i); // draw the centre photo first
  const used = fan.length === 3 ? [0, 1, 2] : fan.length === 2 ? [0, 2] : [1];
  return (
    <div className={`relative isolate h-full overflow-hidden rounded-[2rem] ${t.bg} shadow-[0_40px_80px_-46px_rgba(143,74,91,.7)] ring-1 ring-white/70`}>
      <div aria-hidden className={`absolute -left-24 -top-28 -z-10 h-80 w-80 rounded-full ${t.glow} blur-3xl`} />
      <div aria-hidden className={`absolute -bottom-32 right-[20%] -z-10 h-80 w-80 rounded-full ${t.glow2} blur-3xl`} />
      {[["left-[46%] top-[12%] h-5 w-5", "0s"], ["left-[8%] bottom-[14%] h-4 w-4", "-1.2s"], ["right-[8%] top-[10%] h-6 w-6", "-2.1s"], ["left-[52%] bottom-[16%] h-3.5 w-3.5", "-0.6s"]].map(([c, d], i) => (
        <svg key={i} viewBox="-16 -16 32 32" aria-hidden className={`fx-twinkle absolute -z-10 text-gold-deep/70 ${c}`} style={{ "--d": d } as CSSProperties}><path d={SPARKLE} fill="currentColor" /></svg>
      ))}

      <div className="grid h-full items-center gap-6 px-6 py-9 sm:px-12 sm:py-12 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
        <div>
          <p className="eyebrow">{s.eyebrow}</p>
          <h2 className="mt-4 font-serif text-4xl leading-[1.05] text-espresso sm:text-6xl">
            {s.title}{s.accent && <><br /><span className="italic text-gradient">{s.accent}</span></>}
          </h2>
          {s.text && <p className="mt-4 max-w-md text-base text-taupe-deep sm:text-lg">{s.text}</p>}
          {s.stat && (
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <p className="flex items-baseline gap-2 text-espresso">
                <span className="text-xs font-semibold uppercase tracking-[0.24em]">{s.stat.prefix}</span>
                <span className="font-serif text-6xl leading-none sm:text-8xl">{s.stat.value}<span className="text-4xl sm:text-6xl">{s.stat.unit}</span></span>
                <span className="font-serif text-3xl sm:text-5xl">{s.stat.suffix}</span>
              </p>
              {s.tag && <span className="rounded-full bg-white/70 px-3.5 py-1.5 text-xs font-medium text-gold-deep ring-1 ring-white">{s.tag}</span>}
            </div>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {s.ctas.map((c) => (
              <Link key={c.label} href={c.href} className={`btn ${c.variant === "solid" ? "btn-solid" : "btn-ghost"}`}>
                {c.label}{c.variant === "solid" && <ArrowRight size={15} className="arrow" aria-hidden />}
              </Link>
            ))}
          </div>
        </div>

        <div aria-hidden className="relative mx-auto h-64 w-full max-w-[26rem] sm:h-80 lg:h-[22rem] lg:max-w-none">
          {order.map((imgIdx, slotIdx) => {
            const slot = SLOTS[used[slotIdx]];
            return (
              <div key={imgIdx} className={`absolute ${slot.box} ${slot.z} aspect-[3/4]`}>
                <div className="fx-bob relative h-full w-full overflow-hidden rounded-2xl bg-cream shadow-[0_26px_40px_-18px_rgba(35,26,29,.55)] ring-[3px] ring-white" style={{ "--d": slot.d } as CSSProperties}>
                  <Image src={fan[imgIdx]} alt="" fill sizes="(min-width:1024px) 14rem, 30vw" priority={priority} className="object-cover object-top" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Swipeable advertisements (native scroll-snap swipe, arrows, dots, gentle autoplay that pauses on hover).
 *  Uses ready-made banner images from /public/ads when there are any, otherwise the generated slides. */
export function AdCarousel({ slides, banners = [] }: { slides: AdSlideData[]; banners?: AdBanner[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const imageMode = banners.length > 0;
  const n = imageMode ? banners.length : slides.length;

  const goTo = useCallback((i: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: ((i % n) + n) % n * el.clientWidth, behavior: "smooth" });
  }, [n]);

  const onScroll = () => {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  useEffect(() => {
    if (n < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => { if (!document.hidden) goTo(index + 1); }, AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [index, paused, n, goTo]);

  if (!n) return null;
  // One fixed frame for every banner: the shape most of the images share (e.g. 2170×725), so all ads are the same height and width.
  const shapeCount = new Map<number, number>();
  for (const b of banners) { const r = Math.round((b.width / b.height) * 100) / 100; shapeCount.set(r, (shapeCount.get(r) ?? 0) + 1); }
  const frameRatio = [...shapeCount].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? 3;
  const ids = imageMode ? banners.map((b) => b.id) : slides.map((s) => s.id);

  return (
    <section className="container-x mt-16 sm:mt-24" aria-roledescription="carousel" aria-label="Offers and featured edits"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="relative">
        {imageMode ? (
          <div className="relative overflow-hidden rounded-[1.5rem] shadow-[0_30px_60px_-40px_rgba(143,74,91,.7)] ring-1 ring-black/5 sm:rounded-[2rem]"
            style={{ paddingBottom: `${100 / frameRatio}%` }}>
            <ul ref={track} onScroll={onScroll} className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {banners.map((b, i) => {
                // A picture with a different shape is shown whole, centred, over a soft blurred copy of itself (nothing cropped, same frame).
                const odd = Math.abs(b.width / b.height - frameRatio) / frameRatio > 0.03;
                return (
                  <li key={b.id} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${n}`} className="relative h-full w-full shrink-0 snap-center [scroll-snap-stop:always]">
                    <Link href={b.href} className="absolute inset-0 block overflow-hidden" aria-label={b.alt}>
                      {odd && <Image src={b.src} alt="" aria-hidden fill sizes="25vw" className="scale-125 object-cover blur-2xl" />}
                      <Image src={b.src} alt={b.alt} fill sizes="(min-width:1536px) 88rem, 100vw" priority={i === 0} className={odd ? "object-contain" : "object-cover"} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <ul ref={track} onScroll={onScroll} className="flex snap-x snap-mandatory items-stretch overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {slides.map((s, i) => (
              <li key={s.id} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${n}`} className="w-full shrink-0 snap-center px-px [scroll-snap-stop:always]">
                <Slide s={s} priority={i === 0} />
              </li>
            ))}
          </ul>
        )}
      </div>
      {n > 1 && (
        <div className={`${imageMode ? "mt-4" : "-mt-1"} flex justify-center gap-2`} role="group" aria-label="Choose an offer">
          {ids.map((id, i) => (
            <button key={id} type="button" onClick={() => goTo(i)} aria-label={`Show offer ${i + 1}`} aria-current={i === index}
              className={`h-2 cursor-pointer rounded-full transition-all duration-500 ${i === index ? "w-8 bg-gold-deep" : "w-2 bg-taupe/50 hover:bg-taupe"}`} />
          ))}
        </div>
      )}
    </section>
  );
}
