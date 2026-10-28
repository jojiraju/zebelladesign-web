import "server-only";
import { createHash } from "node:crypto";
import { adminDb } from "./admin";
import { HttpError } from "./http";

/**
 * Fixed-window rate limiter backed by Firestore (works across serverless instances).
 * Fails OPEN on infrastructure errors so a Firestore hiccup cannot take checkout down,
 * but logs loudly.
 */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<void> {
  const window = Math.floor(Date.now() / (windowSec * 1000));
  const id = createHash("sha256").update(`${key}:${window}`).digest("hex").slice(0, 40);
  const ref = adminDb().collection("rateLimits").doc(id);
  try {
    const count = await adminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const n = (snap.exists ? (snap.data()!.count as number) : 0) + 1;
      tx.set(ref, { count: n, expiresAt: new Date((window + 2) * windowSec * 1000) });
      return n;
    });
    if (count > limit) throw new HttpError(429, "Too many requests. Please wait a moment and try again.", "RATE_LIMITED");
  } catch (e) {
    if (e instanceof HttpError) throw e;
    console.error("[rate-limit] backend error, failing open", e);
  }
}
