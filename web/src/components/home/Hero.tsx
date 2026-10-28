"use client";
import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { HeroSlide } from "@/lib/content";

const ease = [0.22, 1, 0.36, 1] as const;

/** Full-bleed campaign hero. Sits under the transparent header (-mt-20 cancels the sticky header's flow space). */
export function Hero({ hero }: { hero: HeroSlide }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "14%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.04, reduce ? 1.04 : 1.14]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-12%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, reduce ? 1 : 0]);

  const desktop = hero.imageUrl || "/art/hero.svg";
  const mobile = hero.mobileImageUrl || (hero.imageUrl ? hero.imageUrl : "/art/hero-mobile.svg");

  return (
    <section ref={ref} className="relative -mt-20 flex min-h-[100svh] items-end overflow-hidden bg-espresso text-ivory" aria-label="Featured campaign">
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        <Image src={mobile} alt="" fill priority sizes="100vw" className="object-cover md:hidden" />
        <Image src={desktop} alt="" fill priority sizes="100vw" className="hidden object-cover md:block" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-espresso/75 via-espresso/15 to-espresso/35" aria-hidden />

      <motion.div style={{ y: textY, opacity: fade }} className="container-x relative pb-[11vh] pt-40">
        {hero.eyebrow && (
          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3, ease }} className="eyebrow !text-ivory/90">
            {hero.eyebrow}
          </motion.p>
        )}
        <h1 className="display mt-5 max-w-4xl font-light" aria-label={hero.heading}>
          {hero.heading.split(" ").map((w, i) => (
            <span key={i}>
              <span aria-hidden className="inline-block overflow-hidden pb-[0.1em] align-bottom">
                <motion.span className="inline-block" initial={{ y: reduce ? 0 : "108%", opacity: reduce ? 0 : 1 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: reduce ? 0.3 : 1.2, delay: 0.45 + i * 0.09, ease }}>{w}</motion.span>
              </span>
              {/* real space so the heading's text content (SEO, copy/paste) keeps its word breaks */}
              {" "}
            </span>
          ))}
        </h1>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1.1, ease }} className="mt-10 flex flex-wrap gap-4">
          {hero.ctaLabel && hero.ctaHref && <Link href={hero.ctaHref} className="btn btn-light">{hero.ctaLabel} <span className="arrow">→</span></Link>}
          {hero.secondaryLabel && hero.secondaryHref && <Link href={hero.secondaryHref} className="btn btn-outline-light">{hero.secondaryLabel}</Link>}
        </motion.div>
      </motion.div>

      <motion.div aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }} className="absolute bottom-6 right-6 hidden items-center gap-3 text-[0.65rem] uppercase tracking-[0.3em] text-ivory/70 md:flex">
        Scroll <span className="relative block h-10 w-px overflow-hidden bg-ivory/30"><span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2s_ease-in-out_infinite] bg-ivory" /></span>
      </motion.div>
      <style>{`@keyframes scrollcue{0%{transform:translateY(-100%)}100%{transform:translateY(200%)}}`}</style>
    </section>
  );
}
