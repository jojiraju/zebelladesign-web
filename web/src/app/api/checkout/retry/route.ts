import { jsonError, jsonOk, requireUser } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { retryCheckout } from "@/lib/server/orders";
import { z } from "zod";

export const dynamic = "force-dynamic";

/** Re-opens payment for an unpaid order while its stock hold is still valid. */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    await rateLimit(`retry:${user.uid}`, 15, 600);
    const { orderId } = z.object({ orderId: z.string().min(1).max(64) }).parse(await req.json());
    return jsonOk(req, await retryCheckout(user.uid, orderId));
  } catch (e) {
    return jsonError(req, e);
  }
}
