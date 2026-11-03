import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RichText } from "@/components/ui/RichText";
import { getHomepage } from "@/lib/server/catalog";
import { ParallaxFrame, Reveal, WordReveal } from "@/components/ui/motion";

export const revalidate = 60;
export const metadata: Metadata = { title: "About Us", description: "The story and design philosophy behind Zebella Designs.", alternates: { canonical: "/about" } };

export default async function AboutPage() {
  const { brandStory: s } = await getHomepage();
  return (
    <div>
      <section className="container-x pt-16 sm:pt-24">
        <p className="eyebrow">{s.eyebrow ?? "Our story"}</p>
        <h1 className="display mt-5 max-w-5xl font-light"><WordReveal text={s.heading ?? "About Zebella Designs"} /></h1>
      </section>
      <section className="container-x mt-16 grid gap-12 md:grid-cols-2 lg:gap-24">
        <ParallaxFrame className="aspect-[4/5] bg-cream" strength={6}><Image src={s.imageUrl || "/art/story.svg"} alt="" fill sizes="(min-width:768px) 45vw, 100vw" className="object-cover" /></ParallaxFrame>
        <div className="self-center">
          <Reveal><RichText className="text-xl leading-9 text-taupe-deep" html={s.body} /></Reveal>
          {!!s.points?.length && <dl className="mt-12 space-y-6">{s.points.map((p) => <Reveal key={p.title}><div className="border-t border-line pt-4"><dt className="font-serif text-2xl">{p.title}</dt><dd className="mt-1 text-taupe-deep">{p.text}</dd></div></Reveal>)}</dl>}
          <Link href="/shop" className="btn btn-solid mt-12">Shop the collection <span className="arrow">→</span></Link>
        </div>
      </section>
    </div>
  );
}
