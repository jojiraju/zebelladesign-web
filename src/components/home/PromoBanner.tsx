"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Banner } from "@/lib/content";

const Snow = dynamic(() => import("./SnowScene"), { ssr: false });
const ease = [0.22, 1, 0.36, 1] as const;

/** Featured campaign card: real model cut-outs that float in, falling snow and baubles in three.js, staggered text. */
export function PromoBanner({ banner: b }: { banner: Banner }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const models = b.modelImages?.length ? b.modelImages : [];

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => { setVisible(e.isIntersecting); if (e.isIntersecting) setNear(true); }, { rootMargin: "250px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const rise = (delay: number, x = 0) => ({ initial: { opacity: 0, y: reduce ? 0 : 36, x: reduce ? 0 : x }, whileInView: { opacity: 1, y: 0, x: 0 }, viewport: { once: true, margin: "-60px" }, transition: { duration: reduce ? 0.2 : 1, delay: reduce ? 0 : delay, ease } });
  const slide = (delay: number) => ({ initial: { opacity: 0, y: reduce ? 0 : 22 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-60px" }, transition: { duration: reduce ? 0.2 : 0.8, delay: reduce ? 0 : delay, ease } });

  return (
    <div ref={ref} className="group relative isolate flex min-h-[34rem] flex-col overflow-hidden rounded-[1.75rem] bg-[#0b2218] shadow-[0_40px_80px_-45px_rgba(23,56,42,.85)] sm:min-h-[30rem] sm:flex-row sm:items-center sm:rounded-[2rem]">
      {/* backdrop: deep green with a warm glow behind the models */}
      <div aria-hidden className="absolute inset-0 -z-30 bg-[radial-gradient(120%_90%_at_75%_50%,#1f5a3f_0%,#0f3224_45%,#08170f_100%)]" />
      {!models.length && <Image src={b.desktopImage || b.mobileImage || "/art/banner.svg"} alt="" fill sizes="100vw" className="-z-20 object-cover object-right opacity-90" />}
      <div aria-hidden className="absolute right-[18%] top-1/2 -z-20 hidden h-[36rem] w-[36rem] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,214,150,.30)_0%,rgba(255,214,150,0)_62%)] sm:block" />

      {/* models: three full-length figures standing on one floor line, centre one tallest */}
      {models.length > 0 && (
        <div className="relative order-first mt-8 h-[19rem] w-full sm:absolute sm:inset-y-0 sm:right-0 sm:order-none sm:mt-0 sm:h-auto sm:w-[60%]">
          <div aria-hidden className="absolute inset-x-[6%] bottom-[2%] h-[7%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(0,0,0,.55),transparent)]" />
          <div aria-hidden className="absolute inset-x-[8%] -bottom-[3%] h-[16%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(232,207,138,.30),transparent)]" />
          {[
            { src: models[1] ?? models[0], box: "left-[1%] h-[72%] w-[33%] sm:h-[74%]", delay: 0.2, from: -50, bob: 7 },
            { src: models[0], box: "left-[31%] h-[90%] w-[38%] sm:h-[91%]", delay: 0.05, from: 0, bob: 6 },
            { src: models[2] ?? models[0], box: "right-[1%] h-[76%] w-[33%] sm:h-[77%]", delay: 0.35, from: 50, bob: 8 },
          ].map((m, i) => (
            <motion.div key={i} {...rise(m.delay, m.from)} className={`absolute bottom-[3%] ${m.box} ${i === 1 ? "z-10" : ""}`}>
              <motion.div animate={reduce ? undefined : { y: [0, -5, 0] }} transition={{ duration: m.bob, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }} className="relative h-full w-full">
                <Image src={m.src} alt="" fill sizes="(min-width:640px) 22vw, 36vw" className="object-contain object-bottom drop-shadow-[0_24px_30px_rgba(0,0,0,.4)]" />
              </motion.div>
            </motion.div>
          ))}
        </div>
      )}
      <div aria-hidden className="absolute inset-y-0 left-0 -z-10 hidden w-[46%] bg-gradient-to-r from-[#08170f] via-[#08170f]/60 to-transparent sm:block" />

      {/* three.js: snow + baubles, in front of the models */}
      {!reduce && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-10">{near && <Snow active={visible} />}</div>
      )}

      {/* copy */}
      <div className="relative z-20 w-full px-6 pb-9 pt-3 sm:max-w-[36rem] sm:p-12 lg:p-16">
        <motion.span {...slide(0.05)} className="inline-flex items-center gap-2 rounded-full border border-[#e8cf8a]/40 bg-white/10 px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-ivory backdrop-blur"><Sparkles size={13} className="text-[#e8cf8a]" aria-hidden /> Featured edit</motion.span>
        <motion.h2 {...slide(0.15)} className="mt-5 font-serif text-4xl leading-[1.04] text-ivory sm:text-5xl lg:text-6xl">{b.heading}</motion.h2>
        {b.description && <motion.p {...slide(0.3)} className="mt-4 max-w-md text-base leading-7 text-ivory/80 sm:text-lg">{b.description}</motion.p>}
        {b.ctaLabel && b.href && (
          <motion.div {...slide(0.45)} className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={b.href} className="btn btn-light">{b.ctaLabel} <ArrowRight size={16} className="arrow" aria-hidden /></Link>
            <Link href="/collections" className="btn btn-outline-light">All collections</Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
