import { z } from "zod";
import { adminDb } from "@/lib/server/admin";
import { HttpError, jsonError, jsonOk, preflight, requirePermission } from "@/lib/server/http";
import { paymentProvider } from "@/lib/payments/razorpay";
import { checkRefundable } from "@/lib/commerce/order-status";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

const schema = z.object({ amount: z.number().int().positive(), reason: z.string().trim().max(300).optional() });

/**
 * Issues a refund through the payment provider. The order only becomes "refunded" once the provider
 * accepts the refund for the FULL amount; partial refunds are recorded but leave the order "paid".
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(req, "orders:refund");
    const { id } = await ctx.params;
    const body = schema.parse(await req.json());
    const ref = adminDb().collection("orders").doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, "Order not found.");
    const order = { id, ...(snap.data() as Omit<Order, "id">) } as Order;

    // Ground truth comes from the provider, not from our own (editable) state.
    const providerPayment = order.providerPaymentId ? await paymentProvider.fetchPayment(order.providerPaymentId) : undefined;
    const check = checkRefundable(order, body.amount, providerPayment?.amountRefunded ?? 0);
    if (!check.ok) throw new HttpError(409, check.error ?? "Refund not allowed.", "REFUND_BLOCKED");

    const refund = await paymentProvider.refund({
      paymentId: order.providerPaymentId!, amount: body.amount, notes: { orderId: id, reason: body.reason ?? "" },
    });
    const totalRefunded = (providerPayment?.amountRefunded ?? 0) + refund.amount;
    const full = totalRefunded >= order.total;
    await ref.update({
      paymentStatus: full ? "refunded" : "paid",
      refund: { id: refund.id, amount: totalRefunded, status: refund.status, at: Date.now(), reason: body.reason ?? "" },
      updatedAt: Date.now(),
    });
    await adminDb().collection("adminAuditLogs").add({
      actor: user.uid, action: "order.refund", target: id, detail: { amount: refund.amount, refundId: refund.id, full }, createdAt: Date.now(),
    });
    return jsonOk(req, { refundId: refund.id, status: refund.status, fullyRefunded: full });
  } catch (e) {
    return jsonError(req, e);
  }
}
