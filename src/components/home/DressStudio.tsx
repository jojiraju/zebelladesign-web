"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { ArrowRight, MousePointer2 } from "lucide-react";

import type { LookImage } from "./DressScene";

const Scene = dynamic(() => import("./DressScene"), { ssr: false });

const SWATCHES = [
  { name: "Rose", hex: "#b96e7c" }, { name: "Wine", hex: "#6e2339" }, { name: "Emerald", hex: "#1f6b4a" }, { name: "Royal blue", hex: "#243f94" },
  { name: "Mustard", hex: "#d4a02a" }, { name: "Lavender", hex: "#9b7bc4" }, { name: "Ivory", hex: "#efe4d3" }, { name: "Black", hex: "#1d1a1b" },
];
const LOOKS = [
  { name: "Anarkali", shop: "anarkalis", line: "A fitted bodice, gold embroidery and a sweeping flare.", href: "/categories/anarkalis",
    img: { src: "/art/cut-anarkali.webp", hsv: [155, 0.84, 0.15], tol: 48, minSat: 0.35, maxVal: 0.7 } },
  { name: "Ball gown", shop: "gowns", line: "Floaty tulle with soft floral embroidery.", href: "/categories/gowns",
    img: { src: "/art/cut-gown.webp", hsv: [338, 0.38, 0.72], tol: 26, minSat: 0.2, maxVal: 1.01 } },
  { name: "Frock", shop: "frocks", line: "A twirl-ready frock, with the white polka dots left as they are.", href: "/categories/frocks",
    img: { src: "/art/cut-polka-frock-navy.webp", hsv: [235, 0.57, 0.18], tol: 34, minSat: 0.4, maxVal: 0.5 } },
  { name: "Festive", shop: "festive wear", line: "Rich colour for weddings and celebrations.", href: "/collections/festive-wear",
    img: { src: "/art/cut-festive.webp", hsv: [325, 0.91, 0.29], tol: 30, minSat: 0.5, maxVal: 0.62 } },
] as const;
const LOOK_IMAGES: LookImage[] = LOOKS.map((l) => ({ ...l.img, hsv: [...l.img.hsv] as [number, number, number] }));

/** Soft left/right edges: a look sliding in or out fades at the stage boundary instead of being cut by a hard line. */
const FEATHER = { WebkitMaskImage: "linear-gradient(to right, transparent 0, #000 9%, #000 91%, transparent 100%)", maskImage: "linear-gradient(to right, transparent 0, #000 9%, #000 91%, transparent 100%)" } as const;

