import Link from "next/link";
import Image from "next/image";
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

const spans: Record<NonNullable<FeaturedTile["size"]>, string> = {
  large: "md:col-span-7 md:row-span-2 aspect-[4/5] md:aspect-auto",
  tall: "md:col-span-5 md:row-span-2 aspect-[4/5] md:aspect-auto",
  wide: "md:col-span-6 aspect-[16/10]",
  small: "md:col-span-3 aspect-[4/5] md:aspect-auto",
};

export function CollectionsMosaic({ tiles }: { tiles: FeaturedTile[] }) {
  const items = (tiles.length ? tiles : DEFAULT_TILES).slice(0, 5);
  const layout: NonNullable<FeaturedTile["size"]>[] = ["large", "tall", "wide", "small", "small"];
  return (
    <section className="container-x mt-28" aria-labelledby="col-h">
      <SectionHead eyebrow="Explore" title="The Collections" href="/collections" />
      <h2 id="col-h" className="sr-only">Featured collections</h2>
      <div className="grid grid-cols-1 gap-4 md:min-h-[78rem] md:grid-cols-12 md:grid-rows-[repeat(4,minmax(0,1fr))] md:gap-5">
        {items.map((t, i) => (
          <Reveal key={t.title + i} delay={i * 0.06} className={`${spans[t.size ?? layout[i]]} ${i === 0 ? "md:row-span-3" : ""}`}>
            <Link href={t.href} className="group relative block h-full min-h-72 overflow-hidden bg-cream">
              {t.imageUrl && <Image src={t.imageUrl} alt="" fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover transition-transform duration-[1600ms] ease-[var(--ease-lux)] group-hover:scale-[1.05]" />}
              <div className="absolute inset-0 bg-gradient-to-t from-espresso/65 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 text-ivory sm:p-8">
                <div>
                  {t.subtitle && <p className="eyebrow !text-gold mb-2">{t.subtitle}</p>}
                  <h3 className="font-serif text-3xl leading-none sm:text-4xl">{t.title}</h3>
                </div>
                <span className="grid h-12 w-12 place-items-center border border-ivory/60 transition-all duration-500 group-hover:bg-ivory group-hover:text-espresso" aria-hidden>
                  <span className="transition-transform duration-500 group-hover:translate-x-0.5">→</span>
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
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
          text={backendReady ? "Our latest designs will appear here shortly." : "Connect Firebase and add your first product from the CMS to see it here."}>
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
    <section className="mt-32 space-y-5" aria-label="Promotions">
      {banners.slice(0, 3).map((b) => (
        <Reveal key={b.id}>
          <div className="relative isolate flex min-h-[26rem] items-center overflow-hidden bg-cream sm:min-h-[30rem]">
            <ParallaxFrame className="absolute inset-0 -z-10" strength={7}>
              {b.mobileImage && <Image src={b.mobileImage} alt="" fill sizes="100vw" className="object-cover md:hidden" />}
              {(b.desktopImage || !b.mobileImage) && <Image src={b.desktopImage || "/art/banner.svg"} alt="" fill sizes="100vw" className={`object-cover ${b.mobileImage ? "hidden md:block" : ""}`} />}
            </ParallaxFrame>
            <div className="container-x">
              <div className="max-w-xl bg-ivory/90 p-8 backdrop-blur-sm sm:p-12">
                <h2 className="font-serif text-4xl leading-tight sm:text-5xl">{b.heading}</h2>
                {b.description && <p className="mt-4 text-taupe-deep">{b.description}</p>}
                {b.ctaLabel && b.href && <Link href={b.href} className="btn btn-solid mt-8">{b.ctaLabel} <span className="arrow">→</span></Link>}
              </div>
            </div>
          </div>
        </Reveal>
      ))}
    </section>
  );
}

/* ---------- Brand story ---------- */
export function BrandStory({ story }: { story: HomepageContent["brandStory"] }) {
  return (
    <section className="container-x mt-36 grid items-center gap-12 md:grid-cols-2 lg:gap-24" aria-labelledby="story-h">
      <ParallaxFrame className="aspect-[4/5] bg-cream md:order-2" strength={6}>
        <Image src={story.imageUrl || "/art/story.svg"} alt="" fill sizes="(min-width:768px) 45vw, 100vw" className="object-cover" />
      </ParallaxFrame>
      <div>
        {story.eyebrow && <p className="eyebrow mb-5">{story.eyebrow}</p>}
        <h2 id="story-h" className="h-section font-serif"><WordReveal text={story.heading ?? ""} /></h2>
        {story.body && <Reveal delay={0.15}><RichText className="mt-8 max-w-lg text-lg text-taupe-deep" html={story.body} /></Reveal>}
        {!!story.points?.length && (
          <dl className="mt-10 grid gap-6 sm:grid-cols-2">
            {story.points.map((p) => (
              <Reveal key={p.title}><div className="border-t border-line pt-4"><dt className="font-serif text-xl">{p.title}</dt><dd className="mt-1 text-sm text-taupe-deep">{p.text}</dd></div></Reveal>
            ))}
          </dl>
        )}
        <Reveal delay={0.2}><Link href="/about" className="btn btn-ghost mt-10">Our story <span className="arrow">→</span></Link></Reveal>
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
