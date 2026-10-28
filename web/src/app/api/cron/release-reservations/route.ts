import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { releaseExpiredReservations } from "@/lib/server/orders";

export const dynamic = "force-dynamic";

/** Scheduled (e.g. Vercel Cron / Cloud Scheduler) cleanup of abandoned checkouts. Protected by CRON_SECRET. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  const given = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const a = Buffer.from(secret), b = Buffer.from(given);
  if (!secret || a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const released = await releaseExpiredReservations(100);
  return NextResponse.json({ released });
}
