"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ART } from "@/lib/art";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Expand, Play, X, ZoomIn } from "lucide-react";
import type { ProductImage } from "@/lib/types";

/**
 * Gallery: thumbnails (vertical on desktop, strip on mobile), hover-zoom on desktop,
 * swipeable snap carousel on touch, and a fullscreen lightbox with keyboard navigation.
 */
export function ProductGallery({ images, name, videoUrl }: { images: ProductImage[]; name: string; videoUrl?: string }) {
  const slides: ({ type: "image"; img: ProductImage } | { type: "video"; url: string })[] = [
    ...images.map((img) => ({ type: "image" as const, img })),
    ...(videoUrl ? [{ type: "video" as const, url: videoUrl }] : []),
  ];
  const [i, setI] = useState(0);
  const [full, setFull] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const track = useRef<HTMLDivElement>(null);

  const go = useCallback((n: number) => setI((n + slides.length) % slides.length), [slides.length]);

  // Keep the swipe track in sync when a thumbnail is chosen.
  useEffect(() => {
    const t = track.current;
    if (t) t.scrollTo({ left: t.clientWidth * i, behavior: "smooth" });
  }, [i]);

  useEffect(() => {
    if (!full) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(false);
      if (e.key === "ArrowRight") go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
    };
    window.addEventListener("keydown", key);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", key); };
  }, [full, i, go]);

  if (!slides.length) return <div className="relative aspect-[3/4] w-full overflow-hidden bg-cream"><Image src={ART.productPlaceholder} alt={name} fill priority sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" /></div>;
  const cur = slides[i];

  const thumb = (s: (typeof slides)[number], n: number) => {
    const on = n === i;
    return (
      <button key={n} onClick={() => setI(n)} aria-label={`Show ${s.type === "video" ? "video" : `image ${n + 1}`}`} aria-current={on}
        className={`group relative aspect-[3/4] w-full shrink-0 overflow-hidden bg-cream outline-none transition duration-300 focus-visible:ring-2 focus-visible:ring-gold-deep ${on ? "shadow-[0_14px_28px_-14px_rgba(143,74,91,.7)] ring-2 ring-gold ring-offset-2 ring-offset-ivory" : "opacity-70 ring-1 ring-line hover:-translate-y-0.5 hover:opacity-100 hover:ring-gold/60"}`}>
        {s.type === "image"
          ? <Image src={s.img.url} alt="" fill sizes="96px" className="object-cover object-top transition-transform duration-500 group-hover:scale-105" />
          : <span className="grid h-full place-items-center bg-espresso text-ivory"><Play size={20} fill="currentColor" /></span>}
        <span className={`absolute left-1.5 top-1.5 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[0.6rem] font-semibold backdrop-blur transition ${on ? "bg-gradient-to-br from-gold to-gold-deep text-white" : "bg-white/80 text-taupe-deep"}`}>{n + 1}</span>
      </button>
    );
  };

  return (
    <div className="relative z-20 grid gap-4 lg:sticky lg:top-24 lg:grid-cols-[6rem_1fr] lg:self-start">
      {/* desktop thumbs */}
      <div className="hidden lg:block lg:self-start">
        <div className="no-scrollbar -m-1.5 flex max-h-[calc(100vh-10rem)] flex-col gap-3 overflow-y-auto p-1.5">{slides.map(thumb)}</div>
        {slides.length > 1 && <p className="mt-3 text-center text-[0.68rem] font-medium uppercase tracking-[0.18em] text-taupe-deep tabular-nums" aria-live="polite">{i + 1} / {slides.length}</p>}
      </div>

      <div>
        {/* mobile: native snap carousel */}
        <div ref={track} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto lg:hidden" onScroll={(e) => { const t = e.currentTarget; const n = Math.round(t.scrollLeft / t.clientWidth); if (n !== i) setI(n); }}>
          {slides.map((s, n) => (
            <div key={n} className="relative aspect-[3/4] w-full shrink-0 snap-center overflow-hidden bg-cream">
              {s.type === "image" ? <Image src={s.img.url} alt={s.img.alt || `${name} — view ${n + 1}`} fill priority={n === 0} sizes="100vw" className="object-cover" onClick={() => setFull(true)} /> : <video src={s.url} controls playsInline className="h-full w-full object-cover" />}
            </div>
          ))}
        </div>

        {/* desktop: lens on the photo + a magnified pane that opens to the right.
            The gallery sits at z-20, so the pane is always painted ABOVE the details column (never interleaved with it). */}
        <div className="relative hidden lg:block lg:w-[min(100%,calc((100vh-7rem)*0.75))]">
          <div className="relative aspect-[3/4] cursor-crosshair overflow-hidden bg-cream"
            onMouseMove={(e) => { if (cur.type !== "image") return; const r = e.currentTarget.getBoundingClientRect(); setZoom({ x: Math.min(80, Math.max(20, ((e.clientX - r.left) / r.width) * 100)), y: Math.min(80, Math.max(20, ((e.clientY - r.top) / r.height) * 100)) }); }}
            onMouseLeave={() => setZoom(null)} onClick={() => cur.type === "image" && setFull(true)}>
            <AnimatePresence mode="wait">
              <motion.div key={i} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                {cur.type === "image" ? (
                  <Image src={cur.img.url} alt={cur.img.alt || `${name} — view ${i + 1}`} fill priority sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
                ) : <video src={cur.url} controls playsInline className="h-full w-full object-cover" />}
              </motion.div>
            </AnimatePresence>
            {zoom && cur.type === "image" && (
              <span aria-hidden className="pointer-events-none absolute h-[40%] w-[40%] border border-white/90 bg-white/30 shadow-[0_0_0_9999px_rgba(255,255,255,.18)]"
                style={{ left: `${zoom.x - 20}%`, top: `${zoom.y - 20}%` }} />
            )}
            {cur.type === "image" && (
              <>
                <span aria-hidden className={`pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-2 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-taupe-deep shadow-sm backdrop-blur transition-opacity duration-300 ${zoom ? "opacity-0" : "opacity-100"}`}><ZoomIn size={14} />Hover to zoom</span>
                <span className="pointer-events-none absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-sm"><Expand size={16} /></span>
              </>
            )}
          </div>

          <AnimatePresence>
            {zoom && cur.type === "image" && (
              <motion.div aria-hidden initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
                className="pointer-events-none absolute bottom-0 left-full top-0 z-50 ml-8 w-[calc(100%+3.6rem)] overflow-hidden border border-line bg-white shadow-[0_30px_80px_-30px_rgba(35,26,29,.55)]">
                <Image src={cur.img.url} alt="" fill sizes="60vw" className="object-cover" style={{ transform: `scale(2.5) translate(${50 - zoom.x}%, ${50 - zoom.y}%)` }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* mobile counter / dots */}
        <div className="mt-3 flex justify-center gap-2 lg:hidden" aria-hidden>
          {slides.map((_, n) => <span key={n} className={`h-1 rounded-full transition-all ${n === i ? "w-6 bg-espresso" : "w-2 bg-taupe"}`} />)}
        </div>
      </div>

      <AnimatePresence>
        {full && cur.type === "image" && (
          <motion.div role="dialog" aria-modal="true" aria-label={`${name} images`} className="fixed inset-0 z-[90] bg-ivory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button autoFocus onClick={() => setFull(false)} aria-label="Close" className="absolute right-4 top-4 z-10 grid h-12 w-12 place-items-center"><X size={26} strokeWidth={1.3} /></button>
            {slides.length > 1 && <>
              <button onClick={() => go(i - 1)} aria-label="Previous image" className="absolute left-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center"><ChevronLeft size={30} strokeWidth={1.2} /></button>
              <button onClick={() => go(i + 1)} aria-label="Next image" className="absolute right-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center"><ChevronRight size={30} strokeWidth={1.2} /></button>
            </>}
            <div className="relative h-full w-full"><Image src={cur.img.url} alt={cur.img.alt || name} fill sizes="100vw" className="object-contain p-6" /></div>
            <p className="absolute bottom-4 left-0 right-0 text-center text-xs tracking-[0.3em] text-taupe-deep">{i + 1} / {slides.length}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
