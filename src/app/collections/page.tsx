import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getCollections } from "@/lib/server/catalog";
import { ListingHeader } from "@/components/shop/Listing";
import { EmptyState } from "@/components/ui/Skeletons";
import { Reveal } from "@/components/ui/motion";

export const revalidate = 60;
export const metadata: Metadata = { title: "Collections", description: "Explore Zebella Designs collections.", alternates: { canonical: "/collections" } };

export default async function CollectionsPage() {
  const collections = await getCollections();
  return (
    <div className="container-x pt-10 sm:pt-16">
      <ListingHeader eyebrow="Explore" title="Collections" crumbs={[{ label: "Home", href: "/" }, { label: "Collections" }]} />
      {collections.length ? (
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c, i) => (
            <Reveal as="li" key={c.id} delay={(i % 3) * 0.08}>
              <Link href={`/collections/${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden bg-cream">
                {c.imageUrl && <Image src={c.imageUrl} alt="" fill sizes="(min-width:1024px) 33vw, 50vw" className="object-cover transition-transform duration-[1500ms] ease-[var(--ease-lux)] group-hover:scale-105" />}
                <div className="absolute inset-0 bg-gradient-to-t from-espresso/65 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7 text-ivory"><h2 className="font-serif text-4xl">{c.name}</h2>{c.description && <p className="mt-2 line-clamp-2 text-sm text-ivory/80">{c.description}</p>}</div>
              </Link>
            </Reveal>
          ))}
        </ul>
      ) : <EmptyState title="Collections coming soon" text="Create collections in the CMS and they will appear here."><Link href="/shop" className="btn btn-ghost">Shop all</Link></EmptyState>}
    </div>
  );
}
