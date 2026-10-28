import { createHash } from "node:crypto";
import { adminDb, isAdminConfigured } from "@/lib/server/admin";
import { HttpError, clientIp, jsonError, jsonOk } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { newsletterSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    if (!isAdminConfigured()) throw new HttpError(503, "Newsletter signup is not available yet.", "NOT_CONFIGURED");
    await rateLimit(`newsletter:${clientIp(req)}`, 8, 600);
    const body = newsletterSchema.parse(await req.json());
    if (body.company) return jsonOk(req, { status: "subscribed" }); // honeypot tripped: silently drop, store nothing
    const email = body.email.toLowerCase();
    // Deterministic id => duplicate signups collapse onto one document.
    const ref = adminDb().collection("newsletterSubscribers").doc(createHash("sha256").update(email).digest("hex").slice(0, 32));
    try {
      await ref.create({ email, consent: true, source: "website", createdAt: Date.now() });
      return jsonOk(req, { status: "subscribed" }, 201);
    } catch {
      return jsonOk(req, { status: "already_subscribed" });
    }
  } catch (e) {
    return jsonError(req, e);
  }
}
