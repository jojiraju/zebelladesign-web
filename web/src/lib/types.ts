/**
 * Shared domain types for Zebella Designs.
 * All monetary values are INTEGER PAISE (1 INR = 100 paise) to avoid float errors.
 * Timestamps crossing the server/client boundary are ISO strings or epoch millis.
 */

export type Paise = number;

export interface ProductImage {
  url: string;
  path?: string; // Firebase Storage path, when uploaded through the CMS
  alt?: string;
}

export interface Variant {
  id: string; // stable id, e.g. "m-ivory" or "default"
  sku: string;
  size?: string;
  color?: string;
  colorHex?: string;
  stock: number; // physical units on hand
  reserved: number; // units held by pending checkouts
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  sku: string;
  description: string;
  fabric?: string;
  care?: string;
  categoryId: string;
  categorySlug: string;
  collectionIds: string[];
  images: ProductImage[];
  videoUrl?: string;
  price: Paise; // regular (MRP) price
  salePrice?: Paise | null; // active selling price when lower than price
  variants: Variant[];
  lowStockThreshold: number;
  status: "draft" | "published" | "archived";
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  soldCount: number;
  sizeGuide?: string;
  seo?: { title?: string; description?: string };
  isDemo?: boolean; // development seed data — never real inventory
  createdAt?: number;
  updatedAt?: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  order: number;
  visible: boolean;
  seo?: { title?: string; description?: string };
}

export interface Collection extends Category {
  featured?: boolean;
}

export type CouponType = "percent" | "fixed";

export interface Coupon {
  id: string;
  code: string; // stored upper-case
  type: CouponType;
  value: number; // percent (0-100) or paise
  minOrder?: Paise;
  maxDiscount?: Paise;
  startsAt?: number | null;
  endsAt?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  perUserLimit?: number | null;
  productIds?: string[];
  collectionIds?: string[];
  active: boolean;
}

export interface CartItemInput {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface PricedLine {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  sku: string;
  image?: string;
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: Paise; // effective selling price
  listPrice: Paise; // MRP
  lineTotal: Paise;
  collectionIds: string[];
  available: number;
  issue?: string; // set when the line cannot be fulfilled as requested
}

export interface Quote {
  lines: PricedLine[];
  subtotal: Paise; // sum of lineTotal
  discount: Paise;
  couponCode?: string;
  couponError?: string;
  shipping: Paise;
  taxIncluded: Paise; // informational: GST already inside prices
  total: Paise;
  freeShippingRemaining?: Paise;
  valid: boolean; // false when any line has an issue
}

export interface ShippingMethod {
  id: string;
  label: string;
  fee: Paise;
  freeAbove?: Paise;
  eta: string;
}

export interface Address {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export type PaymentStatus =
  | "created"
  | "pending"
  | "paid"
  | "failed"
  | "refund_pending"
  | "refunded";

export type FulfillmentStatus =
  | "awaiting_payment"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  productId: string;
  variantId: string;
  name: string;
  sku: string;
  image?: string;
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: Paise;
  listPrice: Paise;
  lineTotal: Paise;
}

export interface Order {
  id: string;
  userId: string;
  email: string;
  phone: string;
  shippingAddress: Address;
  billingAddress: Address;
  items: OrderItem[];
  subtotal: Paise;
  discount: Paise;
  couponCode?: string;
  shipping: Paise;
  taxIncluded: Paise;
  total: Paise;
  currency: "INR";
  shippingMethodId: string;
  paymentProvider: "razorpay";
  paymentMode: "test" | "live";
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  providerOrderId?: string;
  providerPaymentId?: string;
  paidAt?: number | null;
  tracking?: { carrier: string; trackingNumber: string; url?: string; shippedAt: number };
  refund?: { id: string; amount: Paise; status: string; at: number; reason?: string };
  notes?: { text: string; by: string; at: number }[];
  isDemo?: boolean;
  createdAt: number;
  updatedAt: number;
}

export type Role = "admin" | "editor" | "fulfillment";
