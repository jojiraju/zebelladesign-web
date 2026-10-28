import { z } from "zod";
import { adminDb } from "@/lib/server/admin";
import { HttpError, jsonError, jsonOk, preflight, requirePermission } from "@/lib/server/http";
import { adminSetFulfillment } from "@/lib/server/orders";
import { sendEmail, shippingEmail } from "@/lib/server/email";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status"), status: z.enum(["packed", "shipped", "delivered", "cancelled"]) }),
  z.object({
    action: z.literal("tracking"),
    carrier: z.string().trim().min(2).max(60),
    trackingNumber: z.string().trim().min(3).max(80),
    url: z.string().url().max(300).optional().or(z.literal("")),
  }),
  z.object({ action: z.literal("note"), text: z.string().trim().min(1).max(1000) }),
]);

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    // Authenticate/authorise BEFORE touching the body, so anonymous callers learn nothing about the schema.
    const user = await requirePermission(req, "orders:fulfil");
    const { id } = await ctx.params;
    const body = bodySchema.parse(await req.json());
    const ref = adminDb().collection("orders").doc(id);

    if (body.action === "status") {
      const order = await adminSetFulfillment(id, body.status, user.uid);
      return jsonOk(req, { fulfillmentStatus: order.fulfillmentStatus, paymentStatus: order.paymentStatus });
    }

    if (body.action === "tracking") {
      const snap = await ref.get();
      if (!snap.exists) throw new HttpError(404, "Order not found.");
      const order = snap.data() as Order;
      if (order.paymentStatus !== "paid") throw new HttpError(409, "Only paid orders can be shipped.");
      const tracking = { carrier: body.carrier, trackingNumber: body.trackingNumber, ...(body.url ? { url: body.url } : {}), shippedAt: Date.now() };
      await ref.update({ tracking, updatedAt: Date.now() });
      await adminDb().collection("adminAuditLogs").add({ actor: user.uid, action: "order.tracking", target: id, detail: { carrier: body.carrier }, createdAt: Date.now() });
      void sendEmail({ to: order.email, ...shippingEmail(id, body.carrier, body.trackingNumber) });
      return jsonOk(req, { tracking });
    }

    const note = { text: body.text, by: user.email ?? user.uid, at: Date.now() };
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, "Order not found.");
    const notes = [...((snap.data() as Order).notes ?? []), note].slice(-100);
    await ref.update({ notes, updatedAt: Date.now() });
    return jsonOk(req, { notes });
  } catch (e) {
    return jsonError(req, e);
  }
}
