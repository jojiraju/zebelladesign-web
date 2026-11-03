import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Gem, Heart, Scissors, Sparkles } from "lucide-react";
import { RichText } from "@/components/ui/RichText";
import { Reveal, WordReveal, ParallaxFrame } from "@/components/ui/motion";
import { ProductGrid } from "@/components/product/ProductGrid";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { EmptyState } from "@/components/ui/Skeletons";
import type { Banner, FeaturedTile, HomepageContent, StoreSettings, Testimonial } from "@/lib/content";
import type { Product } from "@/lib/types";

export function SectionHead({ eyebrow, title, href, linkLabel = "View all" }: { eyebrow?: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-10 flex items-end justify-between gap-6 sm:mb-14">
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="h-section font-serif"><WordReveal text={title} /></h2>
      </div>
      {href && <Link href={href} className="link-underline hidden shrink-0 text-xs font-medium uppercase tracking-[0.22em] sm:inline-block">{linkLabel} →</Link>}
    </div>
  );
}

/* ---------- Featured collections: asymmetric editorial mosaic ---------- */
const DEFAULT_TILES: FeaturedTile[] = [
  { title: "New Arrivals", subtitle: "Just landed", imageUrl: "/art/tile-new.svg", href: "/shop?sort=newest", size: "large" },
  { title: "Festive Wear", imageUrl: "/art/tile-festive.svg", href: "/collections/festive-wear", size: "tall" },
  { title: "Designer Ethnic Wear", imageUrl: "/art/tile-ethnic.svg", href: "/collections/designer-ethnic-wear", size: "wide" },
  { title: "Signature Collection", imageUrl: "/art/tile-signature.svg", href: "/collections/signature-collection", size: "small" },
  { title: "Best Sellers", imageUrl: "/art/tile-best.svg", href: "/shop?sort=popular", size: "small" },
];

/** Bento layout: mobile stacks (big tiles full width, small ones in pairs); desktop uses a fixed 12-column grid. */
const SPANS: Record<NonNullable<FeaturedTile["size"]>, string> = {
  large: "col-span-2 aspect-[4/5] md:col-span-7 md:row-span-4 md:aspect-auto",
  tall: "col-span-2 aspect-[4/5] md:col-span-5 md:row-span-4 md:aspect-auto",
  wide: "col-span-2 aspect-[16/10] md:col-span-6 md:row-span-2 md:aspect-auto",
  small: "col-span-1 aspect-[3/4] md:col-span-3 md:row-span-2 md:aspect-auto",
};
const TITLE: Record<NonNullable<FeaturedTile["size"]>, string> = {
  large: "text-3xl sm:text-4xl", tall: "text-3xl sm:text-4xl", wide: "text-2xl sm:text-3xl", small: "text-lg sm:text-2xl",
};

