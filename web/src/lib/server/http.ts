import "server-only";
import { NextResponse } from "next/server";
import { adminAuth, isAdminConfigured } from "./admin";
import { hasPermission, isRole, type Permission } from "../auth/permissions";
import type { Role } from "../types";

export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export interface AuthedUser {
  uid: string;
  email?: string;
  emailVerified: boolean;
  role?: Role;
}

/** Admin-app origins allowed to call /api/admin/* from the browser. */
function allowedOrigins(): string[] {
  return (process.env.ADMIN_APP_ORIGIN ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  if (origin && allowedOrigins().includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      Vary: "Origin",
    };
  }
  return {};
}

export const preflight = (req: Request) => new NextResponse(null, { status: 204, headers: corsHeaders(req) });

/** Verifies the Firebase ID token on a request (revocation-checked). */
export async function requireUser(req: Request): Promise<AuthedUser> {
  if (!isAdminConfigured()) throw new HttpError(503, "Server is not configured yet.", "NOT_CONFIGURED");
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new HttpError(401, "Please sign in to continue.", "UNAUTHENTICATED");
  try {
    const d = await adminAuth().verifyIdToken(token, true);
    return {
      uid: d.uid,
      email: d.email,
      emailVerified: !!d.email_verified,
      role: isRole(d.role) ? d.role : undefined,
    };
  } catch {
    throw new HttpError(401, "Your session has expired. Please sign in again.", "UNAUTHENTICATED");
  }
}

/** Requires a verified custom-claim role granting `permission`. Authorization is always server-side. */
export async function requirePermission(req: Request, permission: Permission): Promise<AuthedUser> {
  const user = await requireUser(req);
  if (!hasPermission(user.role, permission)) throw new HttpError(403, "You do not have access to this action.", "FORBIDDEN");
  return user;
}

export function jsonOk(req: Request, data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { ...corsHeaders(req), "Cache-Control": "no-store" } });
}

/** Converts any thrown value into a safe JSON response — never leaks stack traces or secrets. */
export function jsonError(req: Request, e: unknown) {
  if (e instanceof HttpError) {
    return NextResponse.json({ error: e.message, code: e.code }, { status: e.status, headers: corsHeaders(req) });
  }
  if (e instanceof Error && e.name === "ZodError") {
    return NextResponse.json({ error: "Please check the details you entered.", code: "VALIDATION" }, { status: 400, headers: corsHeaders(req) });
  }
  console.error("[api] unhandled error", e);
  return NextResponse.json({ error: "Something went wrong. Please try again.", code: "INTERNAL" }, { status: 500, headers: corsHeaders(req) });
}

export const clientIp = (req: Request) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
