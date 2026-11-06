"use client";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Dropdown } from "@/components/ui/Dropdown";

export interface Facets { sizes: string[]; colors: { name: string; hex?: string }[]; minPrice: number; maxPrice: number }

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most popular" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

const inr = (n: number | string) => `₹${Number(n).toLocaleString("en-IN")}`;
/** Perceived brightness, to pick a readable tick colour on a swatch. */
const isLight = (hex?: string) => { if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return true; const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); return r * 0.299 + g * 0.587 + b * 0.114 > 160; };

function Group({ title, hint, children, defaultOpen = true }: { title: string; hint?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group border-b border-line py-5 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-espresso">
        <span>{title}{hint && <span className="ml-2 font-normal normal-case tracking-normal text-taupe-deep">{hint}</span>}</span>
        <ChevronDown size={16} className="text-taupe-deep transition-transform duration-300 group-open:rotate-180" aria-hidden />
      </summary>
      <div className="pt-4">{children}</div>
    </details>
  );
}

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
  const clearAll = () => update((p) => { ["size", "color", "inStock", "min", "max"].forEach((k) => p.delete(k)); });

  const sizes = sp.getAll("size"), colors = sp.getAll("color");
  const min = sp.get("min"), max = sp.get("max");
  const inStock = sp.get("inStock") === "1";
  const activeCount = sizes.length + colors.length + (inStock ? 1 : 0) + (min || max ? 1 : 0);
  const sort = (sp.get("sort") ?? "newest") as (typeof SORTS)[number]["value"];

  // Active-filter chips (each removable on its own)
  const chips: { key: string; label: React.ReactNode; remove(): void }[] = [
    ...sizes.map((s) => ({ key: `s-${s}`, label: `Size ${s}`, remove: () => toggleMulti("size", s) })),
    ...colors.map((c) => ({ key: `c-${c}`, label: <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10" style={{ background: facets.colors.find((x) => x.name === c)?.hex || "#d8cbb8" }} />{c}</span>, remove: () => toggleMulti("color", c) })),
    ...(inStock ? [{ key: "stock", label: "In stock", remove: () => update((p) => p.delete("inStock")) }] : []),
    ...(min || max ? [{ key: "price", label: min && max ? `${inr(min)} – ${inr(max)}` : min ? `${inr(min)} and above` : `Up to ${inr(max!)}`, remove: () => update((p) => { p.delete("min"); p.delete("max"); }) }] : []),
  ];

  const body = (
    <div>
      <Group title="Availability">
        <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
          In stock only
          <button type="button" role="switch" aria-checked={inStock} onClick={() => update((p) => (inStock ? p.delete("inStock") : p.set("inStock", "1")))}
            className={`relative h-6 w-11 rounded-full transition-colors ${inStock ? "bg-gradient-to-r from-gold to-gold-deep" : "bg-line"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${inStock ? "left-[1.4rem]" : "left-0.5"}`} />
          </button>
        </label>
      </Group>

      {facets.sizes.length > 0 && (
        <Group title="Size" hint={sizes.length ? `${sizes.length} selected` : undefined}>
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((s) => { const on = sizes.includes(s); return (
              <button key={s} type="button" aria-pressed={on} onClick={() => toggleMulti("size", s)}
                className={`min-h-10 min-w-12 rounded-full border px-4 text-sm font-medium transition ${on ? "border-transparent bg-espresso text-ivory shadow-sm" : "border-line bg-white hover:border-gold"}`}>{s}</button>); })}
          </div>
        </Group>
      )}

      {facets.colors.length > 0 && (
        <Group title="Colour" hint={colors.length ? colors.join(", ") : undefined}>
          <div className="flex flex-wrap gap-3">
            {facets.colors.map((c) => { const on = colors.includes(c.name); return (
              <button key={c.name} type="button" aria-pressed={on} aria-label={c.name} title={c.name} onClick={() => toggleMulti("color", c.name)}
                className={`relative grid h-9 w-9 place-items-center rounded-full border transition hover:scale-110 ${on ? "border-espresso ring-2 ring-gold ring-offset-2 ring-offset-white" : "border-black/10"}`} style={{ background: c.hex || "#d8cbb8" }}>
                {on && <Check size={15} strokeWidth={3} className={isLight(c.hex) ? "text-espresso" : "text-white"} aria-hidden />}
              </button>); })}
          </div>
        </Group>
      )}

      <Group title="Price">
        <PriceForm key={`${min}-${max}`} initialMin={min ?? ""} initialMax={max ?? ""} facets={facets}
          onApply={(a, b) => update((p) => { if (a) p.set("min", a); else p.delete("min"); if (b) p.set("max", b); else p.delete("max"); })} />
      </Group>
    </div>
  );

  return (
    <div className="grid gap-x-10 lg:grid-cols-[16rem_1fr]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 lg:col-span-2">
        <div className="flex items-center gap-4">
          <button className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-5 text-sm font-medium transition hover:border-gold lg:hidden" onClick={() => setOpen(true)} aria-haspopup="dialog">
            <SlidersHorizontal size={16} aria-hidden /> Filters{activeCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-espresso px-1 text-[0.65rem] text-ivory">{activeCount}</span>}
          </button>
          <p className="text-sm text-taupe-deep" aria-live="polite">{pending ? "Updating…" : <><b className="font-medium text-espresso">{total}</b> {total === 1 ? "piece" : "pieces"}</>}</p>
        </div>
        <Dropdown label="Sort by" prefix="Sort by" value={sort} options={[...SORTS]} onChange={(v) => update((p) => (v === "newest" ? p.delete("sort") : p.set("sort", v)))} />
      </div>

      {/* Active filters */}
      {chips.length > 0 && (
        <ul className="mt-4 flex flex-wrap items-center gap-2 lg:col-span-2" aria-label="Active filters">
          {chips.map((c) => (
            <li key={c.key}><button type="button" onClick={c.remove} aria-label={`Remove filter`} className="group/chip inline-flex items-center gap-2 rounded-full border border-gold/40 bg-blush/60 py-1.5 pl-3.5 pr-2 text-xs transition hover:border-gold hover:bg-blush">{c.label}<span className="grid h-5 w-5 place-items-center rounded-full bg-white text-taupe-deep transition group-hover/chip:text-danger"><X size={12} aria-hidden /></span></button></li>
          ))}
          <li><button type="button" onClick={clearAll} className="px-2 text-xs font-medium uppercase tracking-[0.16em] text-taupe-deep underline underline-offset-4 hover:text-espresso">Clear all</button></li>
        </ul>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden pt-6 lg:block" aria-label="Filters">
        {/* Sticky card that never exceeds the window: header stays put, the filters scroll inside it */}
        <div className="sticky top-24 flex max-h-[calc(100svh-7rem)] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_18px_40px_-34px_rgba(143,74,91,.6)]">
          <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
            <h2 className="inline-flex items-center gap-2 font-serif text-xl"><SlidersHorizontal size={16} className="text-gold-deep" aria-hidden />Filters</h2>
            {activeCount > 0 && <button className="text-xs text-taupe-deep underline underline-offset-4 hover:text-espresso" onClick={clearAll}>Reset</button>}
          </div>
          <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 [scrollbar-color:var(--color-rose-soft)_transparent] [scrollbar-width:thin]">{body}</div>
        </div>
      </aside>
      <div className="min-w-0 pt-6">{children}</div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-[70] bg-espresso/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.div role="dialog" aria-modal="true" aria-label="Filters" className="fixed inset-x-0 bottom-0 z-[71] flex max-h-[90vh] flex-col overflow-hidden rounded-t-[1.75rem] bg-ivory"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "tween", duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
              <div className="flex items-center justify-between px-6 pb-3 pt-5"><h2 className="font-serif text-3xl">Filters</h2><button onClick={() => setOpen(false)} aria-label="Close filters" className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white"><X size={20} /></button></div>
              <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto px-6">{body}</div>
              <div className="flex gap-3 border-t border-line bg-white p-4">
                <button className="btn btn-ghost flex-1" onClick={clearAll} disabled={activeCount === 0}>Clear all</button>
                <button className="btn btn-solid flex-[2]" onClick={() => setOpen(false)}>Show {total} {total === 1 ? "piece" : "pieces"}</button>
              </div>
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
  const lo = Math.floor(facets.minPrice / 100), hi = Math.ceil(facets.maxPrice / 100);
  const round = (n: number) => Math.round(n / 500) * 500; // friendly price points
  const t1 = round(lo + (hi - lo) / 3), t2 = round(lo + ((hi - lo) * 2) / 3);
  const presets = hi - lo > 1000 && t1 > 0 && t2 > t1 ? [
    { label: `Under ${inr(t1)}`, min: "", max: String(t1) },
    { label: `${inr(t1)} – ${inr(t2)}`, min: String(t1), max: String(t2) },
    { label: `${inr(t2)} & above`, min: String(t2), max: "" },
  ] : [];
  const field = (label: string, value: string, set: (v: string) => void, placeholder: string) => (
    <label className="relative block flex-1">
      <span className="sr-only">{label}</span>
      <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-taupe-deep">₹</span>
      <input className="field !min-h-11 !pl-7 !pr-2 text-sm" inputMode="numeric" aria-label={label} placeholder={placeholder} value={value} onChange={(e) => set(e.target.value.replace(/\D/g, ""))} />
    </label>
  );
  return (
    <div className="space-y-4">
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => { const on = p.min === initialMin && p.max === initialMax; return (
            <button key={p.label} type="button" aria-pressed={on} onClick={() => onApply(p.min, p.max)}
              className={`rounded-full border px-3.5 py-2 text-xs font-medium transition ${on ? "border-transparent bg-espresso text-ivory" : "border-line bg-white hover:border-gold"}`}>{p.label}</button>); })}
        </div>
      )}
      <form className="space-y-2.5" onSubmit={(e) => { e.preventDefault(); onApply(min, max); }}>
        <div className="flex items-center gap-2">
          {field("Minimum price", min, setMin, String(lo))}
          <span className="text-taupe" aria-hidden>–</span>
          {field("Maximum price", max, setMax, String(hi))}
        </div>
        <button className="btn btn-ghost !min-h-11 w-full" type="submit">Apply price</button>
      </form>
    </div>
  );
}