export function CollectionsMosaic({ tiles }: { tiles: FeaturedTile[] }) {
  const items = (tiles.length ? tiles : DEFAULT_TILES).slice(0, 5);
  const layout: NonNullable<FeaturedTile["size"]>[] = ["large", "tall", "wide", "small", "small"];
  return (
    <section className="container-x mt-24 sm:mt-32" aria-labelledby="col-h">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5 sm:mb-12">
        <div className="max-w-xl">
          <p className="eyebrow mb-3">Explore</p>
          <h2 id="col-h" className="h-section font-serif"><WordReveal text="The Collections" /></h2>
          <Reveal delay={0.1}><p className="mt-4 text-taupe-deep">Handpicked edits for every occasion — from festive favourites to everyday essentials.</p></Reveal>
        </div>
        <Link href="/collections" className="btn btn-ghost">View all collections <ArrowRight size={15} className="arrow" aria-hidden /></Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:auto-rows-[11rem] md:grid-cols-12 md:gap-5">
        {items.map((t, i) => {
          const size = t.size ?? layout[i];
          return (
            <Reveal key={t.title + i} delay={i * 0.07} className={SPANS[size]}>
              <Link href={t.href} className="group relative block h-full min-h-48 overflow-hidden rounded-[1.5rem] bg-cream shadow-[0_30px_60px_-40px_rgba(35,26,29,.55)] sm:rounded-[1.75rem]">
                {t.imageUrl && <Image src={t.imageUrl} alt="" fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover object-top transition-transform duration-[1600ms] ease-[var(--ease-lux)] group-hover:scale-[1.06]" />}
                <div className="absolute inset-0 bg-gradient-to-t from-espresso/55 via-transparent to-espresso/10" aria-hidden />

                <span className="absolute left-3 top-3 rounded-full bg-white/80 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.2em] text-espresso backdrop-blur sm:left-5 sm:top-5" aria-hidden>{String(i + 1).padStart(2, "0")}</span>

                {/* Frosted label card */}
                <div className="absolute inset-x-2.5 bottom-2.5 flex items-center justify-between gap-3 rounded-2xl bg-white/80 p-3.5 backdrop-blur-md transition-transform duration-500 ease-[var(--ease-lux)] group-hover:-translate-y-1 sm:inset-x-4 sm:bottom-4 sm:p-5">
                  <div className="min-w-0">
                    {t.subtitle && <p className="mb-1 truncate text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-gold-deep">{t.subtitle}</p>}
                    <h3 className={`font-serif leading-tight text-espresso ${TITLE[size]}`}>{t.title}</h3>
                  </div>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-deep text-white transition-transform duration-500 group-hover:translate-x-0.5 group-hover:scale-110 sm:h-11 sm:w-11" aria-hidden><ArrowRight size={16} /></span>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Featured products ---------- */
export function FeaturedProducts({ products, backendReady }: { products: Product[]; backendReady: boolean }) {
  return (
    <section className="container-x mt-32" aria-labelledby="fp">
      <h2 id="fp" className="sr-only">Featured products</h2>
      <SectionHead eyebrow="Curated for you" title="Featured pieces" href="/shop" linkLabel="Shop all" />
      {products.length ? <ProductGrid products={products} priorityFirst={0} /> : (
        <EmptyState title={backendReady ? "New pieces arriving soon" : "Your storefront is ready"}
          text={backendReady ? "Our latest designs will appear here shortly." : "Connect the store API and add your first product to see it here."}>
          <Link href="/shop" className="btn btn-ghost">Browse the shop</Link>
        </EmptyState>
      )}
    </section>
  );
}

/* ---------- Promotional banners (CMS) ---------- */
export function PromoBanners({ banners }: { banners: Banner[] }) {
  if (!banners.length) return null;
  return (
    <section className="container-x mt-24 space-y-6 sm:mt-32" aria-label="Promotions">
      {banners.slice(0, 3).map((b) => (
        <Reveal key={b.id}>
          <div className="group relative isolate flex flex-col overflow-hidden rounded-[1.75rem] bg-[#0f2a1d] shadow-[0_40px_80px_-45px_rgba(23,56,42,.8)] sm:min-h-[28rem] sm:flex-row sm:items-center sm:rounded-[2rem]">
            {/* Phones: artwork on top, text below (so the models are never covered) */}
            <div className="relative h-72 sm:hidden">
              <Image src={b.mobileImage || b.desktopImage || "/art/banner.svg"} alt="" fill sizes="100vw" className="object-cover object-[78%_top]" />
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0f2a1d] to-transparent" />
            </div>
            {/* Desktop: artwork fills the card, anchored right; a soft scrim keeps the text readable */}
            <ParallaxFrame className="absolute inset-0 -z-20 hidden sm:block" strength={6}>
              <Image src={b.desktopImage || b.mobileImage || "/art/banner.svg"} alt="" fill sizes="100vw" className="object-cover object-right transition-transform duration-[1800ms] ease-[var(--ease-lux)] group-hover:scale-[1.03]" />
            </ParallaxFrame>
            <div aria-hidden className="absolute inset-y-0 left-0 -z-10 hidden w-[58%] bg-gradient-to-r from-[#0f2a1d] via-[#0f2a1d]/80 to-transparent sm:block" />

            <div className="relative w-full px-6 pb-8 pt-2 sm:max-w-[34rem] sm:p-12 lg:p-16">
              <span className="inline-flex items-center gap-2 rounded-full border border-ivory/30 bg-ivory/10 px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-ivory backdrop-blur"><Sparkles size={13} aria-hidden />Featured edit</span>
              <h2 className="mt-5 font-serif text-4xl leading-[1.05] text-ivory sm:text-5xl lg:text-6xl">{b.heading}</h2>
              {b.description && <p className="mt-4 max-w-md text-base leading-7 text-ivory/80 sm:text-lg">{b.description}</p>}
              {b.ctaLabel && b.href && (
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link href={b.href} className="btn btn-light">{b.ctaLabel} <ArrowRight size={16} className="arrow" aria-hidden /></Link>
                  <Link href="/collections" className="link-underline text-xs font-semibold uppercase tracking-[0.18em] text-ivory/90">All collections</Link>
                </div>
              )}
            </div>
          </div>
        </Reveal>
      ))}
    </section>
  );
}

/* ---------- Brand story ---------- */
const STORY_ICONS = [Scissors, Sparkles, Heart, Gem];

export function BrandStory({ story }: { story: HomepageContent["brandStory"] }) {
  return (
    <section className="container-x mt-24 sm:mt-32" aria-labelledby="story-h">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blush/70 via-ivory to-white p-6 shadow-[0_40px_80px_-50px_rgba(143,74,91,.55)] ring-1 ring-line sm:p-10 lg:p-14">
        <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-rose-soft/20" />
        <div className="relative grid items-center gap-10 md:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            {story.eyebrow && <p className="eyebrow mb-4">{story.eyebrow}</p>}
            <h2 id="story-h" className="font-serif text-4xl leading-[1.1] sm:text-5xl lg:text-[3.4rem]"><WordReveal text={story.heading ?? ""} /></h2>
            {story.body && <Reveal delay={0.15}><RichText className="mt-6 max-w-xl text-lg leading-8 text-taupe-deep" html={story.body} /></Reveal>}

            {!!story.points?.length && (
              <ul className="mt-8 grid gap-3 sm:grid-cols-3">
                {story.points.slice(0, 3).map((p, i) => {
                  const Icon = STORY_ICONS[i % STORY_ICONS.length];
                  return (
                    <Reveal as="li" key={p.title} delay={0.1 + i * 0.08}>
                      <div className="h-full rounded-2xl border border-line bg-white/80 p-4 backdrop-blur transition hover:-translate-y-1 hover:border-gold">
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-blush to-rose-soft/60 text-gold-deep"><Icon size={18} strokeWidth={1.6} aria-hidden /></span>
                        <h3 className="mt-3 font-serif text-lg leading-tight">{p.title}</h3>
                        <p className="mt-1 text-xs leading-5 text-taupe-deep">{p.text}</p>
                      </div>
                    </Reveal>
                  );
                })}
              </ul>
            )}

            <Reveal delay={0.25} className="mt-9 flex flex-wrap items-center gap-4">
              <Link href="/about" className="btn btn-solid">Our story <ArrowRight size={15} className="arrow" aria-hidden /></Link>
              <Link href="/shop" className="link-underline text-xs font-semibold uppercase tracking-[0.18em]">Shop the collection</Link>
            </Reveal>
          </div>

          {/* Arched image with floating details */}
          <Reveal y={40} className="relative mx-auto w-full max-w-md md:max-w-none">
            <div aria-hidden className="fx-drift absolute -right-4 -top-4 h-32 w-32 rounded-full bg-gradient-to-br from-gold/30 to-rose-soft/40" />
            <div aria-hidden className="fx-spin absolute -bottom-6 -left-6 h-44 w-44 rounded-full border border-dashed border-gold/50" />
            <span aria-hidden className="fx-twinkle absolute right-[8%] top-[30%] z-10 h-5 w-5 text-gold" style={{ ["--d" as string]: "0.4s" }}><svg viewBox="-16 -16 32 32"><path d="M0,-14 C1,-5 5,-1 14,0 C5,1 1,5 0,14 C-1,5 -5,1 -14,0 C-5,-1 -1,-5 0,-14 Z" fill="currentColor" /></svg></span>
            <span aria-hidden className="fx-twinkle absolute left-[14%] top-[6%] z-10 h-4 w-4 text-rose" style={{ ["--d" as string]: "1.6s" }}><svg viewBox="-16 -16 32 32"><path d="M0,-14 C1,-5 5,-1 14,0 C5,1 1,5 0,14 C-1,5 -5,1 -14,0 C-5,-1 -1,-5 0,-14 Z" fill="currentColor" /></svg></span>
            <ParallaxFrame className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[1.75rem] bg-cream shadow-[0_40px_80px_-40px_rgba(35,26,29,.55)]" strength={5}>
              <Image src={story.imageUrl || "/art/story.svg"} alt="" fill sizes="(min-width:768px) 40vw, 90vw" className="fx-breathe object-cover object-top" />
            </ParallaxFrame>
            <div className="fx-bob absolute -left-3 top-[18%] flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_20px_40px_-24px_rgba(143,74,91,.7)] sm:-left-6">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-deep text-white"><Heart size={17} aria-hidden /></span>
              <span className="text-xs leading-4"><b className="block text-sm font-medium">Handcrafted</b><span className="text-taupe-deep">with care</span></span>
            </div>
            {story.badge && (
              <div style={{ ["--d" as string]: "1.2s" }} className="fx-bob absolute -right-2 bottom-[10%] rounded-2xl bg-espresso px-5 py-3 text-ivory shadow-[0_20px_40px_-24px_rgba(35,26,29,.8)] sm:-right-5">
                <p className="font-serif text-2xl leading-none">{story.badge.title}</p>
                {story.badge.text && <p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-ivory/70">{story.badge.text}</p>}
              </div>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- Testimonials: verified only; otherwise an editorial message ---------- */
export function Testimonials({ items, message }: { items: Testimonial[]; message?: string }) {
  if (!items.length) {
    if (!message) return null;
    return (
      <section className="container-x mt-36 text-center" aria-label="Brand message">
        <Reveal><p className="mx-auto max-w-3xl font-serif text-3xl italic leading-snug sm:text-5xl">&ldquo;{message}&rdquo;</p></Reveal>
      </section>
    );
  }
  return (
    <section className="container-x mt-36" aria-labelledby="t-h">
      <SectionHead eyebrow="Verified customers" title="In their words" />
      <h2 id="t-h" className="sr-only">Customer testimonials</h2>
      <ul className="grid gap-8 md:grid-cols-3">
        {items.slice(0, 3).map((t, i) => (
          <Reveal as="li" key={t.id} delay={i * 0.08}>
            <figure className="h-full border border-line bg-white p-8">
              <blockquote className="font-serif text-2xl leading-snug">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-6 text-xs uppercase tracking-[0.2em] text-taupe-deep">{t.name}{t.location && `, ${t.location}`} · Verified purchase</figcaption>
            </figure>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Social gallery (admin-managed images; no scraping) ---------- */
export function SocialGallery({ items, instagram }: { items: HomepageContent["social"]; instagram?: string }) {
  if (!items.length) return null;
  return (
    <section className="mt-36" aria-labelledby="ig-h">
      <div className="container-x"><SectionHead eyebrow="@zebelladesigns" title="Seen on Instagram" />
        <h2 id="ig-h" className="sr-only">Social gallery</h2></div>
      <ul className="grid grid-cols-3 gap-1 md:grid-cols-6">
        {items.slice(0, 6).map((s, i) => (
          <li key={i} className="group relative aspect-square overflow-hidden bg-cream">
            <a href={s.href || instagram || "#"} target="_blank" rel="noopener noreferrer" aria-label={s.alt || "View on Instagram"} className="absolute inset-0">
              <Image src={s.imageUrl} alt={s.alt || ""} fill sizes="(min-width:768px) 16vw, 33vw" className="object-cover transition-transform duration-[1200ms] group-hover:scale-110" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NewsletterSection({ settings }: { settings: StoreSettings }) {
  if (!settings.newsletter.enabled) return null;
  return (
    <section className="container-x mt-24" aria-labelledby="nl-h">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-[#1d0f13] px-6 py-10 text-center text-white shadow-[0_50px_100px_-40px_rgba(143,74,91,.7)] sm:px-14 sm:py-14">
          <div aria-hidden className="aurora absolute -left-20 -top-24 -z-10 h-96 w-96 rounded-full bg-gold/70 blur-[90px]" />
          <div aria-hidden className="aurora absolute -bottom-32 -right-10 -z-10 h-[26rem] w-[26rem] rounded-full bg-gold-deep/80 blur-[100px] [animation-delay:-6s]" />
          <div aria-hidden className="aurora absolute left-1/2 top-1/3 -z-10 h-72 w-72 rounded-full bg-rose-soft/40 blur-[90px] [animation-delay:-12s]" />
          <div aria-hidden className="absolute inset-0 -z-10 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />
          <Image src="/brand/logo-mark-light.png" alt="" width={500} height={414} aria-hidden className="mx-auto mb-3 h-10 w-auto opacity-90" />
          <p className="eyebrow mb-3 !text-rose-soft">Stay in the know</p>
          <h2 id="nl-h" className="mx-auto max-w-2xl font-serif text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.08] !text-white">{settings.newsletter.heading || "Join the Zebella list"}</h2>
          <p className="mx-auto mb-7 mt-3 max-w-md text-sm text-white/70">First access to new collections and private previews.</p>
          <NewsletterForm consent={settings.newsletter.consent} />
          <ul className="mt-6 flex flex-wrap justify-center gap-2 text-xs font-semibold text-white/85">
            {["Early access", "Private previews", "No spam"].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-soft/60 hover:bg-white/10"><span className="h-1.5 w-1.5 rounded-full bg-rose-soft" />{t}</li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
