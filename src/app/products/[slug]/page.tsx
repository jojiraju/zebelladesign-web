import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { RichText, toPlainText } from "@/components/ui/RichText";
import { SizeGuide } from "@/components/product/SizeGuide";
import { RecentlyViewed, RecordView } from "@/components/product/ClientProductList";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductActions } from "@/components/product/ProductActions";
import { Price } from "@/components/ui/Price";
import { getProductBySlug, getPublishedProducts, getSettings, toPublicProduct } from "@/lib/server/catalog";
import { effectivePrice, totalAvailable } from "@/lib/commerce/catalog-rules";
import { abs } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product not found" };
  const desc = p.seo?.description || toPlainText(p.description).slice(0, 160);
  return {
    title: p.seo?.title || p.name,
    description: desc,
    alternates: { canonical: `/products/${slug}` },
    openGraph: { type: "website", title: p.name, description: desc, images: p.images[0] ? [{ url: p.images[0].url }] : undefined },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, all, settings] = await Promise.all([getProductBySlug(slug), getPublishedProducts(), getSettings()]);
  if (!product) notFound();
  const p = toPublicProduct(product);

  const related = all
    .filter((x) => x.id !== p.id && (x.categoryId === p.categoryId || x.collectionIds.some((c) => p.collectionIds.includes(c))))
    .slice(0, 4).map(toPublicProduct);

  const inStock = totalAvailable(p) > 0;
  const jsonLd = [
    {
      "@context": "https://schema.org", "@type": "Product", name: p.name, sku: p.sku, description: toPlainText(p.description),
      image: p.images.map((i) => (i.url.startsWith("http") ? i.url : abs(i.url))),
      brand: { "@type": "Brand", name: "Zebella Designs" },
      offers: {
        "@type": "Offer", url: abs(`/products/${p.slug}`), priceCurrency: "INR", price: (effectivePrice(p) / 100).toFixed(2),
        availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", itemCondition: "https://schema.org/NewCondition",
      },
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: abs("/") },
        { "@type": "ListItem", position: 2, name: "Shop", item: abs("/shop") },
        { "@type": "ListItem", position: 3, name: p.name, item: abs(`/products/${p.slug}`) },
      ],
    },
  ];

  const detail = (title: string, body?: string, open = false) => body ? (
    <details open={open} className="group border-t border-line first:border-t-0">
      <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-sm font-medium uppercase tracking-[0.2em] transition-colors hover:text-gold-deep">{title}<ChevronDown size={18} className="transition-transform duration-300 group-open:rotate-180" aria-hidden /></summary>
      <RichText className="mb-6 rounded-2xl bg-white p-5 text-[0.95rem] leading-7 text-espresso/85 shadow-[0_8px_30px_-18px_rgba(41,26,30,.4)] ring-1 ring-line" html={body} />
    </details>
  ) : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <RecordView id={p.id} />
      <div className="container-x pt-6 sm:pt-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-xs uppercase tracking-[0.18em] text-taupe-deep">
          <ol className="flex flex-wrap gap-2">
            <li><Link className="link-underline" href="/">Home</Link> /</li>
            <li><Link className="link-underline" href="/shop">Shop</Link> /</li>
            {p.categorySlug && <li><Link className="link-underline" href={`/categories/${p.categorySlug}`}>{p.categorySlug.replace(/-/g, " ")}</Link> /</li>}
            <li aria-current="page" className="text-espresso">{p.name}</li>
          </ol>
        </nav>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
          <ProductGallery images={p.images} name={p.name} videoUrl={p.videoUrl} />
          <div>
            {p.isDemo && <p className="mb-4 inline-block border border-gold px-3 py-1 text-[0.65rem] uppercase tracking-[0.22em] text-gold-deep">Demo product — development data</p>}
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-taupe-deep">{p.categorySlug.replace(/-/g, " ")}</p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <h1 className="font-serif text-3xl leading-[1.1] sm:text-[2.6rem]">{p.name}</h1>
              <ProductActions productId={p.id} name={p.name} />
            </div>
            <Price product={p} size="lg" className="mt-4" />
            <p className="mt-5 text-xs leading-6 text-taupe-deep">SKU {p.sku} · Inclusive of all taxes. <Link href="/shipping-policy" className="underline underline-offset-4 hover:text-gold-deep">Shipping policy</Link></p>
            {p.isDemo && process.env.ALLOW_DEMO_PURCHASES !== "true" ? <p className="mt-8 text-sm text-taupe-deep">Demo products cannot be purchased.</p> : (
              <ProductPurchase hideWishlist product={p} sizeGuide={p.sizeGuide ? <SizeGuide><RichText html={p.sizeGuide} /></SizeGuide> : undefined} deliveryNote={settings.pincodeCheck?.enabled ? settings.pincodeCheck.note ?? "" : undefined} />
            )}
            <div className="mt-10 border-y border-line">
              {detail("Details", p.description, true)}
              {detail("Fabric", p.fabric)}
              {detail("Care instructions", p.care)}
              {detail("Shipping", settings.policies.shipping?.slice(0, 600))}
              {detail("Returns & refunds", settings.policies.returns?.slice(0, 600))}
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-x mt-28" aria-labelledby="rel">
          <h2 id="rel" className="h-section mb-10 font-serif">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
      <RecentlyViewed excludeId={p.id} />
    </>
  );
}
