import { Hero } from "@/components/home/Hero";
import { ShopReels } from "@/components/home/ShopReels";
import { Emblem } from "@/components/home/Emblem";
import { ScrollMarquee } from "@/components/home/ScrollMarquee";
import { AdCarousel } from "@/components/home/AdCarousel";
import { buildAdSlides } from "@/lib/home-ads";
import { getAdBanners } from "@/lib/ad-banners";
import { getReelProducts } from "@/lib/reels";
import { CategoryRail, BestSellers, NewArrivals, TrustStrip } from "@/components/home/Shelves";
import { discountPercent } from "@/lib/commerce/money";
import { effectivePrice } from "@/lib/commerce/catalog-rules";
import { AllProducts } from "@/components/home/AllProducts";
import { ScrollStatement } from "@/components/ui/fx";
import { FOUNDER, STORY_QUOTE } from "@/lib/story";
import { BrandStory, Testimonials } from "@/components/home/Sections";
import { getCategories, getCollections, getHomepage, getPublishedProducts, getTestimonials, toPublicProduct } from "@/lib/server/catalog";

export const revalidate = 60;

/** Products shipped to the browser for the "All Products" list (boutique-scale catalog; the shop page has full filtering). */
const ALL_PRODUCTS_CAP = 200;

export default async function HomePage() {
  const [home, products, categories, collections, testimonials] = await Promise.all([
    getHomepage(), getPublishedProducts(), getCategories(), getCollections(), getTestimonials(),
  ]);

  // Best sellers: flagged first, then by units sold.
  const bestSorted = [...products].sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller) || (b.soldCount ?? 0) - (a.soldCount ?? 0));
  const best = bestSorted.slice(0, 8);
  const bestIds = new Set(best.map((p) => p.id));

  // New arrivals: flagged new (not already a best seller) -> newest not in best sellers -> newest overall.
  let fresh = products.filter((p) => p.newArrival && !bestIds.has(p.id));
  if (fresh.length < 4) fresh = products.filter((p) => !bestIds.has(p.id));
  if (fresh.length < 4) fresh = products;
  fresh = fresh.slice(0, 10);

  // Shop-from-reels: products with a video first, then the rest; each reel opens a buying card.
  const reelProducts = (await getReelProducts(products)).slice(0, 12).map(toPublicProduct);

  // Offer banner headline: the genuine biggest markdown in the catalogue (hidden when nothing is on sale).
  const maxOff = products.reduce((m, p) => Math.max(m, discountPercent(p.price, effectivePrice(p))), 0);

  // Advertisement carousel: sale, new arrivals, favourites, a collection and the reels — all built from real catalogue data.
  const adBanners = await getAdBanners(); // ready-made images in /public/ads win over the generated slides
  const adSlides = buildAdSlides({ maxOff, best, fresh, reels: reelProducts, collections, products });

  const railCategories = categories.filter((c) => c.visible !== false);

  return (
    <>
      <Hero hero={home.hero} slides={home.heroSlides} />
      <CategoryRail categories={railCategories} products={products} />
      <BestSellers products={best.map(toPublicProduct)} />
      <ScrollMarquee words={collections.map((c) => c.name)} />
      <NewArrivals products={fresh.map(toPublicProduct)} />
      <ShopReels products={reelProducts} />
      <AdCarousel slides={adSlides} banners={adBanners} />
      <TrustStrip />
      <AllProducts products={products.slice(0, ALL_PRODUCTS_CAP).map(toPublicProduct)} categories={railCategories.map((c) => ({ slug: c.slug, name: c.name }))} />

      {/* The story, brand and social sections stay at the bottom for anyone who doesn't open the full list. */}
      <ScrollStatement panel text={STORY_QUOTE} eyebrow="Our story" byline={{ name: FOUNDER.name, role: FOUNDER.role, image: FOUNDER.image }} cta={{ href: "/about", label: "Read our story" }} />
      <BrandStory story={home.brandStory} />
      <Emblem message={home.editorialMessage || "Designed to be remembered."} />
      <Testimonials items={testimonials} />
    </>
  );
}
