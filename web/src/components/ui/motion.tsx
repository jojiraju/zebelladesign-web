"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

/** Fade-and-rise reveal on scroll. Collapses to a plain fade under prefers-reduced-motion. */
export function Reveal({ children, delay = 0, y = 28, className = "", as = "div" }: {
  children: ReactNode; delay?: number; y?: number; className?: string; as?: "div" | "li" | "section";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag className={className} initial={{ opacity: 0, y: reduce ? 0 : y }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }} transition={{ duration: reduce ? 0.2 : 0.9, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </Tag>
  );
}

/** Editorial headline reveal: each word rises out of a mask. */
export function WordReveal({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <span className={className} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span className="inline-block" initial={{ y: reduce ? 0 : "110%", opacity: reduce ? 0 : 1 }} whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }} transition={{ duration: reduce ? 0.2 : 1, delay: delay + i * 0.07, ease: [0.22, 1, 0.36, 1] }}>
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Image mask reveal (clip-path wipe) + optional GSAP ScrollTrigger parallax. GSAP is code-split & only loaded when this mounts. */
export function ParallaxFrame({ children, className = "", strength = 8 }: { children: ReactNode; className?: string; strength?: number }) {
  const frame = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !frame.current || !inner.current) return;
    let kill: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled || !frame.current || !inner.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        gsap.fromTo(frame.current, { clipPath: "inset(12% 8% 12% 8%)" }, {
          clipPath: "inset(0% 0% 0% 0%)", ease: "power3.out", duration: 1.4,
          scrollTrigger: { trigger: frame.current, start: "top 85%", once: true },
        });
        gsap.fromTo(inner.current, { yPercent: -strength }, {
          yPercent: strength, ease: "none",
          scrollTrigger: { trigger: frame.current, start: "top bottom", end: "bottom top", scrub: true },
        });
      }, frame);
      kill = () => ctx.revert();
    })();
    return () => { cancelled = true; kill?.(); };
  }, [reduce, strength]);

  return (
    <div ref={frame} className={`overflow-hidden ${className}`}>
      <div ref={inner} className="h-[116%] w-full -translate-y-[0%] will-change-transform">{children}</div>
    </div>
  );
}
