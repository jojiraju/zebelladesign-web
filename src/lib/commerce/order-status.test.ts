import { describe, expect, it } from "vitest";
import { canTransitionFulfillment, canTransitionPayment, checkRefundable, orderStatusLabel } from "./order-status";

describe("order status transitions", () => {
  it("allows the forward fulfilment path", () => {
    expect(canTransitionFulfillment("processing", "packed")).toBe(true);
    expect(canTransitionFulfillment("packed", "shipped")).toBe(true);
    expect(canTransitionFulfillment("shipped", "delivered")).toBe(true);
  });
  it("blocks skipping steps, going backwards and leaving terminal states", () => {
    expect(canTransitionFulfillment("processing", "shipped")).toBe(false);
    expect(canTransitionFulfillment("shipped", "packed")).toBe(false);
    expect(canTransitionFulfillment("delivered", "cancelled")).toBe(false);
    expect(canTransitionFulfillment("cancelled", "processing")).toBe(false);
  });
  it("never lets an admin mark an unpaid order as processing", () => {
    expect(canTransitionFulfillment("awaiting_payment", "processing")).toBe(false);
    expect(canTransitionFulfillment("awaiting_payment", "shipped")).toBe(false);
  });
  it("keeps payment transitions one-directional", () => {
    expect(canTransitionPayment("pending", "paid")).toBe(true);
    expect(canTransitionPayment("paid", "refunded")).toBe(true);
    expect(canTransitionPayment("refunded", "paid")).toBe(false);
    expect(canTransitionPayment("paid", "pending")).toBe(false);
  });
  it("labels combined state for customers", () => {
    expect(orderStatusLabel({ paymentStatus: "paid", fulfillmentStatus: "processing" })).toBe("Paid");
    expect(orderStatusLabel({ paymentStatus: "failed", fulfillmentStatus: "cancelled" })).toBe("Payment Failed");
    expect(orderStatusLabel({ paymentStatus: "pending", fulfillmentStatus: "awaiting_payment" })).toBe("Pending Payment");
  });
});

describe("refund safeguards", () => {
  const paid = { paymentStatus: "paid" as const, total: 100000, providerPaymentId: "pay_1" };
  it("allows a refund within the balance", () => expect(checkRefundable(paid, 40000, 0).ok).toBe(true));
  it("blocks refunds beyond what the provider says is left", () => {
    const r = checkRefundable(paid, 70000, 40000);
    expect(r.ok).toBe(false);
    expect(r.maxRefundable).toBe(60000);
  });
  it("blocks unpaid orders and orders without a captured payment", () => {
    expect(checkRefundable({ ...paid, paymentStatus: "pending" }, 100, 0).ok).toBe(false);
    expect(checkRefundable({ ...paid, providerPaymentId: undefined }, 100, 0).ok).toBe(false);
  });
  it("blocks already-refunded orders and invalid amounts", () => {
    expect(checkRefundable({ ...paid, paymentStatus: "refunded" }, 100, 100000).ok).toBe(false);
    for (const bad of [0, -5, 1.5]) expect(checkRefundable(paid, bad, 0).ok).toBe(false);
  });
});
