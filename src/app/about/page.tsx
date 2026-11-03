import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gem, Heart, Palette, PackageCheck, RotateCcw, Scissors, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { RichText } from "@/components/ui/RichText";
import { collectionArt } from "@/lib/art";
import { getCollections, getHomepage } from "@/lib/server/catalog";
import { ParallaxFrame, Reveal, WordReveal } from "@/components/ui/motion";

export const revalidate = 60;
export const metadata: Metadata = { title: "About Us", description: "The story and design philosophy behind Zebella Designs.", alternates: { canonical: "/about" } };

const card = "rounded-2xl border border-line bg-white shadow-[0_18px_40px_-34px_rgba(143,74,91,.6)]";
const VALUE_ICONS = [Scissors, Sparkles, Heart, Gem];

const PROCESS = [
  { icon: Palette, title: "Design", text: "Every silhouette starts as a sketch, drawn and fitted by our design team." },
  { icon: Sparkles, title: "Fabric", text: "We choose soft, breathable fabrics and colours that photograph and feel true." },
  { icon: Scissors, title: "Stitch", text: "Patterns are cut and stitched with attention to fit, finish and movement." },
  { icon: PackageCheck, title: "Finish", text: "Trims and hems are finished by hand, then every piece is checked and packed with care." },
];

const PROMISES = [
  { icon: Truck, title: "Pan-India delivery", text: "Delivered to your door in 5–8 business days." },
  { icon: RotateCcw, title: "Easy returns", text: "7 days to return unworn pieces with tags." },
  { icon: ShieldCheck, title: "Secure payments", text: "UPI, cards and netbanking, processed securely." },
  { icon: Scissors, title: "Custom fit", text: "Selected styles can be tailored — just ask." },
];

