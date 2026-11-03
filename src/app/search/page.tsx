import type { Metadata } from "next";
import Link from "next/link";
import { Search, TrendingUp, X } from "lucide-react";
import { Listing } from "@/components/shop/Listing";

// Search result pages are not worth indexing.
export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

const POPULAR = ["Anarkali", "Frock", "Salwar set", "Cord set", "Gown", "Christmas"];

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? "";
  return (
    <Listing sp={sp} base={{}} basePath="/search"
      header={
        <header>
          <p className="eyebrow mb-3">Search</p>
          <h1 className="font-serif text-4xl leading-tight sm:text-6xl">{q ? <>Results for <span className="text-gradient">“{q}”</span></> : "What are you looking for?"}</h1>
          {/* Plain GET form: works without JavaScript */}
          <form action="/search" role="search" className="relative mt-7 max-w-2xl">
            <Search size={20} strokeWidth={1.5} aria-hidden className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-gold-deep" />
            <label htmlFor="search-q" className="sr-only">Search products</label>
            <input id="search-q" name="q" defaultValue={q} placeholder="Search anarkali, frock, gown…" autoComplete="off"
              className="h-14 w-full rounded-full border border-line bg-white pl-13 pr-32 font-serif text-xl shadow-[0_18px_40px_-30px_rgba(143,74,91,.6)] outline-none transition placeholder:text-taupe focus:border-gold focus:ring-4 focus:ring-gold/15" style={{ paddingLeft: "3.25rem" }} />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {q && <Link href="/search" aria-label="Clear search" className="grid h-9 w-9 place-items-center rounded-full text-taupe-deep transition hover:bg-blush"><X size={16} /></Link>}
              <button type="submit" className="h-10 rounded-full px-5 text-xs font-semibold uppercase tracking-[0.16em] text-white" style={{ backgroundImage: "linear-gradient(90deg, #231a1d 0%, #5a2e3a 100%)" }}>Search</button>
            </div>
          </form>
          <p className="mt-5 flex flex-wrap items-center gap-2 text-sm text-taupe-deep">
            <span className="inline-flex items-center gap-1.5"><TrendingUp size={14} className="text-gold-deep" aria-hidden />Popular:</span>
            {POPULAR.map((t) => <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="rounded-full border border-line bg-white px-3.5 py-1.5 text-xs transition hover:border-gold hover:bg-blush/60">{t}</Link>)}
          </p>
        </header>
      } />
  );
}
