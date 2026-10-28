import type { Coupon, Product, Variant } from "@/lib/types";

export const variant = (over: Partial<Variant> = {}): Variant => ({
  id: "m-ivory", sku: "ZB-001-M-IVORY", size: "M", color: "Ivory", stock: 5, reserved: 0, ...over,
});

export const product = (over: Partial<Product> = {}): Product => ({
  id: "p1", slug: "ivory-kurta", name: "Ivory Kurta Set", sku: "ZB-001", description: "d",
  categoryId: "c1", categorySlug: "kurta-sets", collectionIds: ["col1"], images: [{ url: "/x.jpg" }],
  price: 500000, salePrice: null, variants: [variant(), variant({ id: "l-ivory", size: "L", sku: "ZB-001-L-IVORY" })],
  lowStockThreshold: 2, status: "published", featured: false, newArrival: false, bestSeller: false, soldCount: 0, ...over,
});

export const coupon = (over: Partial<Coupon> = {}): Coupon => ({
  id: "cp1", code: "WELCOME10", type: "percent", value: 10, usedCount: 0, active: true, ...over,
});
