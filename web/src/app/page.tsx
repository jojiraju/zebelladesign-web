import { Hero } from "@/components/home/Hero";
import { Emblem } from "@/components/home/Emblem";
import { BrandStory, CollectionsMosaic, FeaturedProducts, NewsletterSection, PromoBanners, SocialGallery, Testimonials } from "@/components/home/Sections";
import { getBanners, getCollections, getHomepage, getPublishedProducts, getSettings, getTestimonials, toPublicProduct } from "@/lib/server/catalog";
import { isAdminConfigured } from "@/lib/server/admin";
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

  // Collection tiles: CMS-curated -> visible collections -> built-in editorial defaults.
  let tiles: FeaturedTile[] = home.featuredCollections;
  if (!tiles.length && collections.length)
    tiles = collections.slice(0, 5).map((c, i) => ({ title: c.name, imageUrl: c.imageUrl || ["/art/tile-new.svg", "/art/tile-festive.svg", "/art/tile-ethnic.svg", "/art/tile-signature.svg", "/art/tile-best.svg"][i], href: `/collections/${c.slug}` }));

  return (
    <>
      <Hero hero={home.hero} />
      <CollectionsMosaic tiles={tiles} />
      <FeaturedProducts products={featured.map(toPublicProduct)} backendReady={isAdminConfigured()} />
      <PromoBanners banners={banners} />
      <BrandStory story={home.brandStory} />
      <Emblem message={home.editorialMessage || "Designed to be remembered."} />
      <Testimonials items={testimonials} />
      <SocialGallery items={home.social} instagram={settings.social.instagram} />
      <NewsletterSection settings={settings} />
    </>
  );
}
