import Link from "next/link";
import { Suspense } from "react";
import { FilterPanel } from "./FilterPanel";
import { ProductGrid } from "@/components/product/ProductGrid";
import { EmptyState } from "@/components/ui/Skeletons";
import { queryProducts, toPublicProduct, type ProductFilters } from "@/lib/server/catalog";
import { isAdminConfigured } from "@/lib/server/admin";

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
      <div className="mt-10">
        <Suspense>
          <FilterPanel facets={result.facets} total={result.total}>
            {result.items.length ? <ProductGrid products={result.items.map(toPublicProduct)} cols={3} priorityFirst={4} /> : (
              <EmptyState title={isAdminConfigured() ? "No pieces match your selection" : "The catalogue is empty"}
                text={isAdminConfigured() ? "Try removing a filter or exploring another collection." : "Connect Firebase and add products in the CMS to see them here."}>
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

export function ListingHeader({ eyebrow, title, description, crumbs }: { eyebrow?: string; title: string; description?: string; crumbs?: { label: string; href?: string }[] }) {
  return (
    <header>
      {crumbs && (
        <nav aria-label="Breadcrumb" className="mb-6 text-xs uppercase tracking-[0.18em] text-taupe-deep">
          <ol className="flex flex-wrap gap-2">
            {crumbs.map((c, i) => <li key={i} className="flex gap-2">{c.href ? <Link className="link-underline" href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}{i < crumbs.length - 1 && <span aria-hidden>/</span>}</li>)}
          </ol>
        </nav>
      )}
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h1 className="font-serif text-5xl leading-none sm:text-7xl">{title}</h1>
      {description && <p className="mt-5 max-w-xl text-taupe-deep">{description}</p>}
    </header>
  );
}
