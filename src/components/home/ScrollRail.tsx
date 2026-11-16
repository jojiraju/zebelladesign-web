"use client";

import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** A swipeable row that fits the page width (like every other section) with arrow buttons on desktop.
 *  On phones it becomes a plain two-column grid that wraps down the page instead of swiping sideways. */
export function ScrollRail({ children, className = "", arrows = true }: { children: ReactNode; className?: string; arrows?: boolean }) {
  const ref = useRef<HTMLUListElement>(null);
  const by = (d: number) => { const el = ref.current; if (el) el.scrollBy({ left: d * el.clientWidth * 0.85, behavior: "smooth" }); };
  const btn = "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white shadow-lg transition hover:scale-105 lg:grid";
  return (
    <div className="relative">
      <ul ref={ref} className={`grid grid-cols-2 gap-x-3 gap-y-8 sm:flex sm:snap-x sm:gap-5 sm:overflow-x-auto sm:pb-3 sm:[scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}>
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
