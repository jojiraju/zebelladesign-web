"use client";
import { useRef } from "react";
import { useAnimationFrame, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, useVelocity, motion } from "motion/react";

const wrap = (min: number, max: number, v: number) => { const r = max - min; return ((((v - min) % r) + r) % r) + min; };

const Sparkle = () => (
  <svg viewBox="-16 -16 32 32" aria-hidden className="mx-[0.35em] h-[0.4em] w-[0.4em] shrink-0 text-gold"><path d="M0,-14 C1,-5 5,-1 14,0 C5,1 1,5 0,14 C-1,5 -5,1 -14,0 C-5,-1 -1,-5 0,-14 Z" fill="currentColor" /></svg>
);

/** One group of words; the strip repeats it twice so the loop is seamless. */
function Words({ words, outline }: { words: string[]; outline: boolean }) {
  return (
    <span className="flex shrink-0 items-center">
      {[...words, ...words].map((w, i) => (
        <span key={i} className="flex items-center">
          <span className={outline && i % 2 ? "text-transparent [-webkit-text-stroke:1.5px_var(--color-espresso)]" : ""}>{w}</span>
          <Sparkle />
        </span>
      ))}
    </span>
  );
}

/** A strip that drifts on its own and speeds up (and flips direction) with the page's scroll velocity. */
function Row({ words, dir, base, outline, className }: { words: string[]; dir: 1 | -1; base: number; outline: boolean; className: string }) {
  const x = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 });
  const boost = useTransform(smooth, [0, 1000], [0, 5], { clamp: false });
  const sign = useRef<number>(dir);
  const xPct = useTransform(x, (v) => `${wrap(-50, 0, v)}%`);

  useAnimationFrame((_, delta) => {
    const f = boost.get();
    if (f < -0.05) sign.current = -dir; else if (f > 0.05) sign.current = dir;
    const step = sign.current * base * (delta / 1000);
    x.set(x.get() + step + step * Math.abs(f));
  });

  return (
    <div className="flex overflow-hidden whitespace-nowrap">
      <motion.div style={{ x: xPct }} className={`flex w-max ${className}`}>
        <Words words={words} outline={outline} />
        <Words words={words} outline={outline} />
      </motion.div>
    </div>
  );
}

/** Decorative scrolling text bands (collection names). Static under prefers-reduced-motion. */
export function ScrollMarquee({ words }: { words: string[] }) {
  const reduce = useReducedMotion();
  const list = words.length >= 3 ? words : ["Anarkalis", "Gowns", "Frocks", "Salwar sets", "Cord sets"];
  const text = "font-serif text-[clamp(3rem,8vw,7rem)] leading-[1.15] tracking-tight";
  return (
    <div aria-hidden className="mt-24 overflow-hidden border-y border-line py-5 sm:mt-32 sm:py-7">
      {reduce ? (
        <div className={`overflow-hidden whitespace-nowrap ${text}`}><Words words={list} outline={false} /></div>
      ) : (
        <>
          <Row words={list} dir={-1} base={2.2} outline className={text} />
          <Row words={list} dir={1} base={1.8} outline={false} className={`${text} italic text-gold-deep`} />
        </>
      )}
    </div>
  );
}
