import { Hero } from "@/components/home/Hero";
import { DressStudio } from "@/components/home/DressStudio";
import { Emblem } from "@/components/home/Emblem";
import { ProductRing } from "@/components/home/ProductRing";
import { ScrollMarquee } from "@/components/home/ScrollMarquee";
import { ScrollStatement } from "@/components/ui/fx";
import { HorizontalShowcase, type ShowcaseItem } from "@/components/ui/HorizontalShowcase";
import { ART } from "@/lib/art";
import { formatINR } from "@/lib/commerce/money";
import { effectivePrice } from "@/lib/commerce/catalog-rules";
import { FOUNDER, STORY_QUOTE } from "@/lib/story";
import { BrandStory, CollectionsMosaic, FeaturedProducts, PromoBanners, SocialGallery, Testimonials } from "@/components/home/Sections";
import { getBanners, getCollections, getHomepage, getPublishedProducts, getSettings, getTestimonials, toPublicProduct } from "@/lib/server/catalog";
import { isApiConfigured } from "@/lib/api/client";
import type { FeaturedTile } from "@/lib/content";

export const revalidate = 60;

export default async function HomePage() {
  const [home, settings, products, collections, banners, testimonials] = await Promise.all([
    getHomepage(), getSettings(), getPublishedProducts(), getCollections(), getBanners(), getTestimonials(),
  ]);

  // Featured products: explicit CMS picks -> products flagged featured -> newest.
  const byId = new Map(products.map((p) => [p.id, p]));
  let featured = home.featuredProductIds.map((id) => byId.get(id)).filter(Boolean) as typeof products;
  if (!featured.length) featured = products.filter((p) => p.featured);
  if (!featured.length) featured = products;
  featured = featured.slice(0, 8);
  const featuredPublic = featured.map(toPublicProduct);

  // "Just landed" showcase: new arrivals that are not already in the featured ring (falls back to anything not featured).
  const featuredIds = new Set(featured.map((p) => p.id));
  const fresh = products.filter((p) => p.newArrival && !featuredIds.has(p.id));
  const showFresh = fresh.length >= 4;
  const lookbook = (showFresh ? fresh : products.filter((p) => !featuredIds.has(p.id))).slice(0, 10).map(toPublicProduct);
  const showcaseItems: ShowcaseItem[] = lookbook.map((p) => ({ title: p.name, subtitle: formatINR(effectivePrice(p)), imageUrl: p.images[0]?.url || ART.productPlaceholder, href: `/products/${p.slug}` }));

  // Collection tiles: CMS-curated -> visible collections -> built-in editorial defaults.
  let tiles: FeaturedTile[] = home.featuredCollections;
  if (!tiles.length && collections.length)
    tiles = collections.slice(0, 5).map((c, i) => ({ title: c.name, imageUrl: c.imageUrl || ["/art/tile-new.svg", "/art/tile-festive.svg", "/art/tile-ethnic.svg", "/art/tile-signature.svg", "/art/tile-best.svg"][i], href: `/collections/${c.slug}` }));

  return (
    <>
      <Hero hero={home.hero} slides={home.heroSlides} />
      <ProductRing products={featuredPublic} />
      <CollectionsMosaic tiles={tiles} />
      <DressStudio />
      <FeaturedProducts products={featuredPublic} backendReady={isApiConfigured()} />
      <ScrollMarquee words={collections.map((c) => c.name)} />
      <ScrollStatement panel text={STORY_QUOTE} eyebrow="Our story" byline={{ name: FOUNDER.name, role: FOUNDER.role, image: FOUNDER.image }} cta={{ href: "/about", label: "Read our story" }} />
      <HorizontalShowcase eyebrow={showFresh ? "New arrivals" : "Keep exploring"} title={showFresh ? "Just landed" : "More to explore"} items={showcaseItems} href="/shop?sort=newest" linkLabel="Shop all" />
      <PromoBanners banners={banners} />
      <BrandStory story={home.brandStory} />
      <Emblem message={home.editorialMessage || "Designed to be remembered."} />
      <Testimonials items={testimonials} />
      <SocialGallery items={home.social} instagram={settings.social.instagram} />
    </>
  );
}
