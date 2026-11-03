import type { Metadata } from "next";
import { Listing, ListingHeader } from "@/components/shop/Listing";

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop the full Zebella Designs collection of premium women's ethnic and contemporary wear.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return <Listing sp={sp} base={{}} basePath="/shop" header={<ListingHeader eyebrow="The Edit" title="Shop all" crumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]} />} />;
}
