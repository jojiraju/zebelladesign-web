import "server-only";
import { adminDb } from "./admin";
import { HttpError } from "./http";
import { confirmPayment, type ConfirmResult } from "./orders";
import { orderConfirmationEmail, sendEmail } from "./email";
import { paymentProvider } from "../payments/razorpay";
import { formatINR } from "../commerce/money";
import type { Order } from "../types";

export type FinalizeOutcome =
  | { state: "paid"; result: ConfirmResult }
  | { state: "pending"; providerStatus: string }
  | { state: "failed"; providerStatus: string };

/**
 * Asks the PROVIDER (not the browser) what happened to a payment, checks it belongs to this
 * order and matches the order amount, and only then confirms the order.
 */
export async function finalizePayment(orderId: string, paymentId: string): Promise<FinalizeOutcome> {
  const snap = await adminDb().collection("orders").doc(orderId).get();
  if (!snap.exists) throw new HttpError(404, "Order not found.");
  const order = { id: snap.id, ...(snap.data() as Omit<Order, "id">) } as Order;

  const p = await paymentProvider.fetchPayment(paymentId);
  if (!order.providerOrderId || p.orderId !== order.providerOrderId)
    throw new HttpError(400, "Payment does not belong to this order.", "ORDER_MISMATCH");
  if (p.amount !== order.total) throw new HttpError(409, "Payment amount does not match the order.", "AMOUNT_MISMATCH");

  if (p.status === "captured") {
    const result = await confirmPayment({ orderId, paymentId, amount: p.amount });
    if (result.status === "confirmed" && result.order) {
      // Fire-and-log: a mail failure must never undo a confirmed order.
      const mail = orderConfirmationEmail(orderId, formatINR(result.order.total));
      void sendEmail({ to: result.order.email, ...mail });
    }
    return { state: "paid", result };
  }
  if (p.status === "failed") return { state: "failed", providerStatus: p.status };
  return { state: "pending", providerStatus: p.status }; // e.g. "authorized": the captured webhook will finish the job
}
