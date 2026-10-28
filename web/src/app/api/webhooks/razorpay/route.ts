import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/server/admin";
import { finalizePayment } from "@/lib/server/payment-flow";
import { markPaymentFailed } from "@/lib/server/orders";
import { verifyWebhookSignature } from "@/lib/payments/signature";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

interface RzpPayload {
  event: string;
  payload?: {
    payment?: { entity?: { id: string; order_id?: string; error_description?: string } };
    order?: { entity?: { id: string } };
    refund?: { entity?: { id: string; payment_id: string; amount: number; status: string } };
  };
}

async function orderByProviderId(providerOrderId?: string) {
  if (!providerOrderId) return undefined;
  const q = await adminDb().collection("orders").where("providerOrderId", "==", providerOrderId).limit(1).get();
  return q.empty ? undefined : { id: q.docs[0].id, data: q.docs[0].data() as Order };
}

/**
 * Razorpay webhook. Security + reliability properties:
 *  - signature is verified against the RAW body (req.text(), never re-serialised JSON)
 *  - each event id is claimed once (create() fails if it already exists) -> idempotent
 *  - if processing throws, the claim is deleted and we return 500 so Razorpay retries
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const ok = verifyWebhookSignature({
    rawBody: raw,
    signature: req.headers.get("x-razorpay-signature"),
    secret: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
  });
  if (!ok) return NextResponse.json({ error: "invalid signature" }, { status: 400 });

  const eventId = req.headers.get("x-razorpay-event-id");
  if (!eventId) return NextResponse.json({ error: "missing event id" }, { status: 400 });

  const claim = adminDb().collection("webhookEvents").doc(eventId);
  try {
    await claim.create({ receivedAt: Date.now(), status: "processing" });
  } catch {
    return NextResponse.json({ ok: true, duplicate: true }); // already handled (or in flight)
  }

  try {
    const evt = JSON.parse(raw) as RzpPayload;
    const pay = evt.payload?.payment?.entity;
    const providerOrderId = pay?.order_id ?? evt.payload?.order?.entity?.id;

    if ((evt.event === "payment.captured" || evt.event === "order.paid") && pay?.id) {
      const order = await orderByProviderId(providerOrderId);
      if (order) await finalizePayment(order.id, pay.id);
    } else if (evt.event === "payment.failed" && pay) {
      const order = await orderByProviderId(providerOrderId);
      if (order) await markPaymentFailed(order.id, pay.error_description ?? "payment_failed");
    } else if (evt.event === "refund.processed") {
      const r = evt.payload?.refund?.entity;
      if (r) {
        const q = await adminDb().collection("orders").where("providerPaymentId", "==", r.payment_id).limit(1).get();
        if (!q.empty) {
          const o = q.docs[0].data() as Order;
          // Fully refunded only when the provider says the whole amount went back.
          const full = r.amount >= o.total;
          await q.docs[0].ref.update({
            paymentStatus: full ? "refunded" : "paid",
            refund: { id: r.id, amount: r.amount, status: r.status, at: Date.now() },
            updatedAt: Date.now(),
          });
        }
      }
    }
    await claim.update({ status: "done", processedAt: FieldValue.serverTimestamp(), event: evt.event });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[webhook] processing failed; releasing claim for retry", e);
    await claim.delete().catch(() => undefined);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
