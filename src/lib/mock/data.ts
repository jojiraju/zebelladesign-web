/**
 * Demo content shown while no backend is configured (NEXT_PUBLIC_API_URL unset). Built from specs.ts.
 * Nothing here is real inventory, customers or reviews — it exists to demo the storefront.
 */
import type { Banner, HomepageContent, StoreSettings, Testimonial } from "../content";
import { DEFAULT_SETTINGS } from "../content";
import type { Address, Category, Collection, Coupon, Order, Product, Variant } from "../types";
import { CATEGORY_DEFS, COLLECTION_DEFS, COLORS, PRODUCT_SPECS } from "./specs";
import { MOCK_POLICIES } from "./policies";
import PHOTOS from "./photos.json";

/** Slots that have a real/AI photo (managed by `npm run photos` / `npm run images`); everything else uses the SVG illustration. */
const photos = PHOTOS as Record<string, string>;
const productImg = (slug: string, n: number) => `/products/${slug}-${n}.${photos[`${slug}-${n}`] ?? "svg"}`;
const collectionImg = (slug: string, fallback: string) => (photos[`collection-${slug}`] ? `/art/collection-${slug}.${photos[`collection-${slug}`]}` : fallback);

const SIZES = ["S", "M", "L", "XL"];
const DAY = 86_400_000;
const NOW = Date.UTC(2026, 10, 1); // fixed so server and client agree

export const MOCK_COLLECTION_ART: Record<string, string> = {
  "christmas-collection": "/art/collection-christmas.svg",
  "top-bottom-sets": "/art/collection-2.svg",
  frocks: "/art/collection-3.svg",
  "salwar-sets": "/art/tile-best.svg",
  "festive-wear": "/art/tile-ethnic.svg",
  "signature-collection": "/art/tile-signature.svg",
};

export const MOCK_CATEGORIES: Category[] = CATEGORY_DEFS.map((c, i) => {
  const first = PRODUCT_SPECS.find((p) => p.cat === c.slug)!;
  return { id: c.slug, slug: c.slug, name: c.name, description: c.description, imageUrl: productImg(first.slug, 1), order: i, visible: true };
});

export const MOCK_COLLECTIONS: Collection[] = COLLECTION_DEFS.map((c, i) => ({
  id: c.slug, slug: c.slug, name: c.name, description: c.description, imageUrl: collectionImg(c.slug, MOCK_COLLECTION_ART[c.slug]), order: i, visible: true, featured: c.featured,
}));

