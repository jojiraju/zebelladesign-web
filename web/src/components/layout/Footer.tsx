import Link from "next/link";
import { LogoFull } from "@/components/ui/Logo";
import { NewsletterForm } from "./NewsletterForm";
import type { StoreSettings } from "@/lib/content";
import type { Category } from "@/lib/types";

export function Footer({ settings, categories }: { settings: StoreSettings; categories: Category[] }) {
  const col = "space-y-3 text-sm";
  const h = "eyebrow mb-5 !text-gold";
  const { contact, social } = settings;
  const socials = Object.entries(social).filter(([, v]) => !!v) as [string, string][];
  return (
    <footer className="mt-32 bg-espresso text-ivory/90">
      <div className="container-x grid gap-14 py-20 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.4fr]">
        <div>
          <div className="w-56"><LogoFull light /></div>
          {settings.footer.description && <p className="mt-6 max-w-xs text-sm text-ivory/70">{settings.footer.description}</p>}
          {socials.length > 0 && (
            <ul className="mt-6 flex gap-5 text-xs uppercase tracking-[0.2em]">
              {socials.map(([k, v]) => <li key={k}><a className="link-underline" href={v} target="_blank" rel="noopener noreferrer">{k}</a></li>)}
            </ul>
          )}
        </div>
        <nav aria-label="Shop"><p className={h}>Shop</p>
          <ul className={col}>
            <li><Link className="link-underline" href="/shop?sort=newest">New Arrivals</Link></li>
            <li><Link className="link-underline" href="/collections">Collections</Link></li>
            {categories.slice(0, 5).map((c) => <li key={c.id}><Link className="link-underline" href={`/categories/${c.slug}`}>{c.name}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label="Customer service"><p className={h}>Customer Care</p>
          <ul className={col}>
            <li><Link className="link-underline" href="/order-tracking">Track an order</Link></li>
            <li><Link className="link-underline" href="/shipping-policy">Shipping policy</Link></li>
            <li><Link className="link-underline" href="/returns-policy">Returns &amp; refunds</Link></li>
            <li><Link className="link-underline" href="/contact">Contact us</Link></li>
            <li><Link className="link-underline" href="/account">My account</Link></li>
          </ul>
        </nav>
        <div><p className={h}>Contact</p>
          <ul className={`${col} text-ivory/70`}>
            {contact.email && <li><a className="link-underline" href={`mailto:${contact.email}`}>{contact.email}</a></li>}
            {contact.phone && <li><a className="link-underline" href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a></li>}
            {contact.address && <li className="whitespace-pre-line">{contact.address}</li>}
            {contact.hours && <li>{contact.hours}</li>}
            {!contact.email && !contact.phone && !contact.address && <li><Link className="link-underline" href="/contact">Send us a message</Link></li>}
          </ul>
        </div>
        {settings.newsletter.enabled && (
          <div><p className={h}>{settings.newsletter.heading || "Join the list"}</p>
            <NewsletterForm dark consent={settings.newsletter.consent} />
          </div>
        )}
      </div>
      <div className="border-t border-ivory/15">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-xs text-ivory/60 sm:flex-row">
          <p>© {new Date().getFullYear()} Zebella Designs. All rights reserved.</p>
          <ul className="flex gap-6">
            <li><Link className="link-underline" href="/privacy-policy">Privacy</Link></li>
            <li><Link className="link-underline" href="/terms">Terms</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
