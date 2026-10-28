import "server-only";
import { Timestamp } from "firebase-admin/firestore";

/** Recursively converts Firestore Timestamps to epoch millis so data is safe to pass to client components. */
export function serialize<T>(value: unknown): T {
  if (value instanceof Timestamp) return value.toMillis() as unknown as T;
  if (Array.isArray(value)) return value.map((v) => serialize(v)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = serialize(v);
    return out as T;
  }
  return value as T;
}
