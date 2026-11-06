"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowRight } from "lucide-react";
import { TiltCard } from "./fx";

export interface ShowcaseItem { title: string; subtitle?: string; imageUrl: string; href: string }

/**
 * Pinned horizontal scroll: the section stays on screen while vertical scrolling slides a row of cards sideways.
 * Built on CSS sticky + Motion (no scroll-jacking), so the page keeps its native scroll. Under reduced motion it is a plain swipeable row.
 */
export function HorizontalShowcase({ eyebrow, title, items, href, linkLabel = "View all" }: {
  eyebrow?: string; title: string; items: ShowcaseItem[]; href?: string; linkLabel?: string;
}) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const travel = useMotionValue(0);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const x = useTransform([scrollYProgress, travel], (v: number[]) => -v[0] * v[1]);

  useEffect(() => {
    const measure = () => {
      const s = section.current, t = track.current;
      if (!s || !t) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { s.style.height = ""; travel.set(0); return; }
      const dist = Math.max(0, t.scrollWidth - window.innerWidth);
      travel.set(dist);
      s.style.height = `${dist + window.innerHeight}px`; // the pinned scroll distance equals how far the row has to travel
    };
    measure();
    window.addEventListener("resize", measure);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (ro && track.current) ro.observe(track.current);
    return () => { window.removeEventListener("resize", measure); ro?.disconnect(); };
  }, [travel]);

  /** Keyboard focus on an off-screen card scrolls the page (not the clipped row) so the card slides into view. */
  const onFocus = (e: React.FocusEvent) => {
    const s = section.current, t = track.current, dist = travel.get();
    if (!s || !t || !dist) return;
    if (t.parentElement) t.parentElement.scrollLeft = 0;
    const i = Array.from(t.children).findIndex((c) => c.contains(e.target as Node));
    if (i < 0) return;
    const card = t.children[i] as HTMLElement;
    const p = Math.min(dist, Math.max(0, card.offsetLeft - 80)) / dist;
    window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY + p * dist });
  };

  if (items.length < 3) return null;

  return (
    <section ref={section} aria-label={title} className="relative mt-24 h-[300vh] sm:mt-32 motion-reduce:h-auto">
      <div className="sticky top-0 flex h-svh min-h-[34rem] flex-col justify-center gap-8 overflow-hidden pt-24 motion-reduce:hidden">
        <div className="container-x flex w-full items-end justify-between gap-6">
          <div>
            {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
            <h2 className="h-section font-serif">{title}</h2>
          </div>
          {href && <Link href={href} className="link-underline hidden shrink-0 text-xs font-medium uppercase tracking-[0.22em] sm:inline-block">{linkLabel} →</Link>}
        </div>

        <motion.div ref={track} style={{ x }} onFocus={onFocus} className="flex w-max gap-5 px-[clamp(1rem,3.5vw,3rem)] will-change-transform sm:gap-6">
          {items.map((it, i) => <ShowcaseCard key={it.href} item={it} index={i} progress={scrollYProgress} />)}
        </motion.div>

        <div className="container-x" aria-hidden>
          <div className="h-px w-full bg-line"><motion.div style={{ scaleX: scrollYProgress }} className="h-full origin-left bg-gold-deep" /></div>
        </div>
      </div>

      {/* Reduced motion: no pinning, just a swipeable row */}
      <div className="container-x hidden motion-reduce:block">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="h-section mb-8 font-serif">{title}</h2>
        <ul className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-4">
          {items.map((it) => (
            <li key={it.href} className="w-56 shrink-0 snap-start sm:w-64">
              <Link href={it.href} className="group block">
                <span className="relative block aspect-[3/4] overflow-hidden rounded-2xl bg-cream"><Image src={it.imageUrl} alt="" fill sizes="16rem" className="object-cover object-top" /></span>
                <span className="mt-3 block font-serif text-lg leading-snug">{it.title}</span>
                {it.subtitle && <span className="block text-sm text-taupe-deep">{it.subtitle}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ShowcaseCard({ item, index, progress }: { item: ShowcaseItem; index: number; progress: MotionValue<number> }) {
  // The photo drifts slightly against the row's movement, so each card has depth.
  const imgX = useTransform(progress, [0, 1], ["-5%", "5%"]);
  return (
    <TiltCard outerClassName="w-[clamp(15rem,27vw,23rem)] shrink-0" className="rounded-[1.6rem]">
      <Link href={item.href} className="group relative block aspect-[3/4] overflow-hidden rounded-[1.6rem] bg-cream shadow-[0_40px_70px_-40px_rgba(35,26,29,.7)]">
        <motion.div style={{ x: imgX }} className="absolute inset-y-0 -inset-x-[8%]">
          <Image src={item.imageUrl} alt="" fill draggable={false} sizes="(min-width:768px) 27vw, 70vw" className="object-cover object-top" />
        </motion.div>
        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-espresso/70 via-transparent to-transparent" />
        <span aria-hidden className="absolute left-4 top-4 rounded-full bg-white/80 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.2em] text-espresso backdrop-blur">{String(index + 1).padStart(2, "0")}</span>
        <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-ivory">
          <span className="min-w-0"><span className="block font-serif text-2xl leading-tight">{item.title}</span>{item.subtitle && <span className="mt-1 block text-sm text-ivory/80">{item.subtitle}</span>}</span>
          <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-deep transition-transform duration-500 group-hover:translate-x-0.5 group-hover:scale-110"><ArrowRight size={16} /></span>
        </span>
      </Link>
    </TiltCard>
  );
}
