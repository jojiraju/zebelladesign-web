import { jsonError, jsonOk } from "@/lib/server/http";
import { quoteCart } from "@/lib/server/orders";
import { isAdminConfigured, adminAuth } from "@/lib/server/admin";
import { quoteRequestSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Authoritative pricing for the bag. Auth is optional (guests can browse a bag); it only enables per-user coupon limits. */
export async function POST(req: Request) {
  try {
    if (!isAdminConfigured()) return jsonOk(req, { configured: false, quote: null });
    const body = quoteRequestSchema.parse(await req.json());
    let uid: string | undefined;
    const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
    if (token) uid = await adminAuth().verifyIdToken(token).then((d) => d.uid).catch(() => undefined);
    const quote = await quoteCart({ items: body.items, couponCode: body.couponCode || undefined, shippingMethodId: body.shippingMethodId, uid });
    return jsonOk(req, { configured: true, quote });
  } catch (e) {
    return jsonError(req, e);
  }
}
