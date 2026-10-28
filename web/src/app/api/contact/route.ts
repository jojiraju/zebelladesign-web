import { adminDb, isAdminConfigured } from "@/lib/server/admin";
import { HttpError, clientIp, jsonError, jsonOk } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { contactSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    if (!isAdminConfigured()) throw new HttpError(503, "The contact form is not available yet.", "NOT_CONFIGURED");
    await rateLimit(`contact:${clientIp(req)}`, 5, 900);
    const body = contactSchema.parse(await req.json());
    if (body.company) return jsonOk(req, { status: "received" }); // honeypot
    await adminDb().collection("contactMessages").add({
      name: body.name, email: body.email.toLowerCase(), message: body.message, status: "new", createdAt: Date.now(),
    });
    return jsonOk(req, { status: "received" }, 201);
  } catch (e) {
    return jsonError(req, e);
  }
}
