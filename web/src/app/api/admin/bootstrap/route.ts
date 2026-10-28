import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/server/admin";
import { HttpError, jsonError, jsonOk, preflight, requireUser } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

const safeEq = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/**
 * One-time first-admin provisioning. Requires (1) a signed-in user, (2) ADMIN_BOOTSTRAP_SECRET, and
 * (3) that no admin has been provisioned yet — enforced by creating `settings/bootstrap` atomically.
 * After the first success this endpoint permanently refuses. Not reachable via public registration.
 */
export async function POST(req: Request) {
  try {
    const secret = process.env.ADMIN_BOOTSTRAP_SECRET ?? "";
    if (secret.length < 16) throw new HttpError(503, "Admin bootstrap is not enabled.", "NOT_ENABLED");
    const user = await requireUser(req);
    await rateLimit(`bootstrap:${user.uid}`, 5, 3600);
    const { secret: given } = z.object({ secret: z.string().max(200) }).parse(await req.json());
    if (!safeEq(given, secret)) throw new HttpError(403, "Invalid bootstrap secret.", "FORBIDDEN");
    if (!user.emailVerified) throw new HttpError(403, "Verify your email address before becoming an administrator.");

    try {
      await adminDb().collection("settings").doc("bootstrap").create({ adminUid: user.uid, at: Date.now() });
    } catch {
      throw new HttpError(409, "An administrator has already been provisioned.", "ALREADY_BOOTSTRAPPED");
    }
    const u = await adminAuth().getUser(user.uid);
    await adminAuth().setCustomUserClaims(user.uid, { ...(u.customClaims ?? {}), role: "admin" });
    await adminAuth().revokeRefreshTokens(user.uid);
    await adminDb().collection("adminAuditLogs").add({ actor: user.uid, action: "admin.bootstrap", target: user.uid, createdAt: Date.now() });
    return jsonOk(req, { ok: true, message: "You are now an administrator. Sign in again to apply the role." });
  } catch (e) {
    return jsonError(req, e);
  }
}
