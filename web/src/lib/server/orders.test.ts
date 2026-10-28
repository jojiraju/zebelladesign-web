import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeDb, FakeFieldValue } from "@/test/fake-firestore";
import { product, variant } from "@/test/fixtures";
import type { Order } from "../types";

let db = new FakeDb();
vi.mock("./admin", () => ({ adminDb: () => db, isAdminConfigured: () => true }));
vi.mock("firebase-admin/firestore", () => ({ FieldValue: FakeFieldValue }));
const createOrder = vi.fn();
vi.mock("../payments/razorpay", () => ({
  paymentProvider: { mode: () => "test", createOrder: (a: unknown) => createOrder(a) },
}));

import { adminSetFulfillment, confirmPayment, createCheckout, expireOrder, releaseExpiredReservations } from "./orders";

const address = { fullName: "Asha", phone: "9876543210", line1: "1 Road", city: "Kochi", state: "Kerala", pincode: "682001", country: "India" };
const checkoutReq = (over = {}) => ({
  items: [{ productId: "p1", variantId: "m-ivory", quantity: 2 }],
  idempotencyKey: "abcdefghijklmnop1234", email: "asha@example.com", shippingAddress: address,
  shippingMethodId: "standard", ...over,
});
const user = { uid: "u1", email: "asha@example.com" };
const stockOf = () => (db.read<{ variants: { id: string; stock: number; reserved: number }[] }>("products/p1")!.variants.find((v) => v.id === "m-ivory")!);

beforeEach(() => {
  db = new FakeDb();
  createOrder.mockReset();
  createOrder.mockResolvedValue({ providerOrderId: "order_rzp1", amount: 0, publicKey: "rzp_test_x", mode: "test" });
  db.seed("products/p1", { ...product({ price: 200000, variants: [variant({ stock: 5 })] }) });
});

