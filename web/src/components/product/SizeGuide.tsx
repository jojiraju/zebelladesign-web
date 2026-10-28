"use client";
import { useEffect, useState } from "react";
import { Ruler, X } from "lucide-react";

export function SizeGuide({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 normal-case tracking-normal underline underline-offset-4"><Ruler size={14} /> Size guide</button>
      {open && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-espresso/55 p-4" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Size guide" onClick={(e) => e.stopPropagation()} className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto bg-ivory p-8">
            <button autoFocus onClick={() => setOpen(false)} aria-label="Close size guide" className="absolute right-3 top-3 grid h-11 w-11 place-items-center"><X size={20} /></button>
            <h2 className="font-serif text-3xl">Size guide</h2>
            <div className="mt-5 text-sm leading-7 text-taupe-deep normal-case tracking-normal">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
