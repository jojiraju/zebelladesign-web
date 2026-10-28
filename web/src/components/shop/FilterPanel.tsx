"use client";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export interface Facets { sizes: string[]; colors: { name: string; hex?: string }[]; minPrice: number; maxPrice: number }

const SORTS = [["newest", "Newest"], ["popular", "Most popular"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"]] as const;

/**
 * Filters live entirely in the URL (?size=M&color=Ivory&min=1000&sort=popular), so every filtered view is
 * shareable, bookmarkable and server-rendered. Mobile gets a slide-up drawer.
 */
export function FilterPanel({ facets, total, children }: { facets: Facets; total: number; children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", esc); };
  }, [open]);

  function update(mut: (p: URLSearchParams) => void) {
    const p = new URLSearchParams(sp.toString());
    mut(p);
    p.delete("page");
    start(() => router.push(`${path}${p.toString() ? `?${p}` : ""}`, { scroll: false }));
  }
  const toggleMulti = (key: string, val: string) => update((p) => {
    const cur = p.getAll(key);
    p.delete(key);
    (cur.includes(val) ? cur.filter((c) => c !== val) : [...cur, val]).forEach((v) => p.append(key, v));
  });

  const activeCount = sp.getAll("size").length + sp.getAll("color").length + (sp.get("inStock") ? 1 : 0) + (sp.get("min") || sp.get("max") ? 1 : 0);
  const chip = (on: boolean) => `min-h-10 min-w-11 border px-3 text-sm transition ${on ? "border-espresso bg-espresso text-ivory" : "border-line hover:border-espresso"}`;

  const body = (
    <div className="space-y-9">
      <fieldset><legend className="label">Availability</legend>
        <label className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#8f4a5b]" checked={sp.get("inStock") === "1"} onChange={(e) => update((p) => e.target.checked ? p.set("inStock", "1") : p.delete("inStock"))} /> In stock only</label>
      </fieldset>
      {facets.sizes.length > 0 && <fieldset><legend className="label">Size</legend>
        <div className="flex flex-wrap gap-2">{facets.sizes.map((s) => <button key={s} type="button" aria-pressed={sp.getAll("size").includes(s)} className={chip(sp.getAll("size").includes(s))} onClick={() => toggleMulti("size", s)}>{s}</button>)}</div></fieldset>}
      {facets.colors.length > 0 && <fieldset><legend className="label">Colour</legend>
        <div className="flex flex-wrap gap-3">{facets.colors.map((c) => { const on = sp.getAll("color").includes(c.name); return (
          <button key={c.name} type="button" aria-pressed={on} aria-label={c.name} title={c.name} onClick={() => toggleMulti("color", c.name)}
            className={`h-8 w-8 rounded-full border transition ${on ? "ring-2 ring-gold ring-offset-2 ring-offset-ivory border-espresso" : "border-line"}`} style={{ background: c.hex || "#d8cbb8" }} />); })}</div></fieldset>}
      <fieldset><legend className="label">Price (₹)</legend>
        <PriceForm key={`${sp.get("min")}-${sp.get("max")}`} initialMin={sp.get("min") ?? ""} initialMax={sp.get("max") ?? ""} facets={facets}
          onApply={(min, max) => update((p) => { if (min) p.set("min", min); else p.delete("min"); if (max) p.set("max", max); else p.delete("max"); })} /></fieldset>
      {activeCount > 0 && <button className="link-underline text-xs uppercase tracking-[0.2em]" onClick={() => update((p) => { ["size", "color", "inStock", "min", "max"].forEach((k) => p.delete(k)); })}>Clear all filters</button>}
    </div>
  );

  return (
    <div className="grid gap-x-12 lg:grid-cols-[14rem_1fr]">
      <div className="flex items-center justify-between gap-4 border-y border-line py-3 lg:col-span-2">
        <button className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] lg:hidden" onClick={() => setOpen(true)} aria-haspopup="dialog">
          <SlidersHorizontal size={16} /> Filters{activeCount > 0 && ` (${activeCount})`}
        </button>
        <p className="hidden text-sm text-taupe-deep lg:block" aria-live="polite">{pending ? "Updating…" : `${total} ${total === 1 ? "piece" : "pieces"}`}</p>
        <div className="flex items-center gap-3">
          <label htmlFor="sort" className="sr-only">Sort by</label>
          <select id="sort" className="field !min-h-10 !w-auto !py-1 pr-8 text-sm" value={sp.get("sort") ?? "newest"} onChange={(e) => update((p) => e.target.value === "newest" ? p.delete("sort") : p.set("sort", e.target.value))}>
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <aside className="hidden pt-8 lg:block" aria-label="Filters">{body}</aside>
      <div className="min-w-0 pt-8">{children}</div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-[70] bg-espresso/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.div role="dialog" aria-modal="true" aria-label="Filters" className="fixed inset-x-0 bottom-0 z-[71] max-h-[88vh] overflow-y-auto bg-ivory p-6 pb-28"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "tween", duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
              <div className="mb-6 flex items-center justify-between"><h2 className="font-serif text-3xl">Filters</h2><button onClick={() => setOpen(false)} aria-label="Close filters" className="grid h-11 w-11 place-items-center"><X size={22} /></button></div>
              {body}
              <div className="fixed inset-x-0 bottom-0 border-t border-line bg-ivory p-4"><button className="btn btn-solid w-full" onClick={() => setOpen(false)}>Show {total} {total === 1 ? "piece" : "pieces"}</button></div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function PriceForm({ initialMin, initialMax, facets, onApply }: { initialMin: string; initialMax: string; facets: Facets; onApply(min: string, max: string): void }) {
  const [min, setMin] = useState(initialMin);
  const [max, setMax] = useState(initialMax);
  return (
    <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); onApply(min, max); }}>
      <input className="field" inputMode="numeric" aria-label="Minimum price" placeholder={String(Math.floor(facets.minPrice / 100))} value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} />
      <span>–</span>
      <input className="field" inputMode="numeric" aria-label="Maximum price" placeholder={String(Math.ceil(facets.maxPrice / 100))} value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} />
      <button className="btn btn-ghost px-4" type="submit">Go</button>
    </form>
  );
}
