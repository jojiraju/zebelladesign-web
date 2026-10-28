import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Listing, ListingHeader } from "@/components/shop/Listing";
import { getCollections } from "@/lib/server/catalog";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = (await getCollections()).find((x) => x.slug === slug);
  if (!c) return { title: "Collection not found" };
  return {
    title: c.seo?.title || c.name,
    description: c.seo?.description || c.description || `Explore the ${c.name} collection by Zebella Designs.`,
    alternates: { canonical: `/collections/${slug}` },
    openGraph: c.imageUrl ? { images: [c.imageUrl] } : undefined,
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const collection = (await getCollections()).find((x) => x.slug === slug);
  if (!collection) notFound();
  return (
    <Listing sp={await searchParams} base={{ collection: slug }} basePath={`/collections/${slug}`}
      header={<ListingHeader eyebrow="Collection" title={collection.name} description={collection.description} crumbs={[{ label: "Home", href: "/" }, { label: "Collections", href: "/collections" }, { label: collection.name }]} />} />
  );
}
