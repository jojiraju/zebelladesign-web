import "server-only";
import { randomBytes } from "node:crypto";
import { FieldValue, type DocumentReference, type Transaction } from "firebase-admin/firestore";
import { adminDb } from "./admin";
import { HttpError } from "./http";
import { serialize } from "./serialize";
import { buildQuote } from "../commerce/pricing";
import { commitStock, releaseStock, reserveStock, restoreStock, type StockLine } from "../commerce/inventory";
import { canTransitionFulfillment } from "../commerce/order-status";
import { DEFAULT_SETTINGS, type StoreSettings } from "../content";
import { paymentProvider } from "../payments/razorpay";
import type { CartItemInput, Coupon, Order, OrderItem, Product, Quote } from "../types";
import type { CheckoutRequest } from "../validation";

/** How long stock is held for a pending checkout. */
export const RESERVATION_MINUTES = 30;

const db = () => adminDb();

/** Demo (seed) products are purchasable only in Razorpay TEST mode with an explicit opt-in. Never in live mode. */
export const demoPurchasesAllowed = () => process.env.ALLOW_DEMO_PURCHASES === "true" && paymentProvider.mode() === "test";

export async function readSettings(): Promise<StoreSettings> {
  const s = await db().collection("settings").doc("store").get();
  return { ...DEFAULT_SETTINGS, ...(s.exists ? (s.data() as Partial<StoreSettings>) : {}) };
}

/** IST day key (YYYY-MM-DD) used for daily revenue summaries. */
export const istDayKey = (ms = Date.now()) => new Date(ms + 330 * 60_000).toISOString().slice(0, 10);

const newOrderId = () => `ZB-${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString("hex").toUpperCase()}`;

/** Loads FRESH (uncached) product records — pricing and stock decisions never use the page cache. */
async function loadProducts(ids: string[]): Promise<Map<string, Product>> {
  const unique = [...new Set(ids)];
  const refs = unique.map((id) => db().collection("products").doc(id));
  const snaps = refs.length ? await db().getAll(...refs) : [];
  const map = new Map<string, Product>();
  for (const s of snaps) if (s.exists) map.set(s.id, serialize<Product>({ id: s.id, ...s.data() }));
  return map;
}

async function loadCoupon(code: string | undefined): Promise<Coupon | undefined> {
  if (!code) return undefined;
  const snap = await db().collection("coupons").where("code", "==", code.trim().toUpperCase()).limit(1).get();
  if (snap.empty) return undefined;
  return serialize<Coupon>({ id: snap.docs[0].id, ...snap.docs[0].data() });
}

async function userRedemptions(couponId: string | undefined, uid: string | undefined): Promise<number> {
  if (!couponId || !uid) return 0;
  const s = await db().collection("coupons").doc(couponId).collection("redemptions").doc(uid).get();
  return s.exists ? ((s.data()!.count as number) ?? 0) : 0;
}

/** Authoritative quote for a cart (used by cart UI and by checkout). */
export async function quoteCart(args: {
  items: CartItemInput[];
  couponCode?: string;
  shippingMethodId?: string;
  uid?: string;
}): Promise<Quote> {
  const [settings, products, coupon] = await Promise.all([
    readSettings(),
    loadProducts(args.items.map((i) => i.productId)),
    loadCoupon(args.couponCode),
  ]);
  const method =
    settings.shippingMethods.find((m) => m.id === args.shippingMethodId) ?? settings.shippingMethods[0];
  return buildQuote({
    items: args.items,
    products,
    coupon,
    couponCode: args.couponCode,
    userRedemptions: await userRedemptions(coupon?.id, args.uid),
    shippingMethod: method,
    tax: { inclusiveRatePercent: settings.taxInclusiveRatePercent },
    allowDemo: demoPurchasesAllowed(),
  });
}

export interface CheckoutSession {
  orderId: string;
  providerOrderId: string;
  amount: number;
  currency: "INR";
  publicKey: string;
  mode: "test" | "live";
  email: string;
}

/**
 * Creates (or idempotently returns) a pending order, reserves stock, and opens a Razorpay order.
 * Order of operations matters:
 *  1. recompute everything server-side, 2. reserve stock transactionally,
 *  3. only then talk to the provider, 4. on provider failure release the hold.
 */
