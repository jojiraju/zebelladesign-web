// Development seed data. EVERY seeded product is flagged isDemo:true and uses locally generated placeholder art.
//   node scripts/seed.mjs            -> add demo categories, collections, products, settings (skips existing)
//   node scripts/seed.mjs --remove   -> delete all demo products (isDemo) again
// Demo products are not purchasable unless ALLOW_DEMO_PURCHASES=true AND Razorpay is in TEST mode.
import { adminApp } from "./_admin.mjs";

const { db, projectId } = adminApp();
const remove = process.argv.includes("--remove");

if (process.env.RAZORPAY_KEY_ID?.startsWith("rzp_live_") && !process.argv.includes("--i-know-this-is-live")) {
  console.error("Refusing to seed: a LIVE Razorpay key is configured. Demo data must never mix with a live store.");
  process.exit(1);
}

if (remove) {
  const snap = await db.collection("products").where("isDemo", "==", true).get();
  await Promise.all(snap.docs.map((d) => d.ref.delete()));
  console.log(`Removed ${snap.size} demo products from ${projectId}.`);
  process.exit(0);
}

const now = Date.now();
const cats = [
  { slug: "kurta-sets", name: "Kurta Sets", description: "Tailored kurta sets for every occasion.", order: 1 },
  { slug: "sarees", name: "Sarees", description: "Drapes with a contemporary sensibility.", order: 2 },
  { slug: "lehengas", name: "Lehengas", description: "Statement festive silhouettes.", order: 3 },
];
const colls = [
  { slug: "festive-wear", name: "Festive Wear", description: "Dressed for celebration.", order: 1, imageUrl: "/art/tile-festive.svg" },
  { slug: "designer-ethnic-wear", name: "Designer Ethnic Wear", description: "Considered ethnic design.", order: 2, imageUrl: "/art/tile-ethnic.svg" },
  { slug: "signature-collection", name: "Signature Collection", description: "The pieces that define Zebella.", order: 3, imageUrl: "/art/tile-signature.svg" },
];
for (const c of cats) await db.collection("categories").doc(c.slug).set({ ...c, visible: true, createdAt: now, updatedAt: now }, { merge: true });
for (const c of colls) await db.collection("collections").doc(c.slug).set({ ...c, visible: true, featured: true, createdAt: now, updatedAt: now }, { merge: true });

const demo = [
  ["Ivory Chanderi Kurta Set", "kurta-sets", 1, ["festive-wear"], 1299900, 999900, "Ivory", "#EFE7DC"],
  ["Wine Silk Anarkali", "kurta-sets", 2, ["festive-wear", "signature-collection"], 1899900, null, "Wine", "#7A3B45"],
  ["Sage Cotton Straight Set", "kurta-sets", 3, ["designer-ethnic-wear"], 849900, null, "Sage", "#9AA58A"],
  ["Rose Organza Saree", "sarees", 4, ["festive-wear"], 1599900, 1299900, "Rose", "#C9918A"],
  ["Navy Embroidered Lehenga", "lehengas", 5, ["signature-collection"], 3499900, null, "Navy", "#3B4A63"],
  ["Blush Tissue Saree", "sarees", 6, ["signature-collection", "designer-ethnic-wear"], 2199900, null, "Blush", "#E8B9C2"],
];
let n = 0;
for (const [name, cat, i, cl, price, sale, color, hex] of demo) {
  const slug = `demo-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
  const variants = ["S", "M", "L", "XL"].map((size) => ({ id: `${size.toLowerCase()}-${color.toLowerCase()}`, sku: `DEMO-${i}-${size}`, size, color, colorHex: hex, stock: 5, reserved: 0 }));
  await db.collection("products").doc(slug).set({
    name, slug, sku: `DEMO-${i}`, description: "DEMO PRODUCT — development seed data. Replace with your own designs from the CMS.",
    fabric: "Demo fabric description.", care: "Demo care instructions.", categoryId: cat, categorySlug: cat,
    collectionIds: cl, images: [{ url: `/art/product-${i}-a.svg`, alt: name }, { url: `/art/product-${i}-b.svg`, alt: `${name} fabric detail` }],
    price, salePrice: sale, variants, lowStockThreshold: 2, status: "published", featured: i <= 4, newArrival: i % 2 === 1, bestSeller: i === 2,
    soldCount: 0, isDemo: true, createdAt: now - i * 1000, updatedAt: now,
  }, { merge: true });
  n++;
}

const settings = await db.collection("settings").doc("store").get();
if (!settings.exists) {
  await db.collection("settings").doc("store").set({
    announcements: [{ id: "a1", text: "New collection now live" }, { id: "a2", text: "Complimentary shipping on eligible orders" }],
    shippingMethods: [{ id: "standard", label: "Standard Delivery", fee: 9900, freeAbove: 299900, eta: "5–8 business days" }],
    taxInclusiveRatePercent: 5, contact: {}, social: {}, footer: {},
    newsletter: { enabled: true, heading: "Join the Zebella list", consent: "By subscribing you agree to receive occasional emails about new collections. Unsubscribe anytime." },
    policies: {}, faq: [], pincodeCheck: { enabled: false }, updatedAt: now,
  });
}
console.log(`Seeded ${cats.length} categories, ${colls.length} collections and ${n} DEMO products into ${projectId}. Remove with: node scripts/seed.mjs --remove`);
