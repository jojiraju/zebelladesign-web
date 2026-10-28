import type { ShippingMethod } from "./types";

/** Shapes of CMS-managed documents. Every field is optional so the storefront renders with an empty database. */

export interface Announcement {
  id: string;
  text: string;
  href?: string;
}

export interface StoreSettings {
  announcements: Announcement[];
  shippingMethods: ShippingMethod[];
  taxInclusiveRatePercent: number;
  contact: { email?: string; phone?: string; address?: string; hours?: string };
  social: { instagram?: string; facebook?: string; pinterest?: string; youtube?: string };
  footer: { description?: string };
  newsletter: { enabled: boolean; heading?: string; consent?: string };
  policies: { shipping?: string; returns?: string; privacy?: string; terms?: string };
  faq: { q: string; a: string }[];
  pincodeCheck?: { enabled: boolean; note?: string };
}

export const DEFAULT_SETTINGS: StoreSettings = {
  announcements: [],
  shippingMethods: [
    { id: "standard", label: "Standard Delivery", fee: 9900, freeAbove: 299900, eta: "5–8 business days" },
  ],
  taxInclusiveRatePercent: 5,
  contact: {},
  social: {},
  footer: {},
  newsletter: { enabled: true, heading: "Join the Zebella list", consent: "By subscribing you agree to receive occasional emails about new collections. Unsubscribe anytime." },
  policies: {},
  faq: [],
};

export interface HeroSlide {
  imageUrl?: string;
  mobileImageUrl?: string;
  eyebrow?: string;
  heading: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export interface FeaturedTile {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  href: string;
  size?: "large" | "tall" | "wide" | "small";
}

export interface HomepageContent {
  hero: HeroSlide;
  featuredCollections: FeaturedTile[];
  featuredProductIds: string[];
  brandStory: { eyebrow?: string; heading?: string; body?: string; imageUrl?: string; points?: { title: string; text: string }[] };
  social: { imageUrl: string; href: string; alt?: string }[];
  editorialMessage?: string;
}

export const DEFAULT_HOMEPAGE: HomepageContent = {
  hero: {
    eyebrow: "The Edit",
    heading: "Designed to be remembered",
    ctaLabel: "Shop the Collection",
    ctaHref: "/shop",
    secondaryLabel: "New Arrivals",
    secondaryHref: "/shop?sort=newest",
  },
  featuredCollections: [],
  featuredProductIds: [],
  brandStory: {
    eyebrow: "Our Story",
    heading: "Contemporary Indian clothing, considered in every detail",
    body: "Zebella Designs creates women's ethnic and contemporary wear for the moments that matter. Edit this story from the CMS.",
  },
  social: [],
};

export interface Banner {
  id: string;
  heading: string;
  description?: string;
  ctaLabel?: string;
  href?: string;
  desktopImage?: string;
  mobileImage?: string;
  status: "draft" | "published";
  startsAt?: number | null;
  endsAt?: number | null;
  order?: number;
}

export interface Testimonial {
  id: string;
  name: string;
  quote: string;
  location?: string;
  verified: boolean;
  status: "draft" | "published";
}
