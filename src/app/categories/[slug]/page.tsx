import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Listing, ListingHeader } from "@/components/shop/Listing";
import { getCategories } from "@/lib/server/catalog";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = (await getCategories()).find((x) => x.slug === slug);
  if (!c) return { title: "Category not found" };
  return {
    title: c.seo?.title || c.name,
    description: c.seo?.description || c.description || `Shop ${c.name} from Zebella Designs.`,
    alternates: { canonical: `/categories/${slug}` },
    openGraph: c.imageUrl ? { images: [c.imageUrl] } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = (await getCategories()).find((x) => x.slug === slug);
  if (!category) notFound();
  return (
    <Listing sp={await searchParams} base={{ category: slug }} basePath={`/categories/${slug}`}
      header={<ListingHeader eyebrow="Category" title={category.name} description={category.description} crumbs={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: category.name }]} />} />
  );
}
