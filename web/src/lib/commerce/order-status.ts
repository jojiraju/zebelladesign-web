import type { FulfillmentStatus, Order, Paise, PaymentStatus } from "../types";

/**
 * Fulfillment transitions an ADMIN may request. `awaiting_payment -> processing` is deliberately
 * absent: it happens only inside the server's payment confirmation, never by a dropdown.
 */
export const FULFILLMENT_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  awaiting_payment: ["cancelled"],
  processing: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const canTransitionFulfillment = (from: FulfillmentStatus, to: FulfillmentStatus) =>
  FULFILLMENT_TRANSITIONS[from]?.includes(to) ?? false;

/** Payment status moves only through server-verified events. */
export const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  created: ["pending", "paid", "failed"],
  pending: ["paid", "failed"],
  failed: ["paid", "pending"], // retry or late capture
  paid: ["refund_pending", "refunded"],
  refund_pending: ["refunded", "paid"],
  refunded: [],
};

export const canTransitionPayment = (from: PaymentStatus, to: PaymentStatus) =>
  PAYMENT_TRANSITIONS[from]?.includes(to) ?? false;

export function orderStatusLabel(o: Pick<Order, "paymentStatus" | "fulfillmentStatus">): string {
  if (o.paymentStatus === "failed") return "Payment Failed";
  if (o.paymentStatus === "refunded") return "Refunded";
  if (o.paymentStatus === "refund_pending") return "Refund Pending";
  if (o.fulfillmentStatus === "awaiting_payment") return "Pending Payment";
  if (o.fulfillmentStatus === "processing") return "Paid";
  return { packed: "Packed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled", processing: "Processing", awaiting_payment: "Pending Payment" }[
    o.fulfillmentStatus
  ];
}

export interface RefundCheck {
  ok: boolean;
  error?: string;
  maxRefundable: Paise;
}

/**
 * Safeguards before asking the payment provider for a refund. The provider's own state
 * (amount already refunded) must be passed in — a UI dropdown is never evidence.
 */
export function checkRefundable(
  order: Pick<Order, "paymentStatus" | "total" | "providerPaymentId">,
  requested: Paise,
  providerAlreadyRefunded: Paise,
): RefundCheck {
  const maxRefundable = Math.max(0, order.total - providerAlreadyRefunded);
  if (!order.providerPaymentId) return { ok: false, error: "No captured payment exists for this order.", maxRefundable };
  if (order.paymentStatus !== "paid" && order.paymentStatus !== "refund_pending")
    return { ok: false, error: "Only paid orders can be refunded.", maxRefundable };
  if (!Number.isInteger(requested) || requested <= 0) return { ok: false, error: "Invalid refund amount.", maxRefundable };
  if (requested > maxRefundable)
    return { ok: false, error: "Refund exceeds the refundable balance.", maxRefundable };
  return { ok: true, maxRefundable };
}
