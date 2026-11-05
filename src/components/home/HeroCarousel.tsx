"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { HeroSlide } from "@/lib/content";

const ease = [0.22, 1, 0.36, 1] as const;
const INTERVAL = 6500; // ms per slide

/** Auto-sliding hero: cross-fade + slow zoom on the photo, text glides in. Pauses on hover/focus, swipe on touch, keyboard arrows. */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const reduce = useReducedMotion();
  const [[index, dir], setPage] = useState<[number, number]>([0, 1]);
  const [hover, setHover] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const paused = hover || userPaused;
  const n = slides.length;

  const go = useCallback((to: number, d: number) => setPage([((to % n) + n) % n, d]), [n]);
  const next = useCallback(() => go(index + 1, 1), [go, index]);
  const prev = useCallback(() => go(index - 1, -1), [go, index]);

  // Don't run the timer while the tab is hidden.
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  const s = slides[index];
  const banner = !!(s.textInImage && s.imageUrl);
  const auto = !reduce;

  return (
    <section
      aria-roledescription="carousel" aria-label="Featured collections"
      data-hero-banner
      className="relative -mt-20 h-[calc(100svh-5.5rem)] max-h-[44rem] overflow-hidden bg-blush text-ivory md:mt-0 md:h-auto md:max-h-none md:aspect-[27/10] md:text-espresso"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setHover(true)} onBlurCapture={() => setHover(false)}
      onKeyDown={(e) => { if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft") prev(); }}
    >
      <AnimatePresence initial={false} custom={dir}>
        <motion.div
          key={index} custom={dir}
          role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${n}`}
          className="absolute inset-0"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.2 : 1.3, ease: [0.4, 0, 0.2, 1] }}
          drag={reduce ? false : "x"} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.15}
          onDragEnd={(_, i) => { if (i.offset.x < -60) next(); else if (i.offset.x > 60) prev(); }}
        >
          {banner ? (
            <>
              {/* Desktop: the artwork carries its own text. Mobile: the same photo with live text over it. */}
              <div className="absolute inset-0 hidden md:block"><BannerSlide s={s} reduce={!!reduce} /></div>
              <div className="absolute inset-0 md:hidden"><PhotoSlide s={{ ...s, imageUrl: s.mobileImageUrl || s.imageUrl }} dir={dir} reduce={!!reduce} /></div>
            </>
          ) : <PhotoSlide s={s} dir={dir} reduce={!!reduce} />}
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 md:bottom-6">
        <div className="container-x flex items-center justify-between gap-4">
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-espresso/35 p-1.5 backdrop-blur-md md:absolute md:left-1/2 md:-translate-x-1/2 md:bg-white/70" role="group" aria-label="Choose slide">
            {slides.map((sl, i) => (
              <button key={i} type="button" onClick={() => go(i, i > index ? 1 : -1)} aria-label={`Go to slide ${i + 1}: ${sl.heading}`} aria-current={i === index}
                className="group grid h-6 place-items-center px-1 outline-none focus-visible:ring-2 focus-visible:ring-gold-deep">
                <span className={`relative block h-1.5 overflow-hidden rounded-full bg-ivory/40 transition-all duration-500 md:bg-espresso/20 ${i === index ? "w-9" : "w-1.5 group-hover:bg-ivory/70 md:group-hover:bg-espresso/40"}`}>
                  {i === index && (
                    auto
                      ? <span key={`${index}-${dir}`} className="hero-bar absolute inset-y-0 left-0 w-full origin-left rounded-full bg-ivory md:bg-gold-deep" style={{ animationDuration: `${INTERVAL}ms`, animationPlayState: paused || hidden ? "paused" : "running" }} onAnimationEnd={next} />
                      : <span className="absolute inset-0 rounded-full bg-ivory md:bg-gold-deep" />
                  )}
                </span>
              </button>
            ))}
          </div>

          <div className="pointer-events-auto ml-auto flex items-center gap-2">
            <span className="hidden rounded-full bg-white/70 px-3 py-2 text-xs font-medium tabular-nums tracking-[0.16em] backdrop-blur-md md:inline" aria-hidden>{String(index + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</span>
            {auto && (
              <button type="button" onClick={() => setUserPaused((p) => !p)} aria-label={userPaused ? "Play slideshow" : "Pause slideshow"} className="grid h-10 w-10 place-items-center rounded-full bg-espresso/35 text-ivory outline-none backdrop-blur-md transition hover:bg-espresso/55 focus-visible:ring-2 focus-visible:ring-gold-deep md:bg-white/70 md:text-espresso md:hover:bg-white">
                {userPaused ? <Play size={15} fill="currentColor" /> : <Pause size={15} fill="currentColor" />}
              </button>
            )}
            <button type="button" onClick={prev} aria-label="Previous slide" className="grid h-10 w-10 place-items-center rounded-full bg-espresso/35 text-ivory outline-none backdrop-blur-md transition hover:-translate-x-0.5 hover:bg-espresso/55 focus-visible:ring-2 focus-visible:ring-gold-deep md:bg-white/70 md:text-espresso md:hover:bg-white"><ChevronLeft size={18} /></button>
            <button type="button" onClick={next} aria-label="Next slide" className="grid h-10 w-10 place-items-center rounded-full bg-espresso/35 text-ivory outline-none backdrop-blur-md transition hover:translate-x-0.5 hover:bg-espresso/55 focus-visible:ring-2 focus-visible:ring-gold-deep md:bg-white/70 md:text-espresso md:hover:bg-white"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>
      <div className="sr-only" aria-live={paused ? "polite" : "off"}>{s.heading}</div>
      <style>{`@keyframes herobar{from{transform:scaleX(0)}to{transform:scaleX(1)}}.hero-bar{animation-name:herobar;animation-timing-function:linear;animation-fill-mode:forwards}`}</style>
    </section>
  );
}

/** Artwork that already contains its headline and button. */
function BannerSlide({ s, reduce }: { s: HeroSlide; reduce: boolean }) {
  return (
    <Link href={s.ctaHref || "/shop"} aria-label={s.heading} className="absolute inset-0 block">
      <motion.div className="absolute inset-0" initial={{ scale: reduce ? 1 : 1.035 }} animate={{ scale: 1 }} transition={{ duration: 7, ease: "easeOut" }}>
        <Image src={s.imageUrl!} alt={s.heading} fill priority sizes="100vw" className="object-cover" />
      </motion.div>
    </Link>
  );
}

/** Photo slide: full-bleed on mobile; text left + photo right on desktop. */
function PhotoSlide({ s, dir, reduce }: { s: HeroSlide; dir: number; reduce: boolean }) {
  const slide = (delay: number) => ({ initial: { opacity: 0, x: reduce ? 0 : 46 * dir }, animate: { opacity: 1, x: 0 }, transition: { duration: reduce ? 0.2 : 1.1, delay: reduce ? 0 : delay, ease } });
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-blush via-ivory to-cream">
      {/* photo */}
      <div className="absolute inset-0 overflow-hidden md:inset-y-0 md:left-auto md:right-0 md:w-[54%]">
        <motion.div className="absolute inset-0" initial={{ scale: reduce ? 1 : 1.12, x: reduce ? 0 : 30 * dir }} animate={{ scale: 1, x: 0 }} transition={{ duration: 7, ease: "easeOut" }}>
          <Image src={s.imageUrl || "/art/hero.svg"} alt="" fill priority sizes="(min-width:768px) 54vw, 100vw" className="object-cover object-top" />
        </motion.div>
        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-espresso/10 to-espresso/35 md:hidden" />
        <span aria-hidden className="absolute inset-y-0 left-0 hidden w-40 bg-gradient-to-r from-ivory/90 to-transparent md:block" />
      </div>

      {/* decorative */}
      <span aria-hidden className="fx-drift pointer-events-none absolute -left-24 -top-24 hidden h-96 w-96 rounded-full bg-rose-soft/30 blur-3xl md:block" />

      {/* copy */}
      <div className="container-x relative flex h-full items-end pb-20 md:items-center md:pb-0">
        <div className="max-w-xl md:max-w-[34rem]">
          {s.eyebrow && <motion.p {...slide(0.25)} className="eyebrow !text-ivory/90 md:!text-gold-deep">{s.eyebrow}</motion.p>}
          <motion.h2 {...slide(0.4)} className="mt-4 text-balance font-serif text-5xl font-light leading-[1.02] sm:text-6xl lg:text-7xl">{s.heading}</motion.h2>
          {s.description && <motion.p {...slide(0.55)} className="mt-5 max-w-md text-base leading-7 text-ivory/85 md:text-lg md:text-taupe-deep">{s.description}</motion.p>}
          <motion.div {...slide(0.7)} className="mt-8 flex flex-wrap gap-3">
            {s.ctaLabel && s.ctaHref && <Link href={s.ctaHref} className="btn btn-light md:!bg-espresso md:!text-ivory">{s.ctaLabel} <ArrowRight size={15} className="arrow" aria-hidden /></Link>}
            {s.secondaryLabel && s.secondaryHref && <Link href={s.secondaryHref} className="btn btn-outline-light md:!border-espresso/40 md:!text-espresso">{s.secondaryLabel}</Link>}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