export async function createCheckout(user: { uid: string; email?: string }, req: CheckoutRequest): Promise<CheckoutSession> {
  const settings = await readSettings();
  const method = settings.shippingMethods.find((m) => m.id === req.shippingMethodId);
  if (!method) throw new HttpError(400, "Please choose a valid shipping method.");

  // Idempotency: the same key from the same user always maps to the same order.
  const keyRef = db().collection("checkoutKeys").doc(`${user.uid}_${req.idempotencyKey}`);
  const existing = await keyRef.get();
  if (existing.exists) {
    const o = await db().collection("orders").doc(existing.data()!.orderId as string).get();
    if (o.exists && o.data()!.providerOrderId && o.data()!.paymentStatus !== "paid") {
      return sessionFromOrder(o.id, o.data() as Order);
    }
    if (o.exists && o.data()!.paymentStatus === "paid") throw new HttpError(409, "This order has already been paid.", "ALREADY_PAID");
  }

  await releaseExpiredReservations(10); // opportunistic cleanup so expired holds don't block stock

  const coupon = await loadCoupon(req.couponCode);
  const redemptions = await userRedemptions(coupon?.id, user.uid);
  const orderId = newOrderId();
  const orderRef = db().collection("orders").doc(orderId);
  const resRef = db().collection("inventoryReservations").doc(orderId);

  const order = await db().runTransaction(async (tx) => {
    const productRefs = [...new Set(req.items.map((i) => i.productId))].map((id) => db().collection("products").doc(id));
    const snaps = await tx.getAll(...productRefs);
    const products = new Map<string, Product>();
    for (const s of snaps) if (s.exists) products.set(s.id, { id: s.id, ...(s.data() as Omit<Product, "id">) });

    const quote = buildQuote({
      items: req.items, products, coupon, couponCode: req.couponCode, userRedemptions: redemptions,
      shippingMethod: method, tax: { inclusiveRatePercent: settings.taxInclusiveRatePercent }, allowDemo: demoPurchasesAllowed(),
    });
    if (!quote.valid) {
      const bad = quote.lines.find((l) => l.issue);
      throw new HttpError(409, bad ? `${bad.name}: ${bad.issue}` : "Your bag is empty.", "CART_INVALID");
    }
    if (req.couponCode && quote.couponError) throw new HttpError(400, quote.couponError, "COUPON_INVALID");
    if (quote.total < 100) throw new HttpError(400, "Order total is too low to process.");

    // Reserve stock per product (one doc write per product, inside the same transaction).
    const byProduct = new Map<string, StockLine[]>();
    for (const l of quote.lines) byProduct.set(l.productId, [...(byProduct.get(l.productId) ?? []), { variantId: l.variantId, quantity: l.quantity }]);
    for (const [pid, lines] of byProduct) {
      const p = products.get(pid)!;
      const res = reserveStock(p.variants, lines);
      if (!res.ok) throw new HttpError(409, `${p.name}: not enough stock.`, "OUT_OF_STOCK");
      tx.update(db().collection("products").doc(pid), { variants: res.variants, updatedAt: FieldValue.serverTimestamp() });
    }

    const items: OrderItem[] = quote.lines.map((l) => ({
      productId: l.productId, variantId: l.variantId, name: l.name, sku: l.sku, image: l.image,
      size: l.size, color: l.color, quantity: l.quantity, unitPrice: l.unitPrice, listPrice: l.listPrice, lineTotal: l.lineTotal,
    }));
    const now = Date.now();
    const doc: Omit<Order, "id"> = {
      userId: user.uid,
      email: req.email,
      phone: req.shippingAddress.phone,
      shippingAddress: req.shippingAddress,
      billingAddress: req.billingAddress ?? req.shippingAddress,
      items,
      subtotal: quote.subtotal, discount: quote.discount,
      ...(quote.couponCode ? { couponCode: quote.couponCode } : {}),
      shipping: quote.shipping, taxIncluded: quote.taxIncluded, total: quote.total,
      currency: "INR", shippingMethodId: method.id,
      paymentProvider: "razorpay", paymentMode: paymentProvider.mode(),
      paymentStatus: "created", fulfillmentStatus: "awaiting_payment",
      // Keep demo/test-data orders separable from real customer orders.
      ...(quote.lines.some((l) => products.get(l.productId)?.isDemo) ? { isDemo: true } : {}),
      createdAt: now, updatedAt: now,
    };
    tx.set(orderRef, doc);
    tx.set(resRef, {
      orderId, userId: user.uid, status: "active",
      lines: quote.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })),
      expiresAt: now + RESERVATION_MINUTES * 60_000, createdAt: now,
    });
    tx.set(keyRef, { orderId, userId: user.uid, createdAt: now });
    return { id: orderId, ...doc } as Order;
  });

  try {
    const po = await paymentProvider.createOrder({ receipt: orderId, amount: order.total, notes: { orderId, userId: user.uid } });
    await orderRef.update({ providerOrderId: po.providerOrderId, paymentStatus: "pending", updatedAt: Date.now() });
    return { orderId, providerOrderId: po.providerOrderId, amount: po.amount, currency: "INR", publicKey: po.publicKey, mode: po.mode, email: order.email };
  } catch (e) {
    console.error("[checkout] provider order failed; releasing stock", e);
    await expireOrder(orderId, "provider_error");
    throw e instanceof HttpError ? e : new HttpError(502, "We could not start the payment. Please try again.", "PROVIDER_ERROR");
  }
}

