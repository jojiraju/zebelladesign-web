import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/server/admin";
import { HttpError, jsonError, jsonOk, preflight, requirePermission } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

/** Customer directory (safe fields only — never tokens or password data). */
export async function GET(req: Request) {
  try {
    await requirePermission(req, "customers:read");
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim().toLowerCase();
    const page = await adminAuth().listUsers(200, url.searchParams.get("cursor") || undefined);
    const users = page.users
      .filter((u) => !q || u.email?.toLowerCase().includes(q) || u.displayName?.toLowerCase().includes(q))
      .map((u) => ({
        uid: u.uid, email: u.email ?? null, name: u.displayName ?? null, verified: u.emailVerified,
        createdAt: u.metadata.creationTime, lastSignIn: u.metadata.lastSignInTime,
        role: (u.customClaims?.role as string | undefined) ?? null,
      }));
    return jsonOk(req, { users, nextCursor: page.pageToken ?? null });
  } catch (e) {
    return jsonError(req, e);
  }
}

const roleSchema = z.object({ uid: z.string().min(1).max(128), role: z.enum(["admin", "editor", "fulfillment"]).nullable() });

/** Grant or revoke a staff role. Only existing admins may do this; takes effect after token refresh. */
export async function POST(req: Request) {
  try {
    const actor = await requirePermission(req, "roles:manage");
    const { uid, role } = roleSchema.parse(await req.json());
    if (uid === actor.uid && role !== "admin") throw new HttpError(409, "You cannot remove your own admin access.");
    const user = await adminAuth().getUser(uid);
    const claims = { ...(user.customClaims ?? {}) };
    if (role) claims.role = role; else delete claims.role;
    await adminAuth().setCustomUserClaims(uid, claims);
    await adminAuth().revokeRefreshTokens(uid); // force re-auth so the new claim applies and stale tokens die
    await adminDb().collection("adminAuditLogs").add({ actor: actor.uid, action: "role.set", target: uid, detail: { role }, createdAt: Date.now() });
    return jsonOk(req, { uid, role });
  } catch (e) {
    return jsonError(req, e);
  }
}
