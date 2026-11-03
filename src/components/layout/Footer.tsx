import Link from "next/link";
import { ArrowUp, Clock, Mail, MapPin, Phone } from "lucide-react";
import { LogoFull } from "@/components/ui/Logo";
import { NewsletterForm } from "./NewsletterForm";
import type { StoreSettings } from "@/lib/content";
import type { Category } from "@/lib/types";

/** Simple brand glyphs (lucide no longer ships brand icons). */
const GLYPH: Record<string, React.ReactNode> = {
  instagram: <><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".6" fill="currentColor" /></>,
  facebook: <path d="M14 8.5h2.5V5H14c-2.2 0-3.5 1.4-3.5 3.6V11H8v3.4h2.5V21H14v-6.6h2.4l.5-3.4H14V9.1c0-.4.2-.6.6-.6Z" />,
  youtube: <><rect x="2.5" y="6" width="19" height="12" rx="3.5" /><path d="m10.5 9.5 4 2.5-4 2.5Z" fill="currentColor" /></>,
  pinterest: <><circle cx="12" cy="12" r="8.5" /><path d="m10.6 19.800 1.700-6.800M9.300 11.200c0-2.900 4.700-3.200 5 -.2.300 2.400-2.200 4.400-3.700 3" /></>,
};

const link = "group/l inline-flex items-center text-ivory/75 transition-colors duration-300 hover:text-white";
const arrow = "h-px w-0 bg-rose-soft transition-all duration-300 group-hover/l:mr-2 group-hover/l:w-3";

function Heading({ children }: { children: React.ReactNode }) {
  return <p className="mb-6 font-serif text-xl text-ivory">{children}<span aria-hidden className="mt-2 block h-px w-8 bg-gradient-to-r from-rose-soft to-transparent" /></p>;
}

export function Footer({ settings, categories }: { settings: StoreSettings; categories: Category[] }) {
  const { contact, social } = settings;
  const socials = Object.entries(social).filter(([, v]) => !!v) as [string, string][];
  const row = "flex items-start gap-3";
  const ico = "mt-0.5 shrink-0 text-rose-soft";

  return (
    <footer className="relative mt-40 bg-espresso text-ivory/90">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-wine/30 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-rose-soft/10 blur-3xl" />
      </div>

      {/* Newsletter band */}
      {settings.newsletter.enabled && (
        <div className="container-x relative -translate-y-16">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-gold via-gold-deep to-wine px-6 py-10 shadow-[0_40px_80px_-40px_rgba(143,74,91,.8)] sm:px-12 sm:py-14">
            <div aria-hidden className="fx-drift pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-ivory/10" />
            <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full border border-ivory/20" />
            <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
              <div>
                <p className="eyebrow !text-ivory/85">Stay in style</p>
                <h2 className="mt-3 font-serif text-3xl leading-tight text-ivory sm:text-5xl">{settings.newsletter.heading || "Join the Zebella list"}</h2>
                <p className="mt-3 max-w-md text-ivory/80">First look at new collections, festive edits and members-only offers.</p>
              </div>
              <NewsletterForm consent={settings.newsletter.consent} />
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <div className={`container-x relative grid gap-12 pb-16 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-14 ${settings.newsletter.enabled ? "-mt-2" : "pt-20"}`}>
        <div>
          <div className="w-56"><LogoFull light /></div>
          {settings.footer.description && <p className="mt-6 max-w-xs leading-7 text-ivory/70">{settings.footer.description}</p>}
          {socials.length > 0 && (
            <ul className="mt-7 flex gap-3">
              {socials.map(([k, v]) => (
                <li key={k}>
                  <a href={v} target="_blank" rel="noopener noreferrer" aria-label={k} className="grid h-11 w-11 place-items-center rounded-full border border-ivory/20 text-ivory/80 transition duration-300 hover:-translate-y-1 hover:border-rose-soft hover:bg-rose-soft hover:text-espresso">
                    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{GLYPH[k] ?? <circle cx="12" cy="12" r="4" />}</svg>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Shop"><Heading>Shop</Heading>
          <ul className="space-y-3 text-sm">
            <li><Link className={link} href="/shop?sort=newest"><span aria-hidden className={arrow} />New Arrivals</Link></li>
            <li><Link className={link} href="/collections"><span aria-hidden className={arrow} />Collections</Link></li>
            {categories.slice(0, 5).map((c) => <li key={c.id}><Link className={link} href={`/categories/${c.slug}`}><span aria-hidden className={arrow} />{c.name}</Link></li>)}
          </ul>
        </nav>

        <nav aria-label="Customer service"><Heading>Customer care</Heading>
          <ul className="space-y-3 text-sm">
            {[["/order-tracking", "Track an order"], ["/shipping-policy", "Shipping policy"], ["/returns-policy", "Returns & refunds"], ["/contact", "Contact us"], ["/account", "My account"]].map(([href, label]) => (
              <li key={href}><Link className={link} href={href}><span aria-hidden className={arrow} />{label}</Link></li>
            ))}
          </ul>
        </nav>

        <div><Heading>Visit &amp; contact</Heading>
          <ul className="space-y-4 text-sm text-ivory/75">
            {contact.email && <li className={row}><Mail size={16} className={ico} aria-hidden /><a className="break-all transition-colors hover:text-white" href={`mailto:${contact.email}`}>{contact.email}</a></li>}
            {contact.phone && <li className={row}><Phone size={16} className={ico} aria-hidden /><a className="transition-colors hover:text-white" href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a></li>}
            {contact.address && <li className={row}><MapPin size={16} className={ico} aria-hidden /><span className="whitespace-pre-line">{contact.address}</span></li>}
            {contact.hours && <li className={row}><Clock size={16} className={ico} aria-hidden /><span>{contact.hours}</span></li>}
            {!contact.email && !contact.phone && !contact.address && <li><Link className={link} href="/contact">Send us a message</Link></li>}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-ivory/10">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-6 text-xs text-ivory/60 sm:flex-row">
          <p>© {new Date().getFullYear()} Zebella Designs. All rights reserved.</p>
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <li><Link className="link-underline" href="/privacy-policy">Privacy</Link></li>
            <li><Link className="link-underline" href="/terms">Terms</Link></li>
            <li><Link className="link-underline" href="/shipping-policy">Shipping</Link></li>
            <li><a href="#top" className="inline-flex items-center gap-2 rounded-full border border-ivory/20 px-4 py-2 uppercase tracking-[0.16em] transition hover:border-rose-soft hover:text-white">Back to top <ArrowUp size={13} aria-hidden /></a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