describe("checkout creation", () => {
  it("prices server-side, reserves stock and opens a provider order for the SERVER total", async () => {
    createOrder.mockImplementation(async (a: { amount: number }) => ({ providerOrderId: "order_rzp1", amount: a.amount, publicKey: "rzp_test_x", mode: "test" }));
    const s = await createCheckout(user, checkoutReq());
    // 2 x 2000 = 4000 INR, below the 2999 free-shipping threshold? No: above it, so shipping is free.
    expect(s.amount).toBe(400000);
    expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({ amount: 400000 }));
    expect(stockOf()).toMatchObject({ stock: 5, reserved: 2 });
    const order = db.read<Order>(`orders/${s.orderId}`)!;
    expect(order).toMatchObject({ paymentStatus: "pending", fulfillmentStatus: "awaiting_payment", userId: "u1", providerOrderId: "order_rzp1" });
  });

  it("is idempotent: the same key returns the same order and reserves stock once", async () => {
    createOrder.mockImplementation(async (a: { amount: number }) => ({ providerOrderId: "order_rzp1", amount: a.amount, publicKey: "k", mode: "test" }));
    const a = await createCheckout(user, checkoutReq());
    const b = await createCheckout(user, checkoutReq());
    expect(b.orderId).toBe(a.orderId);
    expect(createOrder).toHaveBeenCalledTimes(1);
    expect(stockOf().reserved).toBe(2);
  });

  it("refuses to oversell", async () => {
    await expect(createCheckout(user, checkoutReq({ items: [{ productId: "p1", variantId: "m-ivory", quantity: 9 }] }))).rejects.toMatchObject({ status: 409 });
    expect(stockOf().reserved).toBe(0);
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("releases the hold if the payment provider fails", async () => {
    createOrder.mockRejectedValue(new Error("rzp down"));
    await expect(createCheckout(user, checkoutReq())).rejects.toBeTruthy();
    expect(stockOf().reserved).toBe(0);
  });

  it("ignores any client-supplied price fields", async () => {
    createOrder.mockImplementation(async (a: { amount: number }) => ({ providerOrderId: "o", amount: a.amount, publicKey: "k", mode: "test" }));
    const s = await createCheckout(user, checkoutReq({ items: [{ productId: "p1", variantId: "m-ivory", quantity: 1, unitPrice: 1, total: 1 }], idempotencyKey: "zzzzzzzzzzzzzzzz9999" }));
    expect(s.amount).toBe(200000 + 9900); // real price + shipping, never the forged "1"
  });
});

describe("payment confirmation", () => {
  async function pendingOrder() {
    createOrder.mockImplementation(async (a: { amount: number }) => ({ providerOrderId: "order_rzp1", amount: a.amount, publicKey: "k", mode: "test" }));
    return createCheckout(user, checkoutReq());
  }

  it("commits stock, marks the order paid and records revenue exactly once", async () => {
    const s = await pendingOrder();
    const first = await confirmPayment({ orderId: s.orderId, paymentId: "pay_1", amount: s.amount });
    expect(first.status).toBe("confirmed");
    expect(stockOf()).toMatchObject({ stock: 3, reserved: 0 });
    expect(db.read<Order>(`orders/${s.orderId}`)).toMatchObject({ paymentStatus: "paid", fulfillmentStatus: "processing", providerPaymentId: "pay_1" });
    const day = [...db.store.keys()].find((k) => k.startsWith("statsDaily/"))!;
    expect(db.read<{ orders: number; revenue: number }>(day)).toMatchObject({ orders: 1, revenue: s.amount });
  });

  it("is idempotent: replaying the same confirmation changes nothing", async () => {
    const s = await pendingOrder();
    await confirmPayment({ orderId: s.orderId, paymentId: "pay_1", amount: s.amount });
    const again = await confirmPayment({ orderId: s.orderId, paymentId: "pay_1", amount: s.amount });
    expect(again.status).toBe("already_paid");
    expect(stockOf()).toMatchObject({ stock: 3, reserved: 0 });
    const day = [...db.store.keys()].find((k) => k.startsWith("statsDaily/"))!;
    expect(db.read<{ orders: number }>(day)!.orders).toBe(1);
    const sales = [...db.store.keys()].filter((k) => k.startsWith("inventoryMovements/"));
    expect(sales).toHaveLength(1);
  });

  it("rejects a payment whose amount differs from the order", async () => {
    const s = await pendingOrder();
    await expect(confirmPayment({ orderId: s.orderId, paymentId: "pay_1", amount: 100 })).rejects.toMatchObject({ code: "AMOUNT_MISMATCH" });
    expect(db.read<Order>(`orders/${s.orderId}`)!.paymentStatus).toBe("pending");
  });

  it("late payment after expiry: fulfils if stock remains, otherwise flags a refund instead of overselling", async () => {
    const s = await pendingOrder();
    await expireOrder(s.orderId, "reservation_expired");
    expect(stockOf().reserved).toBe(0);
    // someone else buys the remaining stock
    db.seed("products/p1", { ...product({ price: 200000, variants: [variant({ stock: 1 })] }) });
    const r = await confirmPayment({ orderId: s.orderId, paymentId: "pay_late", amount: s.amount });
    expect(r.status).toBe("unfulfillable");
    expect(db.read<Order>(`orders/${s.orderId}`)).toMatchObject({ paymentStatus: "refund_pending", fulfillmentStatus: "cancelled" });
    expect(stockOf().stock).toBe(1); // untouched
  });
});

describe("reservation expiry", () => {
  it("releases stock for abandoned checkouts and cancels the order", async () => {
    createOrder.mockImplementation(async (a: { amount: number }) => ({ providerOrderId: "o", amount: a.amount, publicKey: "k", mode: "test" }));
    const s = await createCheckout(user, checkoutReq());
    db.store.get(`inventoryReservations/${s.orderId}`)!.expiresAt = Date.now() - 1000;
    expect(await releaseExpiredReservations()).toBe(1);
    expect(stockOf().reserved).toBe(0);
    expect(db.read<Order>(`orders/${s.orderId}`)!.fulfillmentStatus).toBe("cancelled");
    expect(await releaseExpiredReservations()).toBe(0); // second sweep is a no-op
  });

  it("never expires a paid order", async () => {
    createOrder.mockImplementation(async (a: { amount: number }) => ({ providerOrderId: "o", amount: a.amount, publicKey: "k", mode: "test" }));
    const s = await createCheckout(user, checkoutReq());
    await confirmPayment({ orderId: s.orderId, paymentId: "pay_1", amount: s.amount });
    expect(await expireOrder(s.orderId, "x")).toBe(false);
  });
});

describe("admin fulfilment", () => {
  it("cannot fulfil an unpaid order and enforces transitions", async () => {
    createOrder.mockImplementation(async (a: { amount: number }) => ({ providerOrderId: "o", amount: a.amount, publicKey: "k", mode: "test" }));
    const s = await createCheckout(user, checkoutReq());
    await expect(adminSetFulfillment(s.orderId, "packed", "admin1")).rejects.toMatchObject({ code: "BAD_TRANSITION" });
    await confirmPayment({ orderId: s.orderId, paymentId: "pay_1", amount: s.amount });
    await expect(adminSetFulfillment(s.orderId, "shipped", "admin1")).rejects.toMatchObject({ code: "BAD_TRANSITION" });
    expect((await adminSetFulfillment(s.orderId, "packed", "admin1")).fulfillmentStatus).toBe("packed");
  });

  it("restocks and flags refund_pending when a paid order is cancelled (no auto-refund)", async () => {
    createOrder.mockImplementation(async (a: { amount: number }) => ({ providerOrderId: "o", amount: a.amount, publicKey: "k", mode: "test" }));
    const s = await createCheckout(user, checkoutReq());
    await confirmPayment({ orderId: s.orderId, paymentId: "pay_1", amount: s.amount });
    const o = await adminSetFulfillment(s.orderId, "cancelled", "admin1");
    expect(o.paymentStatus).toBe("refund_pending"); // NOT "refunded": that needs a provider-confirmed refund
    expect(stockOf().stock).toBe(5);
  });
});
