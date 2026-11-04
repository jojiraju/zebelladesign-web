import type { Order } from "../types";

/** True once there is nothing left to wait for: the payment has reached an outcome, or the order was cancelled. */
export const isPaymentSettled = (o: Pick<Order, "paymentStatus" | "fulfillmentStatus">): boolean =>
  (o.paymentStatus !== "created" && o.paymentStatus !== "pending") || o.fulfillmentStatus === "cancelled";

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
