import type { Metadata } from "next";
import { RichText } from "@/components/ui/RichText";
import { ContactForm } from "@/components/pages/Forms";
import { ListingHeader } from "@/components/shop/Listing";
import { getSettings } from "@/lib/server/catalog";

export const revalidate = 60;
export const metadata: Metadata = { title: "Contact", description: "Get in touch with Zebella Designs.", alternates: { canonical: "/contact" } };

export default async function ContactPage() {
  const { contact, social, faq } = await getSettings();
  const socials = Object.entries(social).filter(([, v]) => !!v) as [string, string][];
  const hasDetails = contact.email || contact.phone || contact.address || contact.hours;
  return (
    <div className="container-x py-12 sm:py-20">
      <ListingHeader eyebrow="We'd love to hear from you" title="Contact" />
      <div className="mt-14 grid gap-16 lg:grid-cols-[1fr_24rem]">
        <ContactForm />
        <aside className="space-y-6 text-sm">
          {hasDetails ? (
            <>
              {contact.email && <div><p className="label">Email</p><a className="link-underline" href={`mailto:${contact.email}`}>{contact.email}</a></div>}
              {contact.phone && <div><p className="label">Phone</p><a className="link-underline" href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a></div>}
              {contact.address && <div><p className="label">Studio</p><p className="whitespace-pre-line">{contact.address}</p></div>}
              {contact.hours && <div><p className="label">Hours</p><p>{contact.hours}</p></div>}
            </>
          ) : <p className="text-taupe-deep">Use the form and we&apos;ll reply by email.</p>}
          {socials.length > 0 && <div><p className="label">Follow</p><ul className="flex gap-4">{socials.map(([k, v]) => <li key={k}><a className="link-underline capitalize" href={v} target="_blank" rel="noopener noreferrer">{k}</a></li>)}</ul></div>}
        </aside>
      </div>
      {faq.length > 0 && (
        <section className="mt-24 max-w-3xl" aria-labelledby="faq">
          <h2 id="faq" className="h-section mb-8 font-serif">Frequently asked questions</h2>
          {faq.map((f, i) => (
            <details key={i} className="group border-t border-line py-5 last:border-b">
              <summary className="flex cursor-pointer list-none items-center justify-between font-serif text-xl">{f.q}<span className="transition-transform group-open:rotate-45" aria-hidden>+</span></summary>
              <RichText className="mt-3 text-taupe-deep" html={f.a} />
            </details>
          ))}
        </section>
      )}
    </div>
  );
}