function sessionFromOrder(id: string, o: Order): CheckoutSession {
  return {
    orderId: id, providerOrderId: o.providerOrderId!, amount: o.total, currency: "INR",
    publicKey: process.env.RAZORPAY_KEY_ID!, mode: o.paymentMode, email: o.email,
  };
}

/** Re-opens payment for an unpaid order whose stock hold is still valid. */
export async function retryCheckout(uid: string, orderId: string): Promise<CheckoutSession> {
  const snap = await db().collection("orders").doc(orderId).get();
  if (!snap.exists || snap.data()!.userId !== uid) throw new HttpError(404, "Order not found.");
  const o = snap.data() as Order;
  if (o.paymentStatus === "paid") throw new HttpError(409, "This order has already been paid.", "ALREADY_PAID");
  const res = await db().collection("inventoryReservations").doc(orderId).get();
  if (o.fulfillmentStatus !== "awaiting_payment" || !res.exists || res.data()!.status !== "active" || res.data()!.expiresAt < Date.now())
    throw new HttpError(409, "This checkout has expired. Please return to your bag and try again.", "EXPIRED");
  if (!o.providerOrderId) throw new HttpError(409, "Payment was never started for this order.");
  return sessionFromOrder(orderId, o);
}

export interface ConfirmResult {
  status: "confirmed" | "already_paid" | "ignored" | "unfulfillable";
  order?: Order;
}

/**
 * Idempotent payment confirmation. Called ONLY after the signature/webhook was verified AND
 * the provider confirmed (amount, order id, captured). Safe to call any number of times:
 * the first call commits stock and flips the order; later calls are no-ops.
 */
