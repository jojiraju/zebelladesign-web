import { adminDb } from "@/lib/server/admin";
import { HttpError, jsonError, jsonOk, requireUser } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { finalizePayment } from "@/lib/server/payment-flow";
import { markPaymentFailed } from "@/lib/server/orders";
import { paymentProvider } from "@/lib/payments/razorpay";
import { verifyPaymentSchema } from "@/lib/validation";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Called by the browser after Razorpay Checkout returns. The browser's claim of success is NOT trusted:
 * we verify the HMAC signature, then re-fetch the payment from Razorpay before confirming anything.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    await rateLimit(`verify:${user.uid}`, 30, 600);
    const b = verifyPaymentSchema.parse(await req.json());

    const snap = await adminDb().collection("orders").doc(b.orderId).get();
    const order = snap.data() as Order | undefined;
    if (!snap.exists || !order || order.userId !== user.uid) throw new HttpError(404, "Order not found.");
    if (order.providerOrderId !== b.razorpay_order_id) throw new HttpError(400, "Payment does not belong to this order.");

    const ok = paymentProvider.verifyCheckout({
      providerOrderId: b.razorpay_order_id,
      paymentId: b.razorpay_payment_id,
      signature: b.razorpay_signature,
    });
    if (!ok) {
      await markPaymentFailed(b.orderId, "invalid_signature");
      throw new HttpError(400, "We could not verify this payment.", "BAD_SIGNATURE");
    }

    const outcome = await finalizePayment(b.orderId, b.razorpay_payment_id);
    return jsonOk(req, { orderId: b.orderId, state: outcome.state });
  } catch (e) {
    return jsonError(req, e);
  }
}
