"use client";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";

export interface DropdownOption<T extends string> { value: T; label: string; hint?: string }

/**
 * Accessible custom select (listbox pattern): click or Enter/Space/ArrowDown to open, ArrowUp/Down/Home/End to move,
 * Enter to choose, Escape or outside click to close, type a letter to jump. Replaces the browser's native <select>.
 */
export function Dropdown<T extends string>({ value, options, onChange, label, prefix, align = "right", className = "" }: {
  value: T; options: DropdownOption<T>[]; onChange(v: T): void; label: string; prefix?: string; align?: "left" | "right"; className?: string;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const selected = Math.max(0, options.findIndex((o) => o.value === value));
  const [active, setActive] = useState(selected);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  function openMenu() { setActive(selected); setOpen(true); }
  function choose(i: number) { onChange(options[i].value); setOpen(false); button.current?.focus(); }

  function onKey(e: React.KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); openMenu(); }
      return;
    }
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); button.current?.focus(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % options.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + options.length) % options.length); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(options.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(active); }
    else if (e.key === "Tab") setOpen(false);
    else if (e.key.length === 1) {
      const i = options.findIndex((o, n) => n > active && o.label.toLowerCase().startsWith(e.key.toLowerCase()));
      const j = i >= 0 ? i : options.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
      if (j >= 0) setActive(j);
    }
  }

  return (
    <div ref={root} className={`relative ${className}`} onKeyDown={onKey}>
      <button ref={button} type="button" aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-list`} aria-label={`${label}: ${options[selected].label}`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full border bg-white px-5 text-sm transition hover:border-gold ${open ? "border-gold ring-4 ring-gold/15" : "border-line"}`}>
        {prefix && <span className="text-taupe-deep">{prefix}</span>}
        <span className="font-medium">{options[selected].label}</span>
        <ChevronDown size={16} aria-hidden className={`text-taupe-deep transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul id={`${id}-list`} role="listbox" aria-label={label} aria-activedescendant={`${id}-o${active}`} tabIndex={-1}
            initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute z-40 mt-2 w-64 origin-top rounded-2xl border border-line bg-white p-1.5 shadow-[0_24px_60px_-24px_rgba(35,26,29,.45)] ${align === "right" ? "right-0" : "left-0"}`}>
            {options.map((o, i) => (
              <li key={o.value} id={`${id}-o${i}`} role="option" aria-selected={o.value === value} onMouseEnter={() => setActive(i)} onClick={() => choose(i)}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${i === active ? "bg-blush/70" : ""} ${o.value === value ? "font-medium text-espresso" : "text-taupe-deep"}`}>
                <span className="min-w-0 flex-1">{o.label}{o.hint && <span className="block text-xs font-normal text-taupe-deep">{o.hint}</span>}</span>
                {o.value === value && <Check size={16} className="shrink-0 text-gold-deep" aria-hidden />}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