export async function confirmPayment(args: { orderId: string; paymentId: string; amount: number }): Promise<ConfirmResult> {
  const orderRef = db().collection("orders").doc(args.orderId);
  const resRef = db().collection("inventoryReservations").doc(args.orderId);

  const result = await db().runTransaction(async (tx: Transaction): Promise<ConfirmResult> => {
    const [orderSnap, resSnap] = await Promise.all([tx.get(orderRef), tx.get(resRef)]);
    if (!orderSnap.exists) return { status: "ignored" };
    const order = { id: orderSnap.id, ...(orderSnap.data() as Omit<Order, "id">) } as Order;
    if (order.paymentStatus === "paid" || order.paymentStatus === "refund_pending" || order.paymentStatus === "refunded")
      return { status: "already_paid", order };
    if (order.total !== args.amount) throw new HttpError(409, "Paid amount does not match the order.", "AMOUNT_MISMATCH");

    const couponSnap = order.couponCode
      ? await tx.get(db().collection("coupons").where("code", "==", order.couponCode).limit(1))
      : undefined;
    const productRefs = [...new Set(order.items.map((i) => i.productId))].map((id) => db().collection("products").doc(id));
    const productSnaps = await tx.getAll(...productRefs);
    const products = new Map(productSnaps.filter((s) => s.exists).map((s) => [s.id, s.data() as Product]));

    const now = Date.now();
    const reservationActive = resSnap.exists && resSnap.data()!.status === "active";

    // Late payment: the hold expired and was released, so the units may have been sold to someone else.
    // Money was captured, so never drop the payment — but never oversell either. If any line is short,
    // record the payment and flag the order for an admin refund instead of fulfilling it.
    if (!reservationActive) {
      const short = order.items.some((i) => {
        const v = products.get(i.productId)?.variants.find((x) => x.id === i.variantId);
        return !v || v.stock - v.reserved < i.quantity;
      });
      if (short) {
        tx.update(orderRef, {
          paymentStatus: "refund_pending", fulfillmentStatus: "cancelled", providerPaymentId: args.paymentId,
          paidAt: now, updatedAt: now, cancelReason: "late_payment_out_of_stock",
        });
        tx.set(db().collection("payments").doc(args.paymentId), {
          orderId: order.id, userId: order.userId, provider: "razorpay", providerOrderId: order.providerOrderId ?? null,
          amount: order.total, currency: "INR", status: "captured_unfulfillable", mode: order.paymentMode, createdAt: now,
        });
        return { status: "unfulfillable", order: { ...order, paymentStatus: "refund_pending", fulfillmentStatus: "cancelled", providerPaymentId: args.paymentId } };
      }
    }

    // ---- writes ----
    for (const [pid, p] of products) {
      const lines = order.items.filter((i) => i.productId === pid).map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
      const variants = commitStock(p.variants, lines);
      const sold = order.items.filter((i) => i.productId === pid).reduce((n, i) => n + i.quantity, 0);
      tx.update(db().collection("products").doc(pid), { variants, soldCount: FieldValue.increment(sold), updatedAt: FieldValue.serverTimestamp() });
      for (const l of lines) {
        tx.set(db().collection("inventoryMovements").doc(), {
          productId: pid, variantId: l.variantId, delta: -l.quantity, reason: "sale", orderId: order.id, createdAt: now,
        });
      }
    }
    if (resSnap.exists) tx.update(resRef, { status: "committed", committedAt: now });

    if (couponSnap && !couponSnap.empty) {
      const cref = couponSnap.docs[0].ref;
      tx.update(cref, { usedCount: FieldValue.increment(1) });
      tx.set(cref.collection("redemptions").doc(order.userId), { count: FieldValue.increment(1), lastOrderId: order.id }, { merge: true });
    }

    // Daily revenue summary (verified payments only) — read by the admin dashboard instead of scanning orders.
    const catById = new Map<string, string>();
    for (const [pid, p] of products) catById.set(pid, p.categorySlug);
    const prodStats: Record<string, unknown> = {};
    const catStats: Record<string, unknown> = {};
    for (const i of order.items) {
      prodStats[i.productId] = { name: i.name, qty: FieldValue.increment(i.quantity), revenue: FieldValue.increment(i.lineTotal) };
      const cat = catById.get(i.productId) ?? "uncategorised";
      catStats[cat] = { revenue: FieldValue.increment(i.lineTotal), qty: FieldValue.increment(i.quantity) };
    }
    tx.set(
      db().collection("statsDaily").doc(istDayKey(now)),
      { orders: FieldValue.increment(1), revenue: FieldValue.increment(order.total), discount: FieldValue.increment(order.discount), products: prodStats, categories: catStats, day: istDayKey(now) },
      { merge: true },
    );

    tx.update(orderRef, {
      paymentStatus: "paid", fulfillmentStatus: "processing", providerPaymentId: args.paymentId, paidAt: now, updatedAt: now,
    });
    tx.set(db().collection("payments").doc(args.paymentId), {
      orderId: order.id, userId: order.userId, provider: "razorpay", providerOrderId: order.providerOrderId ?? null,
      amount: order.total, currency: "INR", status: "captured", mode: order.paymentMode, createdAt: now,
    });
    return { status: "confirmed", order: { ...order, paymentStatus: "paid", fulfillmentStatus: "processing", providerPaymentId: args.paymentId, paidAt: now } };
  });

  return result;
}

/** Records a failed attempt. The stock hold is kept until expiry so the customer can retry. */
export async function markPaymentFailed(orderId: string, reason: string): Promise<void> {
  const ref = db().collection("orders").doc(orderId);
  await db().runTransaction(async (tx) => {
    const s = await tx.get(ref);
    if (!s.exists) return;
    const o = s.data() as Order;
    if (o.paymentStatus === "paid" || o.paymentStatus === "refunded" || o.paymentStatus === "refund_pending") return; // never downgrade a paid order
    tx.update(ref, { paymentStatus: "failed", paymentFailureReason: reason.slice(0, 200), updatedAt: Date.now() });
  });
}

