import type { Metadata } from "next";
import { Listing, ListingHeader } from "@/components/shop/Listing";

// Search result pages are not worth indexing.
export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? "";
  return (
    <Listing sp={sp} base={{}} basePath="/search"
      header={<ListingHeader eyebrow="Search" title={q ? `Results for “${q}”` : "Search"} description={q ? undefined : "Use the search icon in the header to find a piece."} />} />
  );
}
