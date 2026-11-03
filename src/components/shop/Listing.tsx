import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { ArrowDown } from "lucide-react";
import { FilterPanel } from "./FilterPanel";
import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState } from "@/components/ui/Skeletons";
import { queryProducts, toPublicProduct, type ProductFilters } from "@/lib/server/catalog";
import { isApiConfigured } from "@/lib/api/client";

type SP = Record<string, string | string[] | undefined>;
const arr = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | undefined) => (v && /^\d+$/.test(v) ? Number(v) : undefined);

export function filtersFromSearchParams(sp: SP): ProductFilters {
  const sort = one(sp.sort);
  const min = num(one(sp.min)), max = num(one(sp.max));
  return {
    q: one(sp.q)?.slice(0, 80),
    sizes: arr(sp.size), colors: arr(sp.color),
    inStock: one(sp.inStock) === "1",
    minPrice: min != null ? min * 100 : undefined, maxPrice: max != null ? max * 100 : undefined,
    sort: sort === "price-asc" || sort === "price-desc" || sort === "popular" ? sort : "newest",
    page: num(one(sp.page)) ?? 1,
  };
}

export async function Listing({ base, sp, basePath, header }: { base: ProductFilters; sp: SP; basePath: string; header: React.ReactNode }) {
  const result = await queryProducts({ ...filtersFromSearchParams(sp), ...base });
  const link = (page: number) => {
    const p = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => k !== "page" && arr(v).forEach((x) => p.append(k, x)));
    if (page > 1) p.set("page", String(page));
    return `${basePath}${p.toString() ? `?${p}` : ""}`;
  };
  return (
    <div className="container-x pb-8 pt-10 sm:pt-16">
      {header}
      <div id="products" className="mt-10 scroll-mt-28">
        <Suspense>
          <FilterPanel facets={result.facets} total={result.total}>
            {result.items.length ? <ProductGrid products={result.items.map(toPublicProduct)} cols={3} priorityFirst={4} /> : (
              <EmptyState title={isApiConfigured() ? "No pieces match your selection" : "The catalogue is empty"}
                text={isApiConfigured() ? "Try removing a filter or exploring another collection." : "Connect the store API and add products to see them here."}>
                <Link href={basePath} className="btn btn-ghost">Clear filters</Link>
              </EmptyState>
            )}
            {result.pageCount > 1 && (
              <nav className="mt-16 flex items-center justify-center gap-8 text-xs uppercase tracking-[0.22em]" aria-label="Pagination">
                {result.page > 1 ? <Link className="link-underline" href={link(result.page - 1)} rel="prev">← Previous</Link> : <span className="opacity-30">← Previous</span>}
                <span aria-current="page">{result.page} / {result.pageCount}</span>
                {result.page < result.pageCount ? <Link className="link-underline" href={link(result.page + 1)} rel="next">Next →</Link> : <span className="opacity-30">Next →</span>}
              </nav>
            )}
          </FilterPanel>
        </Suspense>
      </div>
    </div>
  );
}

export function ListingHeader({ eyebrow, title, description, crumbs, image }: { eyebrow?: string; title: string; description?: string; image?: string; crumbs?: { label: string; href?: string }[] }) {
  const trail = crumbs && (
    <nav aria-label="Breadcrumb" className="mb-6 text-xs uppercase tracking-[0.18em] text-taupe-deep">
      <ol className="flex flex-wrap gap-2">
        {crumbs.map((c, i) => <li key={i} className="flex gap-2">{c.href ? <Link className="link-underline" href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}{i < crumbs.length - 1 && <span aria-hidden>/</span>}</li>)}
      </ol>
    </nav>
  );

  if (!image) {
    return (
      <header>
        {trail}
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="font-serif text-5xl leading-none sm:text-7xl">{title}</h1>
        {description && <p className="mt-5 max-w-xl text-taupe-deep">{description}</p>}
      </header>
    );
  }

  // Banner: copy on the left, photo on the right (anchored to the top so faces are never cropped out).
  return (
    <header>
      {trail}
      <div className="relative grid overflow-hidden rounded-[2rem] bg-gradient-to-br from-blush via-ivory to-cream shadow-[0_30px_70px_-45px_rgba(143,74,91,.6)] ring-1 ring-line md:min-h-[27rem] md:grid-cols-[0.85fr_1.15fr]">
        <div aria-hidden className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-rose-soft/30 blur-2xl" />
        <div className="relative flex flex-col justify-center px-6 py-9 sm:px-9 md:py-12 lg:px-12">
          {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
          <h1 className="font-serif text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">{title}</h1>
          {description && <p className="mt-5 max-w-md leading-7 text-taupe-deep">{description}</p>}
          <a href="#products" className="btn btn-solid mt-8 w-fit">Shop the edit <ArrowDown size={15} aria-hidden /></a>
        </div>
        <div className="relative aspect-[4/5] md:aspect-auto">
          <Image src={image} alt="" fill priority sizes="(min-width:768px) 48vw, 100vw" className="object-cover object-top" />
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-ivory/70 to-transparent md:block" />
        </div>
      </div>
    </header>
  );
}
