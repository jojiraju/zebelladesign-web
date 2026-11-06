import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gem, Heart, Palette, PackageCheck, RotateCcw, Scissors, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { collectionArt } from "@/lib/art";
import { getCollections, getHomepage } from "@/lib/server/catalog";
import { Reveal, WordReveal } from "@/components/ui/motion";
import { Rise3D, ScrollStatement, TiltCard } from "@/components/ui/fx";
import { ScrollMarquee } from "@/components/home/ScrollMarquee";
import { FOUNDER, STORY_CHAPTERS, STORY_QUOTE } from "@/lib/story";

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
  { icon: Truck, stat: "5–8", unit: "days", title: "Pan-India delivery", text: "Delivered to your door in 5–8 business days.", tone: "from-blush to-rose-soft/70" },
  { icon: RotateCcw, stat: "7", unit: "days", title: "Easy returns", text: "7 days to return unworn pieces with tags.", tone: "from-cream to-blush/80" },
  { icon: ShieldCheck, stat: "UPI", unit: "& cards", title: "Secure payments", text: "UPI, cards and netbanking, processed securely.", tone: "from-rose-soft/60 to-blush" },
  { icon: Scissors, stat: "Made", unit: "to fit", title: "Custom fit", text: "Selected styles can be tailored — just ask.", tone: "from-blush to-cream" },
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
          <p className="eyebrow">Our story</p>
          <h1 className="mt-5 font-serif text-4xl font-light leading-[1.08] sm:text-5xl lg:text-[3.6rem]"><WordReveal text="Behind Ze Bella" /></h1>
          <Reveal delay={0.2}><p className="mt-7 max-w-xl text-lg leading-8 text-taupe-deep">{STORY_CHAPTERS[3].text}</p></Reveal>
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

      <ScrollStatement text={STORY_CHAPTERS[4].text} eyebrow="Our own label" />

      {/* ---------- Values ---------- */}
      <section className="container-x mt-24 sm:mt-32" aria-labelledby="values-h">
        <div className="mb-10 max-w-xl"><p className="eyebrow mb-3">What we stand for</p><h2 id="values-h" className="font-serif text-4xl sm:text-5xl">Fashion with <span className="text-gradient">intention</span></h2></div>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v, i) => {
            const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
            return (
              <Rise3D as="li" key={v.title} delay={i * 0.08}>
                <TiltCard className={`${card} p-7 hover:border-gold`}>
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-blush to-rose-soft/60 text-gold-deep"><Icon size={24} strokeWidth={1.5} aria-hidden /></span>
                  <h3 className="mt-6 font-serif text-2xl">{v.title}</h3>
                  <p className="mt-2 leading-7 text-taupe-deep">{v.text}</p>
                </TiltCard>
              </Rise3D>
            );
          })}
        </ul>
      </section>

      {/* ---------- Story ---------- */}
      <section className="container-x mt-24 sm:mt-32" aria-labelledby="story-h">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="relative mx-auto aspect-[4/5] max-w-md overflow-hidden rounded-t-[999px] rounded-b-[2rem] bg-cream shadow-[0_40px_80px_-40px_rgba(35,26,29,.55)] lg:max-w-none">
              <Image src={FOUNDER.image} alt="Nijisha Martin, founder of Ze Bella" fill sizes="(min-width:1024px) 40vw, 90vw" className="object-cover object-top" />
            </div>
            <div className="relative z-10 mx-auto -mt-10 flex w-[88%] max-w-sm items-center gap-4 rounded-2xl bg-white p-4 shadow-[0_24px_50px_-28px_rgba(143,74,91,.7)] ring-1 ring-line lg:max-w-none">
              <span aria-hidden className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-soft to-gold-deep text-white"><Heart size={22} /></span>
              <span><b className="block font-serif text-2xl leading-tight">{FOUNDER.name}</b><span className="text-xs uppercase tracking-[0.18em] text-taupe-deep">{FOUNDER.role}</span></span>
            </div>
          </div>

          <div>
            <p className="eyebrow mb-4">The story</p>
            <h2 id="story-h" className="font-serif text-4xl leading-[1.05] sm:text-6xl">Small, soft, <span className="italic text-gradient">ours.</span></h2>
            <Reveal><p className="mt-8 font-serif text-2xl leading-snug text-espresso sm:text-[1.65rem]"><span className="float-left mr-3 mt-1 font-serif text-7xl leading-[0.8] text-gold-deep">{STORY_CHAPTERS[0].text[0]}</span>{STORY_CHAPTERS[0].text.slice(1)}</p></Reveal>

            <ol className="relative mt-12 space-y-9 border-l border-dashed border-gold/50 pl-8 sm:pl-10">
              {STORY_CHAPTERS.slice(1).map((c, i) => (
                <Reveal as="li" key={c.label} delay={0.05} className="relative">
                  <span aria-hidden className="absolute -left-[2.55rem] top-0.5 grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-rose-soft to-gold-deep text-[0.65rem] font-semibold text-white ring-4 ring-ivory sm:-left-[3.05rem]">{i + 2}</span>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-gold-deep">{c.label}</p>
                  <p className="mt-2 text-lg leading-8 text-taupe-deep">{c.text}</p>
                </Reveal>
              ))}
            </ol>

            <blockquote className="relative mt-12 overflow-hidden rounded-3xl bg-gradient-to-br from-gold via-gold-deep to-wine p-8 text-ivory shadow-[0_30px_70px_-40px_rgba(143,74,91,.7)] sm:p-10">
              <span aria-hidden className="absolute -right-4 -top-6 font-serif text-[10rem] leading-none text-ivory/15">&rdquo;</span>
              <p className="relative font-serif text-2xl leading-snug sm:text-3xl">{STORY_QUOTE}</p>
              <footer className="relative mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-ivory/80">— {FOUNDER.name}, Ze Bella</footer>
            </blockquote>
          </div>
        </div>
      </section>

      <ScrollMarquee words={values.map((v) => v.title)} />

      {/* ---------- Process ---------- */}
      <section className="container-x mt-24 sm:mt-32" aria-labelledby="process-h">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-espresso via-[#3a2029] to-wine px-5 py-14 text-ivory shadow-[0_40px_90px_-50px_rgba(35,26,29,.8)] sm:px-10 sm:py-20 lg:px-14">
          <div aria-hidden className="fx-drift pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold/20 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full border border-ivory/10" />
          <div className="relative mx-auto mb-14 max-w-2xl text-center">
            <p className="eyebrow justify-center !text-rose-soft">How it&apos;s made</p>
            <h2 id="process-h" className="mt-4 text-balance font-serif text-4xl leading-tight sm:text-5xl">From sketch to <span className="italic text-rose-soft">your wardrobe</span></h2>
            <p className="mx-auto mt-4 max-w-md text-ivory/70">Four careful steps, every time — before a piece ever reaches you.</p>
          </div>
          <ol className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <span aria-hidden className="pointer-events-none absolute left-[12%] right-[12%] top-7 hidden border-t border-dashed border-ivory/25 lg:block" />
            {PROCESS.map(({ icon: Icon, title, text }, i) => (
              <Rise3D as="li" key={title} delay={i * 0.1}>
                <TiltCard className="group relative rounded-3xl border border-ivory/10 bg-ivory/[0.06] p-6 pt-9 backdrop-blur-sm transition duration-500 hover:-translate-y-1.5 hover:border-rose-soft/40 hover:bg-ivory/[0.1] lg:mt-7">
                  <span className="absolute -top-7 left-6 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-rose-soft to-gold-deep text-white shadow-[0_14px_30px_-10px_rgba(0,0,0,.6)] ring-4 ring-[#3a2029] transition duration-500 group-hover:scale-110"><Icon size={22} strokeWidth={1.5} aria-hidden /></span>
                  <span aria-hidden className="absolute right-5 top-3 font-serif text-6xl leading-none text-transparent [-webkit-text-stroke:1px_rgba(253,248,246,.28)]">{String(i + 1).padStart(2, "0")}</span>
                  <p className="text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-rose-soft">Step {i + 1}</p>
                  <h3 className="mt-2 font-serif text-3xl">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ivory/70">{text}</p>
                </TiltCard>
              </Rise3D>
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
              <Rise3D as="li" key={c.id} delay={i * 0.06}>
                <TiltCard className="rounded-2xl">
                <Link href={`/collections/${c.slug}`} className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-cream">
                  <Image src={collectionArt(c.imageUrl, i)} alt="" fill sizes="(min-width:1024px) 22vw, 45vw" className="object-cover object-top transition-transform duration-[1400ms] ease-[var(--ease-lux)] group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-espresso/75 via-transparent to-transparent" aria-hidden />
                  <span className="absolute inset-x-0 bottom-0 p-5 font-serif text-2xl leading-tight text-ivory">{c.name}<ArrowRight size={16} className="mt-2 transition-transform group-hover:translate-x-1" aria-hidden /></span>
                </Link>
                </TiltCard>
              </Rise3D>
            ))}
          </ul>
        </section>
      )}

      {/* ---------- Promises ---------- */}
      <section className="container-x mt-24 sm:mt-32" aria-labelledby="promise-h">
        <div className="mb-10 text-center"><p className="eyebrow justify-center">Our promise</p><h2 id="promise-h" className="mt-3 font-serif text-3xl sm:text-5xl">Shop with <span className="italic text-gradient">confidence</span></h2></div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {PROMISES.map(({ icon: Icon, stat, unit, title, text, tone }, i) => (
            <Rise3D as="li" key={title} delay={i * 0.08} className="h-full">
              <TiltCard className={`group relative flex min-h-[18rem] flex-col overflow-hidden rounded-[2rem] bg-gradient-to-br ${tone} p-7 shadow-[0_30px_60px_-42px_rgba(143,74,91,.7)] ring-1 ring-line transition duration-500 hover:-translate-y-2 hover:shadow-[0_44px_70px_-36px_rgba(143,74,91,.8)]`}>
                <Icon aria-hidden size={150} strokeWidth={0.7} className="pointer-events-none absolute -bottom-6 -right-6 text-gold-deep/15 transition duration-700 group-hover:-rotate-6 group-hover:scale-110" />
                <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-gold-deep shadow-md ring-1 ring-line transition duration-500 group-hover:bg-gradient-to-br group-hover:from-rose-soft group-hover:to-gold-deep group-hover:text-white"><Icon size={20} strokeWidth={1.5} aria-hidden /></span>
                <p className="mt-6 flex items-baseline gap-2 font-serif leading-none text-espresso"><span className="text-6xl">{stat}</span><span className="text-sm uppercase tracking-[0.2em] text-gold-deep">{unit}</span></p>
                <div className="relative mt-auto pt-8">
                  <h3 className="font-serif text-2xl">{title}</h3>
                  <span aria-hidden className="mt-3 block h-px w-10 bg-gold-deep/60 transition-all duration-500 group-hover:w-20" />
                  <p className="mt-3 max-w-[15rem] text-sm leading-6 text-taupe-deep">{text}</p>
                </div>
              </TiltCard>
            </Rise3D>
          ))}
        </ul>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="container-x mt-16 sm:mt-24">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-gold via-gold-deep to-wine px-6 py-14 text-center text-ivory shadow-[0_30px_70px_-40px_rgba(143,74,91,.7)] sm:py-20">
          <div aria-hidden className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-ivory/10" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full border border-ivory/20" />
          <p className="eyebrow relative justify-center !text-ivory/85">Find your next favourite</p>
          <h2 className="relative mx-auto mt-4 max-w-2xl font-serif text-4xl leading-tight sm:text-6xl">Elegant dresses for every occasion</h2>
          <p className="relative mx-auto mt-4 max-w-lg text-ivory/85">Explore the latest collections, or get in touch — we&apos;re always happy to help you find the perfect fit.</p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3"><Link href="/shop" className="btn btn-light">Shop now <ArrowRight size={15} className="arrow" aria-hidden /></Link><Link href="/contact" className="btn btn-outline-light">Contact us</Link></div>
        </div>
      </section>
    </div>
  );
}
