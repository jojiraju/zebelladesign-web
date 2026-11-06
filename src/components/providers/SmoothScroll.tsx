"use client";
import { useEffect } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Inertia ("glide") scrolling for mouse wheels and trackpads via Lenis. Touch devices keep native scrolling,
 * and it is off for people who asked for reduced motion. Inner scroll areas (drawers, dialogs, filter panel)
 * carry `data-lenis-prevent` so they keep scrolling natively.
 */
export function SmoothScroll() {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    let destroy: (() => void) | undefined;
    let cancelled = false;
    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, anchors: { offset: -90 } });
      const tick = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
      // Modals lock the page with body{overflow:hidden}; pause the glide while locked.
      const mo = new MutationObserver(() => { if (document.body.style.overflow === "hidden") lenis.stop(); else lenis.start(); });
      mo.observe(document.body, { attributes: true, attributeFilter: ["style"] });
      destroy = () => { mo.disconnect(); cancelAnimationFrame(raf); lenis.destroy(); };
    });
    return () => { cancelled = true; destroy?.(); };
  }, [reduce]);
  return null;
}
