"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Clock, Flame, Search, TrendingUp, X } from "lucide-react";
import { ART } from "@/lib/art";
import { apiJson } from "@/lib/api/client";
import { formatINR } from "@/lib/commerce/money";
import { effectivePrice } from "@/lib/commerce/catalog-rules";
import type { Category, Product } from "@/lib/types";

const TRENDING = ["Anarkali", "Frock", "Salwar set", "Cord set", "Gown", "Christmas", "Embroidered"];
const RECENT_KEY = "zebella.recent-search.v1";

const readRecent = (): string[] => { try { const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); return Array.isArray(v) ? v.slice(0, 5) : []; } catch { return []; } };
const writeRecent = (list: string[]) => { try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch { /* private mode */ } };

function Chip({ onClick, icon: Icon, children }: { onClick(): void; icon?: typeof Clock; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm transition hover:border-gold hover:bg-blush/60">
      {Icon && <Icon size={14} className="text-gold-deep" aria-hidden />}{children}
    </button>
  );
}

/** Full-width search sheet: live product results as you type, recent + trending searches, categories and popular pieces. */
export function SearchOverlay({ open, onClose, categories }: { open: boolean; onClose(): void; categories: Category[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [products, setProducts] = useState<Product[] | null>(null);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => input.current?.focus(), 80);
    /* eslint-disable react-hooks/set-state-in-effect -- reset the box and read localStorage whenever the sheet opens (client-only) */
    setQ(""); setActive(-1); setRecent(readRecent());
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => clearTimeout(t);
  }, [open]);

  // Load the catalogue once, the first time the sheet opens.
  useEffect(() => {
    if (!open || products) return;
    let live = true;
    apiJson<Product[]>("/catalog/products", { method: "GET" }).then((p) => live && setProducts(p)).catch(() => live && setProducts([]));
    return () => { live = false; };
  }, [open, products]);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);

  const catName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? "";
  const term = q.trim();
  const { results, total } = useMemo(() => {
    if (term.length < 2 || !products) return { results: [] as Product[], total: 0 };
    const words = term.toLowerCase().split(/\s+/);
    const hit = products.filter((p) => {
      const hay = `${p.name} ${p.sku} ${p.categorySlug} ${p.description} ${p.fabric ?? ""} ${p.variants.map((v) => v.color ?? "").join(" ")}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    }).sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller) || (b.soldCount ?? 0) - (a.soldCount ?? 0));
    return { results: hit.slice(0, 6), total: hit.length };
  }, [term, products]);
  const popular = useMemo(() => (products ?? []).filter((p) => p.bestSeller).slice(0, 4), [products]);

  function search(value: string) {
    const v = value.trim();
    if (!v) return;
    const next = [v, ...readRecent().filter((r) => r.toLowerCase() !== v.toLowerCase())].slice(0, 5);
    writeRecent(next);
    onClose();
    router.push(`/search?q=${encodeURIComponent(v)}`);
  }
  function go(href: string) { onClose(); router.push(href); }
  function clearRecent() { writeRecent([]); setRecent([]); }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" && results.length) { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp" && results.length) { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-0 z-[72]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <div className="absolute inset-0 bg-espresso/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.div className="relative max-h-[94svh] overflow-y-auto rounded-b-[2rem] pt-9 bg-ivory text-espresso shadow-[0_40px_90px_-30px_rgba(35,26,29,.6)]"
            initial={{ y: -48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -48, opacity: 0 }} transition={{ type: "tween", duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <div className="container-x flex h-20 items-center justify-between">
              <p className="eyebrow">Search Zebella</p>
              <button onClick={onClose} aria-label="Close search" className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white transition hover:bg-blush"><X size={20} strokeWidth={1.5} /></button>
            </div>

            <div className="container-x mx-auto max-w-4xl pb-10 sm:pb-14">
              <form role="search" onSubmit={(e) => { e.preventDefault(); if (active >= 0 && results[active]) go(`/products/${results[active].slug}`); else search(q); }}>
                <div className="relative">
                  <Search size={22} strokeWidth={1.5} aria-hidden className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-gold-deep sm:left-7" />
                  <label htmlFor="site-search" className="sr-only">Search products</label>
                  <input id="site-search" ref={input} value={q} onChange={(e) => { setQ(e.target.value); setActive(-1); }} onKeyDown={onKey}
                    placeholder="Search anarkali, frock, gown…" autoComplete="off" role="combobox" aria-expanded={results.length > 0} aria-controls="search-results" aria-activedescendant={active >= 0 ? `sr-${active}` : undefined}
                    className="h-16 w-full rounded-full border border-line bg-white pl-14 pr-28 font-serif text-xl shadow-[0_18px_40px_-30px_rgba(143,74,91,.6)] outline-none transition placeholder:text-taupe focus:border-gold focus:ring-4 focus:ring-gold/15 sm:h-[4.5rem] sm:pl-[4.5rem] sm:pr-44 sm:text-3xl" />
                  <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
                    {q && <button type="button" onClick={() => { setQ(""); input.current?.focus(); }} aria-label="Clear search" className="grid h-9 w-9 place-items-center rounded-full text-taupe-deep transition hover:bg-blush"><X size={16} /></button>}
                    <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-xs font-semibold uppercase tracking-[0.16em] text-white sm:h-12 sm:px-7" style={{ backgroundImage: "linear-gradient(90deg, #231a1d 0%, #5a2e3a 100%)" }}>
                      <span className="hidden sm:inline">Search</span><ArrowRight size={16} aria-hidden />
                    </button>
                  </div>
                </div>
                <p className="mt-3 hidden text-xs text-taupe-deep sm:block">Press <kbd className="rounded border border-line bg-white px-1.5 py-0.5 font-sans">Enter</kbd> to search · <kbd className="rounded border border-line bg-white px-1.5 py-0.5 font-sans">Esc</kbd> to close</p>
              </form>

              {term.length >= 2 ? (
                results.length > 0 ? (
                  <section className="mt-8" aria-label="Search results">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-taupe-deep">{total} {total === 1 ? "match" : "matches"}</p>
                    <ul id="search-results" role="listbox" className="space-y-2">
                      {results.map((p, i) => (
                        <li key={p.id} id={`sr-${i}`} role="option" aria-selected={i === active}>
                          <Link href={`/products/${p.slug}`} onClick={onClose} onMouseEnter={() => setActive(i)}
                            className={`flex items-center gap-4 rounded-2xl border p-3 transition ${i === active ? "border-gold bg-blush/50" : "border-line bg-white hover:border-gold"}`}>
                            <span className="relative block aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-lg bg-cream"><Image src={p.images[0]?.url || ART.productPlaceholder} alt="" fill sizes="56px" className="object-cover object-top" /></span>
                            <span className="min-w-0 flex-1"><span className="block truncate font-serif text-xl leading-tight">{p.name}</span><span className="block text-xs uppercase tracking-[0.14em] text-taupe-deep">{catName(p.categorySlug) || p.categorySlug}</span></span>
                            <span className="text-right tabular-nums"><span className="block">{formatINR(effectivePrice(p))}</span>{p.salePrice != null && p.salePrice < p.price && <s className="block text-xs text-taupe-deep">{formatINR(p.price)}</s>}</span>
                            <ArrowRight size={16} className="hidden shrink-0 text-taupe sm:block" aria-hidden />
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <button type="button" onClick={() => search(q)} className="btn btn-solid mt-5 w-full sm:w-auto">See all {total} results for “{term}” <ArrowRight size={15} className="arrow" aria-hidden /></button>
                  </section>
                ) : (
                  <section className="mt-10 text-center" aria-live="polite">
                    {products ? (
                      <>
                        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blush text-gold-deep"><Search size={26} strokeWidth={1.4} aria-hidden /></span>
                        <p className="mt-5 font-serif text-3xl">No matches for “{term}”</p>
                        <p className="mt-2 text-taupe-deep">Check the spelling or try one of these popular searches.</p>
                        <div className="mt-6 flex flex-wrap justify-center gap-2">{TRENDING.slice(0, 5).map((t) => <Chip key={t} icon={TrendingUp} onClick={() => search(t)}>{t}</Chip>)}</div>
                      </>
                    ) : <p className="text-taupe-deep">Searching…</p>}
                  </section>
                )
              ) : (
                <div className="mt-8 space-y-9">
                  {recent.length > 0 && (
                    <section aria-label="Recent searches">
                      <div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-taupe-deep">Recent searches</h2><button type="button" onClick={clearRecent} className="text-xs text-taupe-deep underline underline-offset-4 hover:text-espresso">Clear</button></div>
                      <div className="flex flex-wrap gap-2">{recent.map((r) => <Chip key={r} icon={Clock} onClick={() => search(r)}>{r}</Chip>)}</div>
                    </section>
                  )}
                  <section aria-label="Trending searches">
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-taupe-deep">Trending now</h2>
                    <div className="flex flex-wrap gap-2">{TRENDING.map((t) => <Chip key={t} icon={TrendingUp} onClick={() => search(t)}>{t}</Chip>)}</div>
                  </section>
                  {categories.length > 0 && (
                    <section aria-label="Shop by category">
                      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-taupe-deep">Shop by category</h2>
                      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        {categories.slice(0, 5).map((c) => (
                          <li key={c.id}>
                            <Link href={`/categories/${c.slug}`} onClick={onClose} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-cream">
                              <Image src={c.imageUrl || ART.productPlaceholder} alt="" fill sizes="(min-width:1024px) 15vw, 33vw" className="object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                              <span className="absolute inset-0 bg-gradient-to-t from-espresso/75 via-transparent to-transparent" aria-hidden />
                              <span className="absolute inset-x-0 bottom-0 p-3.5 font-serif text-xl leading-tight text-ivory">{c.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {popular.length > 0 && (
                    <section aria-label="Popular right now">
                      <h2 className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-taupe-deep"><Flame size={14} className="text-gold-deep" aria-hidden />Popular right now</h2>
                      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {popular.map((p) => (
                          <li key={p.id}>
                            <Link href={`/products/${p.slug}`} onClick={onClose} className="group block">
                              <span className="relative block aspect-[3/4] overflow-hidden rounded-xl bg-cream"><Image src={p.images[0]?.url || ART.productPlaceholder} alt="" fill sizes="(min-width:640px) 20vw, 45vw" className="object-cover object-top transition-transform duration-700 group-hover:scale-105" /></span>
                              <span className="mt-2 block truncate font-serif text-lg leading-tight">{p.name}</span>
                              <span className="block text-sm tabular-nums text-taupe-deep">{formatINR(effectivePrice(p))}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
