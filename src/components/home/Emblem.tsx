"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

const Scene = dynamic(() => import("./EmblemScene"), { ssr: false });

/**
 * Optional 3D brand emblem. Mounted only when: the section scrolls into view, the user hasn't asked for
 * reduced motion / data saving, and the device isn't clearly low-powered. Otherwise a static CSS emblem shows.
 */
export function Emblem({ message }: { message: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [on, setOn] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const weak = (nav.deviceMemory ?? 8) <= 2 || (nav.hardwareConcurrency ?? 8) <= 2 || nav.connection?.saveData;
    if (reduce || weak || !ref.current) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { rootMargin: "200px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [reduce]);

  return (
    <section className="mt-36 bg-espresso text-ivory" aria-label="Brand statement">
      <div className="container-x grid items-center gap-8 py-20 md:grid-cols-2">
        <div>
          <p className="eyebrow !text-gold mb-5">The Zebella signature</p>
          <p className="font-serif text-4xl font-light leading-tight sm:text-6xl">{message}</p>
        </div>
        <div ref={ref} className="relative mx-auto aspect-square w-full max-w-md" role="img" aria-label="Decorative 3D Zebella ZB monogram">
          {on ? <Scene /> : (
            // Static fallback (reduced motion / low-power devices / before scroll-in): the flat monogram, tinted gold to match the 3D emblem
            <div className="absolute inset-0 grid place-items-center" aria-hidden><div className="aspect-[500/414] w-[78%] bg-gradient-to-br from-[#f0cf7a] via-[#d4a437] to-[#a97c1f] [mask:url(/brand/logo-mark.png)_center/contain_no-repeat]" /></div>
          )}
        </div>
      </div>
    </section>
  );
}
