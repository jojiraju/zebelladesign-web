import type { Variant } from "../types";

export interface StockLine {
  variantId: string;
  quantity: number;
}

export type ReservationResult =
  | { ok: true; variants: Variant[] }
  | { ok: false; error: string; variantId: string };

const clone = (vs: Variant[]) => vs.map((v) => ({ ...v }));

/** Hold units for a pending checkout. Fails without side effects if any line is short. */
export function reserveStock(variants: Variant[], lines: StockLine[]): ReservationResult {
  const next = clone(variants);
  for (const l of lines) {
    const v = next.find((x) => x.id === l.variantId);
    if (!v) return { ok: false, error: "Variant not found.", variantId: l.variantId };
    if (v.stock - v.reserved < l.quantity)
      return { ok: false, error: "Insufficient stock.", variantId: l.variantId };
    v.reserved += l.quantity;
  }
  return { ok: true, variants: next };
}

/** Release a hold (payment failed / reservation expired / checkout abandoned). */
export function releaseStock(variants: Variant[], lines: StockLine[]): Variant[] {
  const next = clone(variants);
  for (const l of lines) {
    const v = next.find((x) => x.id === l.variantId);
    if (v) v.reserved = Math.max(0, v.reserved - l.quantity);
  }
  return next;
}

/** Convert a hold into a real sale after verified payment: reserved and stock both drop. */
export function commitStock(variants: Variant[], lines: StockLine[]): Variant[] {
  const next = clone(variants);
  for (const l of lines) {
    const v = next.find((x) => x.id === l.variantId);
    if (!v) continue;
    v.reserved = Math.max(0, v.reserved - l.quantity);
    v.stock = Math.max(0, v.stock - l.quantity);
  }
  return next;
}

/** Return units to stock after an eligible cancellation of an already-committed sale. */
export function restoreStock(variants: Variant[], lines: StockLine[]): Variant[] {
  const next = clone(variants);
  for (const l of lines) {
    const v = next.find((x) => x.id === l.variantId);
    if (v) v.stock += l.quantity;
  }
  return next;
}
