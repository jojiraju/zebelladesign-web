import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Mail, MapPin, PackageSearch, Phone, Plus, RotateCcw, Truck } from "lucide-react";
import { RichText } from "@/components/ui/RichText";
import { ContactForm } from "@/components/pages/Forms";
import { ART } from "@/lib/art";
import { getSettings } from "@/lib/server/catalog";

export const revalidate = 60;
export const metadata: Metadata = { title: "Contact", description: "Get in touch with Zebella Designs.", alternates: { canonical: "/contact" } };

const card = "rounded-2xl border border-line bg-white shadow-[0_18px_40px_-34px_rgba(143,74,91,.6)]";

export default async function ContactPage() {
  const { contact, social, faq } = await getSettings();
  const socials = Object.entries(social).filter(([, v]) => !!v) as [string, string][];
  const cards = [
    contact.email && { icon: Mail, label: "Email us", value: contact.email, href: `mailto:${contact.email}`, note: "We reply within one working day" },
    contact.phone && { icon: Phone, label: "Call us", value: contact.phone, href: `tel:${contact.phone.replace(/\s/g, "")}`, note: contact.hours },
    contact.address && { icon: MapPin, label: "Visit the studio", value: contact.address, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address.replace(/\n/g, ", "))}`, note: "Open in Google Maps" },
    contact.hours && { icon: Clock, label: "Opening hours", value: contact.hours, note: "Closed on public holidays" },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href?: string; note?: string }[];

  return (
    <div className="container-x py-8 sm:py-14">
      {/* Header band */}
      <header className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-gold via-gold-deep to-wine text-ivory shadow-[0_30px_70px_-40px_rgba(143,74,91,.7)]">
        <div aria-hidden className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-ivory/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 h-60 w-60 rounded-full border border-ivory/20" />
        <div className="relative grid items-center gap-8 p-7 sm:p-12 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="eyebrow !text-ivory/85">We&apos;d love to hear from you</p>
            <h1 className="mt-4 font-serif text-5xl sm:text-7xl">Contact</h1>
            <p className="mt-4 max-w-md leading-7 text-ivory/85">Questions about a style, your size or an order? Our team is happy to help — send us a message and we&apos;ll take it from there.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#message" className="btn btn-light">Send a message <ArrowRight size={15} className="arrow" aria-hidden /></a>
              <Link href="/order-tracking" className="btn btn-outline-light">Track an order</Link>
            </div>
          </div>
          <div className="relative hidden aspect-[3/2] overflow-hidden rounded-2xl ring-1 ring-ivory/25 md:block"><Image src={ART.contact} alt="" fill priority sizes="40vw" className="object-cover" /></div>
        </div>
      </header>

      {/* Contact details */}
      {cards.length > 0 && (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ icon: Icon, label, value, href, note }) => {
            const body = (
              <>
                <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-blush to-rose-soft/60 text-gold-deep"><Icon size={20} strokeWidth={1.6} aria-hidden /></span>
                <span className="mt-4 block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-taupe-deep">{label}</span>
                <span className={`mt-1 block whitespace-pre-line font-serif leading-snug ${value.includes("@") ? "break-all text-lg" : "break-words text-xl"}`}>{value}</span>
                {note && <span className="mt-2 block text-xs text-taupe-deep">{note}</span>}
              </>
            );
            return (
              <li key={label}>
                {href
                  ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={`${card} block h-full p-6 transition hover:-translate-y-0.5 hover:border-gold`}>{body}</a>
                  : <div className={`${card} h-full p-6`}>{body}</div>}
              </li>
            );
          })}
        </ul>
      )}

      {/* Form + side column */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_22rem] lg:gap-10" id="message">
        <section className={`${card} p-6 sm:p-9`} aria-labelledby="send-h">
          <p className="eyebrow mb-3">Write to us</p>
          <h2 id="send-h" className="font-serif text-3xl sm:text-4xl">Send us a message</h2>
          <p className="mb-8 mt-2 text-taupe-deep">Fill in the form and we&apos;ll get back to you by email.</p>
          <ContactForm />
        </section>

        <aside className="space-y-6">
          <div className={`${card} p-6`}>
            <h3 className="font-serif text-2xl">Quick help</h3>
            <ul className="mt-4 divide-y divide-line">
              {[
                { icon: PackageSearch, text: "Track your order", href: "/order-tracking" },
                { icon: Truck, text: "Shipping policy", href: "/shipping-policy" },
                { icon: RotateCcw, text: "Returns & refunds", href: "/returns-policy" },
              ].map(({ icon: Icon, text, href }) => (
                <li key={href}><Link href={href} className="group flex items-center gap-3 py-3.5 text-sm transition hover:text-gold-deep"><Icon size={17} strokeWidth={1.6} className="text-gold-deep" aria-hidden />{text}<ArrowRight size={15} className="ml-auto text-taupe transition group-hover:translate-x-0.5" aria-hidden /></Link></li>
              ))}
            </ul>
          </div>
          {socials.length > 0 && (
            <div className={`${card} p-6`}>
              <h3 className="font-serif text-2xl">Follow along</h3>
              <p className="mt-1 text-sm text-taupe-deep">New collections, styling ideas and behind-the-scenes.</p>
              <ul className="mt-4 flex flex-wrap gap-2">{socials.map(([k, v]) => <li key={k}><a className="inline-flex rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition hover:border-gold hover:bg-blush" href={v} target="_blank" rel="noopener noreferrer">{k}</a></li>)}</ul>
            </div>
          )}
          <div className="relative hidden aspect-[4/5] overflow-hidden rounded-2xl lg:block">
            <Image src="/art/tile-signature.svg" alt="" fill sizes="22rem" className="object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-t from-espresso/70 via-transparent to-transparent" aria-hidden />
            <p className="absolute inset-x-0 bottom-0 p-6 font-serif text-2xl leading-snug text-ivory">Elegant dresses for every occasion — and here for every question.</p>
          </div>
        </aside>
      </div>

      {/* FAQ */}
      {faq.length > 0 && (
        <section className="mt-16 sm:mt-24" aria-labelledby="faq">
          <div className="mb-8 text-center"><p className="eyebrow justify-center">Good to know</p><h2 id="faq" className="mt-3 font-serif text-4xl sm:text-5xl">Frequently asked questions</h2></div>
          <div className="mx-auto max-w-3xl space-y-3">
            {faq.map((f, i) => (
              <details key={i} className={`${card} group px-6 py-1 open:border-gold/50 open:bg-blush/20`}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-serif text-xl">
                  {f.q}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blush text-gold-deep transition-transform group-open:rotate-45" aria-hidden><Plus size={16} /></span>
                </summary>
                <RichText className="pb-5 text-taupe-deep" html={f.a} />
              </details>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-taupe-deep">Can&apos;t find your answer? <a href="#message" className="underline">Send us a message</a>.</p>
        </section>
      )}
    </div>
  );
}