/** Cancels an unpaid order and returns its held stock. No-op for paid orders. */
export async function expireOrder(orderId: string, reason: string): Promise<boolean> {
  const orderRef = db().collection("orders").doc(orderId);
  const resRef = db().collection("inventoryReservations").doc(orderId);
  return db().runTransaction(async (tx) => {
    const [o, r] = await Promise.all([tx.get(orderRef), tx.get(resRef)]);
    if (!o.exists || !r.exists || r.data()!.status !== "active") return false;
    const order = o.data() as Order;
    if (order.paymentStatus === "paid") return false;
    const lines = r.data()!.lines as { productId: string; variantId: string; quantity: number }[];
    const ids = [...new Set(lines.map((l) => l.productId))];
    const snaps = await tx.getAll(...ids.map((id) => db().collection("products").doc(id)));
    for (const s of snaps) {
      if (!s.exists) continue;
      const mine = lines.filter((l) => l.productId === s.id);
      tx.update(s.ref, { variants: releaseStock((s.data() as Product).variants, mine), updatedAt: FieldValue.serverTimestamp() });
    }
    tx.update(resRef, { status: "released", releasedAt: Date.now(), reason });
    tx.update(orderRef, {
      fulfillmentStatus: "cancelled",
      paymentStatus: order.paymentStatus === "created" || order.paymentStatus === "pending" ? "failed" : order.paymentStatus,
      cancelReason: reason, updatedAt: Date.now(),
    });
    return true;
  });
}

/** Releases holds for abandoned checkouts. Invoked lazily and by the cron endpoint. */
export async function releaseExpiredReservations(limit = 25): Promise<number> {
  const snap = await db().collection("inventoryReservations")
    .where("status", "==", "active").where("expiresAt", "<", Date.now()).limit(limit).get();
  let n = 0;
  for (const d of snap.docs) if (await expireOrder(d.id, "reservation_expired")) n++;
  return n;
}

/**
 * Admin fulfilment transition with validation. Cancelling a PAID order restocks the units and
 * flags the order refund_pending — the refund itself must go through the provider-backed refund action.
 */
export async function adminSetFulfillment(orderId: string, to: Order["fulfillmentStatus"], actor: string): Promise<Order> {
  const ref = db().collection("orders").doc(orderId);
  return db().runTransaction(async (tx) => {
    const s = await tx.get(ref);
    if (!s.exists) throw new HttpError(404, "Order not found.");
    const order = { id: s.id, ...(s.data() as Omit<Order, "id">) } as Order;
    if (!canTransitionFulfillment(order.fulfillmentStatus, to))
      throw new HttpError(409, `Cannot move an order from "${order.fulfillmentStatus}" to "${to}".`, "BAD_TRANSITION");
    if (to !== "cancelled" && order.paymentStatus !== "paid")
      throw new HttpError(409, "Only paid orders can be fulfilled.", "NOT_PAID");

    const patch: Record<string, unknown> = { fulfillmentStatus: to, updatedAt: Date.now() };
    if (to === "cancelled" && order.paymentStatus === "paid") {
      const ids = [...new Set(order.items.map((i) => i.productId))];
      const snaps = await tx.getAll(...ids.map((id) => db().collection("products").doc(id)));
      for (const p of snaps) {
        if (!p.exists) continue;
        const lines = order.items.filter((i) => i.productId === p.id).map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
        tx.update(p.ref, { variants: restoreStock((p.data() as Product).variants, lines), updatedAt: FieldValue.serverTimestamp() });
        for (const l of lines) tx.set(db().collection("inventoryMovements").doc(), { productId: p.id, variantId: l.variantId, delta: l.quantity, reason: "cancellation", orderId, actor, createdAt: Date.now() });
      }
      patch.paymentStatus = "refund_pending";
    }
    tx.update(ref, patch);
    tx.set(db().collection("adminAuditLogs").doc(), { actor, action: "order.fulfillment", target: orderId, detail: { from: order.fulfillmentStatus, to }, createdAt: Date.now() });
    return { ...order, ...patch } as Order;
  });
}

export type { DocumentReference };
