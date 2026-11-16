"use client";

import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** A swipeable row that fits the page width (like every other section) with arrow buttons on desktop. */
export function ScrollRail({ children, className = "", arrows = true }: { children: ReactNode; className?: string; arrows?: boolean }) {
  const ref = useRef<HTMLUListElement>(null);
  const by = (d: number) => { const el = ref.current; if (el) el.scrollBy({ left: d * el.clientWidth * 0.85, behavior: "smooth" }); };
  const btn = "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white shadow-lg transition hover:scale-105 lg:grid";
  return (
    <div className="relative">
      <ul ref={ref} className={`-mx-4 flex scroll-px-4 snap-x gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:gap-5 sm:px-0 [&::-webkit-scrollbar]:hidden ${className}`}>
        {children}
      </ul>
      {arrows && (
        <>
          <button type="button" onClick={() => by(-1)} aria-label="Scroll left" className={`${btn} -left-5`}><ChevronLeft size={18} /></button>
          <button type="button" onClick={() => by(1)} aria-label="Scroll right" className={`${btn} -right-5`}><ChevronRight size={18} /></button>
        </>
      )}
    </div>
  );
}
