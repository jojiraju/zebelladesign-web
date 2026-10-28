"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Expand, Play, X } from "lucide-react";
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

  if (!slides.length) return <div className="aspect-[3/4] w-full bg-cream" />;
  const cur = slides[i];

  const thumb = (s: (typeof slides)[number], n: number) => (
    <button key={n} onClick={() => setI(n)} aria-label={`Show ${s.type === "video" ? "video" : `image ${n + 1}`}`} aria-current={n === i}
      className={`relative aspect-square w-16 shrink-0 overflow-hidden bg-cream outline-2 transition duration-300 lg:w-24 ${n === i ? "outline outline-espresso" : "hover:outline hover:outline-taupe"}`}>
      {s.type === "image" ? <Image src={s.img.url} alt="" fill sizes="80px" className="object-cover" /> : <span className="grid h-full place-items-center"><Play size={18} /></span>}
    </button>
  );

  return (
    <div className="grid gap-4 lg:sticky lg:top-24 lg:grid-cols-[6rem_1fr] lg:self-start">
      {/* desktop thumbs */}
      <div className="no-scrollbar hidden max-h-[calc(100vh-8rem)] flex-col gap-2.5 overflow-y-auto lg:flex lg:self-start">{slides.map(thumb)}</div>

      <div>
        {/* mobile: native snap carousel */}
        <div ref={track} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto lg:hidden" onScroll={(e) => { const t = e.currentTarget; const n = Math.round(t.scrollLeft / t.clientWidth); if (n !== i) setI(n); }}>
          {slides.map((s, n) => (
            <div key={n} className="relative aspect-[3/4] w-full shrink-0 snap-center overflow-hidden bg-cream">
              {s.type === "image" ? <Image src={s.img.url} alt={s.img.alt || `${name} — view ${n + 1}`} fill priority={n === 0} sizes="100vw" className="object-cover" onClick={() => setFull(true)} /> : <video src={s.url} controls playsInline className="h-full w-full object-cover" />}
            </div>
          ))}
        </div>

        {/* desktop: main image with lens + zoom pane that opens over the details column */}
        <div className="relative hidden lg:block lg:w-[min(100%,calc((100vh-7rem)*0.75))]">
          <div className="relative aspect-[3/4] cursor-crosshair overflow-hidden bg-cream"
            onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setZoom({ x: Math.min(80, Math.max(20, ((e.clientX - r.left) / r.width) * 100)), y: Math.min(80, Math.max(20, ((e.clientY - r.top) / r.height) * 100)) }); }}
            onMouseLeave={() => setZoom(null)} onClick={() => cur.type === "image" && setFull(true)}>
            <AnimatePresence mode="wait">
              <motion.div key={i} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                {cur.type === "image" ? (
                  <Image src={cur.img.url} alt={cur.img.alt || `${name} — view ${i + 1}`} fill priority sizes="45vw" className="object-cover" />
                ) : <video src={cur.url} controls playsInline className="h-full w-full object-cover" />}
              </motion.div>
            </AnimatePresence>
            {zoom && cur.type === "image" && (
              <span aria-hidden className="pointer-events-none absolute h-[40%] w-[40%] rounded-sm border border-white/90 bg-white/35 shadow-[0_0_0_9999px_rgba(255,255,255,.15)] [background-image:radial-gradient(rgba(35,26,29,.35)_1.2px,transparent_1.2px)] [background-size:9px_9px]"
                style={{ left: `${zoom.x - 20}%`, top: `${zoom.y - 20}%` }} />
            )}
            {cur.type === "image" && <span className="pointer-events-none absolute bottom-3 right-3 grid h-10 w-10 place-items-center bg-white/85"><Expand size={16} /></span>}
          </div>
          <AnimatePresence>
            {zoom && cur.type === "image" && (
              <motion.div aria-hidden initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                className="pointer-events-none absolute left-full top-0 z-30 ml-8 aspect-[3/4] w-full overflow-hidden bg-cream shadow-[0_20px_60px_-25px_rgba(0,0,0,.45)] lg:block">
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
