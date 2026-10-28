import { adminDb, isAdminConfigured } from "@/lib/server/admin";
import { HttpError, clientIp, jsonError, jsonOk } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { orderStatusLabel } from "@/lib/commerce/order-status";
import { trackSchema } from "@/lib/validation";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Guest-safe lookup: needs BOTH order id and the email used. Returns a minimal, non-sensitive view. */
export async function POST(req: Request) {
  try {
    if (!isAdminConfigured()) throw new HttpError(503, "Order tracking is not available yet.", "NOT_CONFIGURED");
    await rateLimit(`track:${clientIp(req)}`, 10, 600);
    const { orderId, email } = trackSchema.parse(await req.json());
    const snap = await adminDb().collection("orders").doc(orderId.toUpperCase()).get();
    const o = snap.data() as Order | undefined;
    // Same message for "no such order" and "wrong email" so IDs can't be probed.
    if (!snap.exists || !o || o.email.toLowerCase() !== email.toLowerCase())
      throw new HttpError(404, "We couldn't find an order matching those details.");
    return jsonOk(req, {
      orderId: snap.id,
      status: orderStatusLabel(o),
      placedAt: o.createdAt,
      items: o.items.map((i) => ({ name: i.name, size: i.size, color: i.color, quantity: i.quantity })),
      tracking: o.tracking ? { carrier: o.tracking.carrier, trackingNumber: o.tracking.trackingNumber, url: o.tracking.url } : null,
    });
  } catch (e) {
    return jsonError(req, e);
  }
}
