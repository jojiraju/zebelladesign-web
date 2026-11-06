"use client";
import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Pointer-driven 3D tilt with a soft light glare. Mouse only: does nothing on touch or under prefers-reduced-motion.
 * `className` styles the card itself (it is the element that tilts); `outerClassName` is for layout of the wrapper.
 */
export function TiltCard({ children, className = "", outerClassName = "", max = 7, glare = true }: {
  children: ReactNode; className?: string; outerClassName?: string; max?: number; glare?: boolean;
}) {
  const inner = useRef<HTMLDivElement>(null);

  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = inner.current;
    if (!el || e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.transition = "transform 90ms linear";
    el.style.transform = `rotateX(${((0.5 - py) * max * 2).toFixed(2)}deg) rotateY(${((px - 0.5) * max * 2).toFixed(2)}deg)`;
    el.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
    el.style.setProperty("--go", "1");
  };
  const leave = () => {
    const el = inner.current;
    if (!el) return;
    el.style.transition = "";
    el.style.transform = "";
    el.style.setProperty("--go", "0");
  };

  return (
    <div className={`h-full [perspective:1100px] ${outerClassName}`}>
      <div ref={inner} onPointerMove={move} onPointerLeave={leave}
        className={`relative h-full transition-transform duration-500 ease-out will-change-transform [transform-style:preserve-3d] ${className}`}>
        {children}
        {glare && (
          <span aria-hidden className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] transition-opacity duration-300"
            style={{ opacity: "var(--go, 0)", background: "radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), rgba(255,255,255,.32), transparent 55%)" }} />
        )}
      </div>
    </div>
  );
}

/** Scroll-in reveal where the element tips up from the floor in 3D (rotateX + lift). Fades only under reduced motion. */
export function Rise3D({ children, delay = 0, className = "", as = "div" }: {
  children: ReactNode; delay?: number; className?: string; as?: "div" | "li" | "section";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag className={className} style={{ transformOrigin: "50% 100%" }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, rotateX: 38, y: 56, scale: 0.94, transformPerspective: 1000 }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, rotateX: 0, y: 0, scale: 1, transformPerspective: 1000 }}
      viewport={{ once: true, margin: "-8% 0px" }} transition={{ duration: reduce ? 0.2 : 1.1, delay, ease }}>
      {children}
    </Tag>
  );
}

/** A big statement whose words light up one by one as you scroll through it. Plain text under reduced motion.
 *  `panel` renders it as a dark editorial band (centred, with an optional byline and button). */
export function ScrollStatement({ text, eyebrow, className = "", panel = false, byline, cta }: {
  text: string; eyebrow?: string; className?: string; panel?: boolean;
  byline?: { name: string; role?: string; image?: string }; cta?: { href: string; label: string };
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = !!useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = text.split(" ");
  const body = (
    <>
      <span className="sr-only">{text}</span>
      {words.map((w, i) => {
        const start = (i / words.length) * 0.8;
        return <Word key={i} progress={scrollYProgress} range={[start, start + 0.2]} reduce={reduce}>{w}</Word>;
      })}
    </>
  );

  if (!panel) {
    return (
      <section className="container-x mt-24 sm:mt-32" aria-label={eyebrow || "Statement"}>
        {eyebrow && <p className="eyebrow mb-6">{eyebrow}</p>}
        <p ref={ref} className={`max-w-5xl font-serif text-[clamp(1.9rem,4.6vw,4rem)] leading-[1.12] tracking-tight ${className}`}>{body}</p>
      </section>
    );
  }

  return (
    <section className="container-x mt-24 sm:mt-32" aria-label={eyebrow || "Statement"}>
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-espresso via-[#3a2029] to-wine px-6 py-16 text-center text-ivory shadow-[0_40px_90px_-50px_rgba(35,26,29,.85)] sm:px-14 sm:py-24">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 -z-10 h-80 w-80 rounded-full bg-gold/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 -z-10 h-80 w-80 rounded-full border border-ivory/10" />
        <span aria-hidden className="pointer-events-none absolute left-4 top-0 -z-10 select-none font-serif text-[14rem] leading-none text-ivory/[0.07] sm:left-12 sm:text-[20rem]">&ldquo;</span>
        {eyebrow && <p className="eyebrow justify-center !text-rose-soft">{eyebrow}</p>}
        <p ref={ref} className={`mx-auto mt-7 max-w-4xl text-balance font-serif text-[clamp(1.7rem,3.9vw,3.3rem)] leading-[1.18] tracking-tight ${className}`}>{body}</p>
        {(byline || cta) && (
          <div className="mt-10 flex flex-col items-center justify-center gap-6 sm:mt-12 sm:flex-row sm:gap-10">
            {byline && (
              <div className="flex items-center gap-4 text-left">
                {byline.image && <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-rose-soft/70"><Image src={byline.image} alt="" fill sizes="56px" className="object-cover object-top" /></span>}
                <span><b className="block font-serif text-xl font-normal leading-tight">{byline.name}</b>{byline.role && <span className="text-[0.68rem] uppercase tracking-[0.2em] text-ivory/65">{byline.role}</span>}</span>
              </div>
            )}
            {cta && <Link href={cta.href} className="btn btn-light">{cta.label} <ArrowRight size={15} className="arrow" aria-hidden /></Link>}
          </div>
        )}
      </div>
    </section>
  );
}

function Word({ children, progress, range, reduce }: { children: ReactNode; progress: MotionValue<number>; range: [number, number]; reduce: boolean }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  const y = useTransform(progress, range, [10, 0]);
  return (
    <span aria-hidden>
      <motion.span style={reduce ? undefined : { opacity, y }} className="inline-block">{children}</motion.span>{" "}
    </span>
  );
}
