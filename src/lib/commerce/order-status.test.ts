import { describe, expect, it } from "vitest";
import { isPaymentSettled, orderStatusLabel } from "./order-status";

describe("isPaymentSettled", () => {
  it("keeps waiting while the payment has no outcome yet", () => {
    expect(isPaymentSettled({ paymentStatus: "created", fulfillmentStatus: "awaiting_payment" })).toBe(false);
    expect(isPaymentSettled({ paymentStatus: "pending", fulfillmentStatus: "awaiting_payment" })).toBe(false);
  });
  it("stops once the payment has an outcome or the order is cancelled", () => {
    expect(isPaymentSettled({ paymentStatus: "paid", fulfillmentStatus: "processing" })).toBe(true);
    expect(isPaymentSettled({ paymentStatus: "failed", fulfillmentStatus: "awaiting_payment" })).toBe(true);
    expect(isPaymentSettled({ paymentStatus: "refunded", fulfillmentStatus: "cancelled" })).toBe(true);
    expect(isPaymentSettled({ paymentStatus: "pending", fulfillmentStatus: "cancelled" })).toBe(true);
  });
});

describe("order status labels", () => {
  it("labels combined state for customers", () => {
    expect(orderStatusLabel({ paymentStatus: "paid", fulfillmentStatus: "processing" })).toBe("Paid");
    expect(orderStatusLabel({ paymentStatus: "failed", fulfillmentStatus: "cancelled" })).toBe("Payment Failed");
    expect(orderStatusLabel({ paymentStatus: "pending", fulfillmentStatus: "awaiting_payment" })).toBe("Pending Payment");
  });
});