const LENGTH: Record<string, string> = { anarkali: "48″", frock: "36″", salwar: "44″ (kurta)", cordset: "Top 20″ · Trouser 38″", gown: "54″" };
const PIECES: Record<string, string[]> = {
  anarkali: ["Anarkali", "Dupatta", "Bottom"], frock: ["Frock"], salwar: ["Kurta", "Salwar", "Dupatta"], cordset: ["Top", "Trousers"], gown: ["Gown"],
};
/** Structured product details (design, fabric, sizes, length, shipping, colours) in the same layout the client's reference site uses. */
function detailsHtml(p: (typeof PRODUCT_SPECS)[number]): string {
  const li = (a: string[]) => `<ul>${a.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  const colours = p.colors.map((c) => COLORS[c].name).join(", ");
  return [
    `<h3>Design details</h3>${li([p.desc])}`,
    `<h3>Fabric details</h3>${li([...PIECES[p.sil].map((x, i) => `${x}: ${i === 0 ? p.fabric : "Matching " + p.fabric.toLowerCase()}`), "Lined for comfort"])}`,
    `<h3>Sizes available</h3>${li(["S: 34″ bust", "M: 36″", "L: 38″", "XL: 40″", "Need a different fit? Custom sizing on request."])}`,
    `<h3>Length</h3>${li([`${LENGTH[p.sil]} (can be customised upon request)`])}`,
    `<h3>Shipping</h3>${li(["Free shipping across India on orders above ₹2,999", "Dispatched in 2–3 business days"])}`,
    `<h3>Colours</h3>${li([colours])}`,
  ].join("");
}

export const MOCK_PRODUCTS: Product[] = PRODUCT_SPECS.map((p, i) => {
  const variants: Variant[] = p.colors.flatMap((ck, ci) =>
    SIZES.map((size, si) => {
      const seed = (i * 7 + ci * 5 + si * 3) % 11;
      // One product is fully sold out, a few sizes are out of stock — so every state can be demoed.
      const stock = p.slug === "polka-frock-navy" ? 0 : seed === 0 ? 0 : 4 + seed;
      return { id: `${ck}-${size.toLowerCase()}`, sku: `${p.code}-${ck.toUpperCase()}-${size}`, size, color: COLORS[ck].name, colorHex: COLORS[ck].hex, stock, reserved: 0 };
    }),
  );
  return {
    id: p.slug, slug: p.slug, name: p.name, sku: p.code,
    description: detailsHtml(p), fabric: p.fabric, care: "Dry clean recommended. Steam iron on low heat. Store on a padded hanger.",
    categoryId: p.cat, categorySlug: p.cat, collectionIds: p.cols,
    images: [1, 2].map((n) => ({ url: productImg(p.slug, n), alt: `${p.name} — view ${n}` })),
    price: p.mrp * 100, salePrice: p.sale ? p.sale * 100 : null, variants,
    lowStockThreshold: 3, status: "published",
    featured: p.flags.includes("f"), newArrival: p.flags.includes("n"), bestSeller: p.flags.includes("b"), soldCount: p.sold,
    sizeGuide: "<p>Bust: S 34&Prime; · M 36&Prime; · L 38&Prime; · XL 40&Prime;. Length varies by style. Need help? Message us for a custom fit.</p>",
    seo: { title: `${p.name} | Zebella Designs`, description: p.desc },
    createdAt: NOW - i * 2 * DAY, updatedAt: NOW - i * DAY,
  };
});

export const MOCK_SETTINGS: StoreSettings = {
  ...DEFAULT_SETTINGS,
  announcements: [
    { id: "a1", text: "Free shipping on orders above ₹2,999", href: "/shop" },
    { id: "a2", text: "The Christmas Collection is here", href: "/collections/christmas-collection" },
    { id: "a3", text: "Handcrafted just for you", href: "/about" },
  ],
  contact: { email: "hello@zebelladesigns.example", phone: "+91 90000 00000", address: "Zebella Designs Studio\n12, Fashion Street, Your City, India", hours: "Mon–Sat, 10:30 am – 7:00 pm" },
  social: { instagram: "https://www.instagram.com/", facebook: "https://www.facebook.com/", youtube: "https://www.youtube.com/" },
  footer: { description: "Contemporary ethnic and festive wear, designed with care and made to be remembered." },
  newsletter: { enabled: true, heading: "Join the Zebella list", consent: "By subscribing you agree to receive occasional emails about new collections. Unsubscribe anytime." },
  policies: MOCK_POLICIES,
  faq: [
    { q: "How do I find my size?", a: "<p>Use the size guide on each product page. For a custom fit, message us with your measurements.</p>" },
    { q: "How long does delivery take?", a: "<p>Standard delivery takes 5–8 business days across India.</p>" },
    { q: "Can I return or exchange an item?", a: "<p>Yes — unworn items with tags can be returned within 7 days of delivery.</p>" },
    { q: "How do I track my order?", a: "<p>Use the Track Order page with your order ID and email, or check My Account.</p>" },
    { q: "Do you offer custom stitching?", a: "<p>Selected styles can be customised. Contact us and we will confirm timelines and pricing.</p>" },
  ],
};

export const MOCK_HOMEPAGE: HomepageContent = {
  hero: { textInImage: true, imageUrl: "/art/hero-banner.webp", mobileImageUrl: "/art/hero-banner-mobile.webp", eyebrow: "Zebella Designs", heading: "Designed to be remembered", ctaLabel: "Shop the Collection", ctaHref: "/shop", secondaryLabel: "New Arrivals", secondaryHref: "/shop?sort=newest" },
  featuredCollections: [
    { title: "New Arrivals", subtitle: "Just landed", imageUrl: "/art/tile-new.svg", href: "/shop?sort=newest", size: "large" },
    { title: "Christmas Collection", imageUrl: collectionImg("christmas-collection", "/art/collection-christmas.svg"), href: "/collections/christmas-collection", size: "tall" },
    { title: "Festive Wear", imageUrl: "/art/tile-ethnic.svg", href: "/collections/festive-wear", size: "wide" },
    { title: "Signature Collection", imageUrl: "/art/tile-signature.svg", href: "/collections/signature-collection", size: "small" },
    { title: "Best Sellers", imageUrl: "/art/tile-best.svg", href: "/shop?sort=popular", size: "small" },
  ],
  featuredProductIds: PRODUCT_SPECS.filter((p) => p.flags.includes("f") || p.flags.includes("b")).slice(0, 8).map((p) => p.slug),
  brandStory: {
    eyebrow: "Our Story",
    heading: "Contemporary Indian clothing, considered in every detail",
    body: "Zebella Designs creates women's ethnic and contemporary wear for the moments that matter — from everyday salwar sets to festive anarkalis and gowns. Every piece is designed in-house, finished by hand and made to be worn again and again.",
    points: [
      { title: "Designed in-house", text: "Original silhouettes drawn and fitted by our design team." },
      { title: "Finished by hand", text: "Trims, hems and embroidery completed with care." },
      { title: "Made to be loved", text: "Soft fabrics, true colours and a fit that flatters." },
    ],
    imageUrl: "/art/story.svg",
  },
  // Prefer products that have a real photo, so the gallery looks like a real feed.
  social: [...PRODUCT_SPECS].sort((a, b) => Number(!!photos[`${b.slug}-1`]) - Number(!!photos[`${a.slug}-1`])).slice(0, 6).map((p) => ({ imageUrl: productImg(p.slug, 1), href: `/products/${p.slug}`, alt: `${p.name}, styled` })),
  editorialMessage: "Designed to be remembered.",
};

export const MOCK_BANNERS: Banner[] = [
  { id: "b1", heading: "The Christmas Collection", description: "Velvet frocks, festive gowns and sets in red, green and gold.", ctaLabel: "Shop Christmas", href: "/collections/christmas-collection", desktopImage: "/art/banner.svg", status: "published", order: 0 },
];

export const MOCK_TESTIMONIALS: Testimonial[] = [
  { id: "t1", name: "Ananya S.", location: "Bengaluru", quote: "The anarkali fits beautifully and the colour is exactly like the photos. Got so many compliments at the wedding.", verified: true, status: "published" },
  { id: "t2", name: "Meera K.", location: "Hyderabad", quote: "Lovely quality for the price. The cotton salwar set is my new everyday favourite.", verified: true, status: "published" },
  { id: "t3", name: "Priya R.", location: "Chennai", quote: "Ordered the Christmas frock for my daughter — the velvet is soft and the bow is adorable.", verified: true, status: "published" },
  { id: "t4", name: "Sana A.", location: "Mumbai", quote: "Fast delivery and beautiful packaging. The co-ord set is so comfortable.", verified: true, status: "published" },
  { id: "t5", name: "Divya M.", location: "Kochi", quote: "The gown looked stunning at my cousin's reception. Fits true to size.", verified: true, status: "published" },
  { id: "t6", name: "Ishita P.", location: "Pune", quote: "Great customer service — they helped me pick the right size.", verified: true, status: "published" },
];

export const MOCK_COUPON: Coupon = { id: "welcome10", code: "WELCOME10", type: "percent", value: 10, minOrder: 100000, usedCount: 0, active: true };

// ---- demo orders (shown for the demo account) ----
const ADDRESS: Address = { fullName: "Demo Customer", phone: "9000000000", line1: "12, Fashion Street", line2: "Near City Mall", city: "Bengaluru", state: "Karnataka", pincode: "560001", country: "India" };

function orderOf(id: string, slugs: [string, string, number][], days: number, status: Pick<Order, "paymentStatus" | "fulfillmentStatus">, tracking = false): Order {
  const items = slugs.map(([slug, vid, qty]) => {
    const p = MOCK_PRODUCTS.find((x) => x.slug === slug)!;
    const v = p.variants.find((x) => x.id === vid) ?? p.variants[0];
    const unit = p.salePrice ?? p.price;
    return { productId: p.id, variantId: v.id, name: p.name, sku: v.sku, image: p.images[0].url, size: v.size, color: v.color, quantity: qty, unitPrice: unit, listPrice: p.price, lineTotal: unit * qty };
  });
  const subtotal = items.reduce((n, i) => n + i.lineTotal, 0);
  const shipping = subtotal >= 299900 ? 0 : 9900;
  const total = subtotal + shipping;
  const at = NOW - days * DAY;
  return {
    id, userId: "demo-user", email: "demo@example.com", phone: ADDRESS.phone, shippingAddress: ADDRESS, billingAddress: ADDRESS, items,
    subtotal, discount: 0, shipping, taxIncluded: Math.round(total - total / 1.05), total, currency: "INR", shippingMethodId: "standard",
    paymentProvider: "razorpay", paymentMode: "test", ...status, paidAt: at,
    tracking: tracking ? { carrier: "Demo Courier", trackingNumber: "DEMO1234567890", url: "https://example.com/track/DEMO1234567890", shippedAt: at + DAY } : undefined,
    createdAt: at, updatedAt: at,
  };
}

export const MOCK_ORDERS: Order[] = [
  orderOf("ZB-DEMO0002", [["christmas-velvet-frock-red", "red-m", 1], ["bow-frock-black", "black-s", 1]], 2, { paymentStatus: "paid", fulfillmentStatus: "processing" }),
  orderOf("ZB-DEMO0001", [["panel-anarkali-leaf-green", "leaf-m", 1]], 18, { paymentStatus: "paid", fulfillmentStatus: "delivered" }, true),
];