export default async function AboutPage() {
  const [{ brandStory: s }, collections] = await Promise.all([getHomepage(), getCollections()]);
  const values = s.points?.length ? s.points : [
    { title: "Designed in-house", text: "Original silhouettes drawn and fitted by our own team." },
    { title: "Finished by hand", text: "Trims, hems and embroidery completed with care." },
    { title: "Made to be loved", text: "Soft fabrics, true colours and a fit that flatters." },
  ];
  const story = s.imageUrl || "/art/story.svg";

  return (
    <div className="overflow-x-clip pb-8">
      {/* ---------- Hero ---------- */}
      <section className="container-x grid items-center gap-12 pt-10 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div>
          <p className="eyebrow">{s.eyebrow ?? "Our story"}</p>
          <h1 className="mt-5 font-serif text-4xl font-light leading-[1.08] sm:text-5xl lg:text-[3.6rem]"><WordReveal text={s.heading ?? "About Zebella Designs"} /></h1>
          <Reveal delay={0.2}><p className="mt-7 max-w-xl text-lg leading-8 text-taupe-deep">Contemporary ethnic and festive wear for the moments that matter — designed with care, finished by hand and made to be worn again and again.</p></Reveal>
          <Reveal delay={0.3} className="mt-9 flex flex-wrap gap-3">
            <Link href="/shop" className="btn btn-solid">Shop the collection <ArrowRight size={16} className="arrow" aria-hidden /></Link>
            <Link href="/collections" className="btn btn-ghost">Explore collections</Link>
          </Reveal>
        </div>

        {/* Collage */}
        <Reveal className="relative mx-auto aspect-[5/6] w-full max-w-lg lg:max-w-none" y={40}>
          <div aria-hidden className="fx-drift absolute -right-6 -top-6 h-40 w-40 rounded-full bg-gradient-to-br from-blush to-rose-soft/60" />
          <div aria-hidden className="fx-spin absolute -bottom-8 left-8 h-52 w-52 rounded-full border border-dashed border-gold/50" />
          <div className="absolute right-0 top-0 h-[88%] w-[68%] overflow-hidden rounded-t-[999px] rounded-b-3xl shadow-[0_40px_80px_-40px_rgba(35,26,29,.55)]">
            <Image src={story} alt="" fill priority sizes="(min-width:1024px) 30vw, 60vw" className="fx-breathe object-cover object-top" />
          </div>
          <div className="absolute bottom-0 left-0 h-[52%] w-[44%] -rotate-3 overflow-hidden rounded-3xl border-4 border-ivory shadow-[0_30px_60px_-30px_rgba(35,26,29,.5)]">
            <Image src="/art/tile-signature.svg" alt="" fill sizes="(min-width:1024px) 20vw, 40vw" className="object-cover object-top" />
          </div>
          <div className="fx-bob absolute left-[6%] top-[10%] flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_20px_40px_-24px_rgba(143,74,91,.7)]">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-deep text-white"><Heart size={18} aria-hidden /></span>
            <span className="text-xs leading-4"><b className="block text-sm font-medium">Handcrafted</b><span className="text-taupe-deep">with care</span></span>
          </div>
        </Reveal>
      </section>

      {/* ---------- Values ---------- */}
      <section className="container-x mt-24 sm:mt-32" aria-labelledby="values-h">
        <div className="mb-10 max-w-xl"><p className="eyebrow mb-3">What we stand for</p><h2 id="values-h" className="font-serif text-4xl sm:text-5xl">Fashion with <span className="text-gradient">intention</span></h2></div>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v, i) => {
            const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
            return (
              <Reveal as="li" key={v.title} delay={i * 0.08}>
                <div className={`${card} h-full p-7 transition hover:-translate-y-1 hover:border-gold`}>
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-blush to-rose-soft/60 text-gold-deep"><Icon size={24} strokeWidth={1.5} aria-hidden /></span>
                  <h3 className="mt-6 font-serif text-2xl">{v.title}</h3>
                  <p className="mt-2 leading-7 text-taupe-deep">{v.text}</p>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </section>

      {/* ---------- Story ---------- */}
      <section className="container-x mt-24 grid items-center gap-12 sm:mt-32 md:grid-cols-2 lg:gap-20" aria-labelledby="story-h">
        <ParallaxFrame className="aspect-[4/5] rounded-3xl bg-cream md:order-2" strength={6}>
          <Image src="/art/tile-ethnic.svg" alt="" fill sizes="(min-width:768px) 45vw, 100vw" className="object-cover object-top" />
        </ParallaxFrame>
        <div>
          <p className="eyebrow mb-4">The story</p>
          <h2 id="story-h" className="font-serif text-4xl leading-tight sm:text-5xl">Designed to be remembered</h2>
          <Reveal><RichText className="mt-7 text-lg leading-8 text-taupe-deep" html={s.body} /></Reveal>
          <blockquote className="mt-8 border-l-2 border-gold pl-6 font-serif text-2xl leading-snug text-gold-deep">Clothes should feel as good as they look — and be worn long after the occasion.</blockquote>
        </div>
      </section>

      {/* ---------- Process ---------- */}
      <section className="mt-24 bg-gradient-to-b from-blush/40 to-transparent py-16 sm:mt-32 sm:py-24" aria-labelledby="process-h">
        <div className="container-x">
          <div className="mx-auto mb-12 max-w-xl text-center"><p className="eyebrow justify-center">How it&apos;s made</p><h2 id="process-h" className="mt-3 font-serif text-4xl sm:text-5xl">From sketch to your wardrobe</h2></div>
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map(({ icon: Icon, title, text }, i) => (
              <Reveal as="li" key={title} delay={i * 0.08}>
                <div className={`${card} relative h-full p-6`}>
                  <span className="absolute right-5 top-4 font-serif text-5xl text-blush">{String(i + 1).padStart(2, "0")}</span>
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-espresso text-ivory"><Icon size={20} strokeWidth={1.5} aria-hidden /></span>
                  <h3 className="mt-5 font-serif text-2xl">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-taupe-deep">{text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Collections ---------- */}
      {collections.length > 0 && (
        <section className="container-x mt-4 sm:mt-8" aria-labelledby="col-h">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow mb-3">Explore</p><h2 id="col-h" className="font-serif text-4xl sm:text-5xl">Our collections</h2></div><Link href="/collections" className="link-underline text-xs font-semibold uppercase tracking-[0.18em]">View all</Link></div>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {collections.slice(0, 4).map((c, i) => (
              <Reveal as="li" key={c.id} delay={i * 0.06}>
                <Link href={`/collections/${c.slug}`} className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-cream">
                  <Image src={collectionArt(c.imageUrl, i)} alt="" fill sizes="(min-width:1024px) 22vw, 45vw" className="object-cover object-top transition-transform duration-[1400ms] ease-[var(--ease-lux)] group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-espresso/75 via-transparent to-transparent" aria-hidden />
                  <span className="absolute inset-x-0 bottom-0 p-5 font-serif text-2xl leading-tight text-ivory">{c.name}<ArrowRight size={16} className="mt-2 transition-transform group-hover:translate-x-1" aria-hidden /></span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      {/* ---------- Promises ---------- */}
      <section className="container-x mt-24 sm:mt-32" aria-label="Our promises">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map(({ icon: Icon, title, text }) => (
            <li key={title} className={`${card} flex gap-4 p-5`}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blush text-gold-deep"><Icon size={19} strokeWidth={1.6} aria-hidden /></span>
              <span><b className="block font-medium">{title}</b><span className="text-sm text-taupe-deep">{text}</span></span>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="container-x mt-16 sm:mt-24">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-gold via-gold-deep to-wine px-6 py-14 text-center text-ivory shadow-[0_30px_70px_-40px_rgba(143,74,91,.7)] sm:py-20">
          <div aria-hidden className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-ivory/10" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full border border-ivory/20" />
          <p className="eyebrow relative justify-center !text-ivory/85">Find your next favourite</p>
          <h2 className="relative mx-auto mt-4 max-w-2xl font-serif text-4xl leading-tight sm:text-6xl">Dressed for every occasion</h2>
          <p className="relative mx-auto mt-4 max-w-lg text-ivory/85">Explore the latest collections, or get in touch — we&apos;re always happy to help you find the perfect fit.</p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3"><Link href="/shop" className="btn btn-light">Shop now <ArrowRight size={15} className="arrow" aria-hidden /></Link><Link href="/contact" className="btn btn-outline-light">Contact us</Link></div>
        </div>
      </section>
    </div>
  );
}
