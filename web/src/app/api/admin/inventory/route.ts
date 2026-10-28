import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/server/admin";
import { HttpError, jsonError, jsonOk, preflight, requirePermission } from "@/lib/server/http";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";
export const OPTIONS = preflight;

const schema = z.object({
  productId: z.string().min(1).max(128),
  variantId: z.string().min(1).max(128),
  delta: z.number().int().refine((n) => n !== 0, "Delta must not be zero").refine((n) => Math.abs(n) <= 10000),
  reason: z.string().trim().min(2).max(200),
});

/** Transactional stock adjustment with an immutable movement record. Stock can never go below what is reserved. */
export async function POST(req: Request) {
  try {
    const user = await requirePermission(req, "inventory:write");
    const b = schema.parse(await req.json());
    const ref = adminDb().collection("products").doc(b.productId);
    const stock = await adminDb().runTransaction(async (tx) => {
      const s = await tx.get(ref);
      if (!s.exists) throw new HttpError(404, "Product not found.");
      const p = s.data() as Product;
      const v = p.variants.find((x) => x.id === b.variantId);
      if (!v) throw new HttpError(404, "Variant not found.");
      const next = v.stock + b.delta;
      if (next < v.reserved) throw new HttpError(409, "Stock cannot fall below units reserved by open checkouts.", "BELOW_RESERVED");
      const variants = p.variants.map((x) => (x.id === b.variantId ? { ...x, stock: next } : x));
      tx.update(ref, { variants, updatedAt: FieldValue.serverTimestamp() });
      tx.set(adminDb().collection("inventoryMovements").doc(), {
        productId: b.productId, variantId: b.variantId, delta: b.delta, reason: `manual: ${b.reason}`, actor: user.uid, createdAt: Date.now(),
      });
      return next;
    });
    return jsonOk(req, { stock });
  } catch (e) {
    return jsonError(req, e);
  }
}