/** Scroll-driven 3D dress: pick a colour; scrolling swings between three looks. */
export function DressStudio() {
  const section = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [color, setColor] = useState(SWATCHES[0].hex);
  const [look, setLook] = useState(0);
  const [weak, setWeak] = useState(false);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (p) => setLook(Math.min(LOOKS.length - 1, Math.max(0, Math.floor(p * LOOKS.length)))));

  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- capability probe, only possible in the browser
    setWeak(!!((nav.deviceMemory ?? 8) <= 2 || (nav.hardwareConcurrency ?? 8) <= 2 || nav.connection?.saveData));
    if (!section.current) return;
    const io = new IntersectionObserver(([e]) => { setVisible(e.isIntersecting); if (e.isIntersecting) setNear(true); }, { rootMargin: "300px" });
    io.observe(section.current);
    return () => io.disconnect();
  }, []);

  function goTo(i: number) {
    const el = section.current; if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + ((i + 0.5) / LOOKS.length) * (el.offsetHeight - window.innerHeight), behavior: "smooth" });
  }

  const still = reduce || weak;
  const L = LOOKS[look];
  const colorName = SWATCHES.find((s) => s.hex === color)?.name ?? "";

  return (
    <section ref={section} aria-labelledby="studio-h" className={`relative mt-24 sm:mt-32 ${still ? "" : "h-[420svh]"}`}>
      <div className={`${still ? "" : "sticky top-28 h-[calc(100svh-11.5rem)] min-h-[32rem] lg:h-[calc(100svh-7rem)] lg:min-h-[34rem]"} container-x`}>
        <div className="relative grid h-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-blush via-ivory to-cream p-5 ring-1 ring-line sm:p-8 grid-rows-[minmax(13rem,1fr)_auto] lg:grid-cols-[0.9fr_1.1fr] lg:grid-rows-1 lg:gap-6 lg:p-12">
          <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-rose-soft/30 blur-3xl" />

          {/* copy + controls */}
          <div className="relative z-10 order-2 flex flex-col justify-center lg:order-1">
            <p className="eyebrow">Dress studio</p>
            <h2 id="studio-h" className="mt-2 font-serif text-3xl leading-[1.05] sm:mt-3 sm:text-5xl lg:text-6xl">Pick your colour. <span className="italic text-gradient">Watch it change.</span></h2>
            <p className="mt-4 hidden max-w-md text-taupe-deep sm:block">Choose a shade, then scroll to flip through four looks on our models. Only the dress changes colour.</p>

            <div className="mt-3 sm:mt-7">
              <p className="label">Colour <span className="ml-2 normal-case tracking-normal text-espresso">{colorName}</span></p>
              <div className="mt-2 flex flex-wrap gap-2 sm:gap-2.5" role="group" aria-label="Dress colour">
                {SWATCHES.map((s) => (
                  <button key={s.hex} type="button" onClick={() => setColor(s.hex)} aria-pressed={color === s.hex} aria-label={s.name}
                    className={`relative h-8 w-8 rounded-full border border-black/10 outline-none transition duration-300 hover:scale-110 focus-visible:ring-2 focus-visible:ring-gold-deep sm:h-10 sm:w-10 ${color === s.hex ? "ring-2 ring-gold-deep ring-offset-2 ring-offset-ivory" : ""}`}
                    style={{ background: s.hex }} />
                ))}
              </div>
            </div>

            <div className="mt-3 sm:mt-7" role="group" aria-label="Look">
              <p className="label">Look</p>
              <div className="mt-2 inline-flex isolate rounded-full bg-white/80 p-1 ring-1 ring-line">
                {LOOKS.map((l, i) => (
                  <button key={l.name} type="button" onClick={() => (still ? setLook(i) : goTo(i))} aria-pressed={look === i}
                    className={`relative whitespace-nowrap rounded-full px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] outline-none transition sm:px-4 sm:py-2 sm:text-xs ${look === i ? "text-white" : "text-taupe-deep hover:text-gold-deep"}`}>
                    {look === i && <motion.span layoutId="studio-pill" className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-rose-soft to-gold-deep" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
                    {l.name}
                  </button>
                ))}
              </div>
              <p className="mt-3 hidden text-sm text-taupe-deep sm:block" aria-live="polite">{L.line}</p>
            </div>

            <Link href={L.href} className="btn btn-solid mt-4 w-fit !min-h-11 sm:mt-8">Shop {L.shop} <ArrowRight size={15} className="arrow" aria-hidden /></Link>
          </div>

          {/* 3D stage */}
          <div className="relative order-1 -mx-2 min-h-[13rem] lg:order-2 lg:mx-0 lg:min-h-[18rem]">
            {still ? (
              <Image src="/art/hero-ethnic.webp" alt="Model in an embroidered ethnic dress" fill sizes="(min-width:1024px) 50vw, 100vw" className="rounded-2xl object-cover object-right-top" />
            ) : (
              <>
                <div role="img" aria-label={`3D ${L.name.toLowerCase()} in ${colorName.toLowerCase()}`} className="absolute inset-0" style={FEATHER}>
                  {near && <Scene looks={LOOK_IMAGES} progress={scrollYProgress} color={color} active={visible} />}
                </div>
                <p aria-hidden className="pointer-events-none absolute right-4 top-2 hidden items-center gap-2 whitespace-nowrap rounded-full bg-white/80 px-4 py-2 text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-taupe-deep backdrop-blur lg:flex"><MousePointer2 size={13} /> Scroll to change the look</p>
                <span aria-hidden className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 flex-col gap-2 lg:flex">
                  {LOOKS.map((l, i) => <span key={l.name} className={`block w-1.5 rounded-full transition-all duration-500 ${look === i ? "h-8 bg-gold-deep" : "h-1.5 bg-espresso/25"}`} />)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
