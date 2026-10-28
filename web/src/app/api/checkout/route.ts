import { jsonError, jsonOk, requireUser } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { createCheckout } from "@/lib/server/orders";
import { checkoutRequestSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Step 1 of payment: server recomputes the order, reserves stock, opens a Razorpay order. */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    await rateLimit(`checkout:${user.uid}`, 15, 600);
    const body = checkoutRequestSchema.parse(await req.json());
    const session = await createCheckout(user, body);
    return jsonOk(req, session);
  } catch (e) {
    return jsonError(req, e);
  }
}
