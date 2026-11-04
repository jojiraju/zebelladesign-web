import type { CartItemInput } from "../types";
import { MAX_QTY_PER_LINE } from "./catalog-rules";

type LineKey = { productId: string; variantId: string };

export const sameLine = (a: LineKey, b: LineKey) => a.productId === b.productId && a.variantId === b.variantId;
export const clampQty = (n: number) => Math.max(1, Math.min(MAX_QTY_PER_LINE, Math.floor(n)));

/** Merge two carts: same line quantities are summed (capped), so nothing a shopper added is lost at login. */
export function mergeCarts(a: CartItemInput[], b: CartItemInput[]): CartItemInput[] {
  const out = a.map((i) => ({ ...i }));
  for (const item of b) {
    const hit = out.find((o) => sameLine(o, item));
    if (hit) hit.quantity = clampQty(hit.quantity + item.quantity);
    else out.push({ ...item });
  }
  return out;
}

/**
 * Combine the device's cart with the account cart when the account cart loads.
 * Only a guest cart (owner === null) holds new items to merge. A cart owned by an account is a copy of an
 * account cart, so summing it would double every quantity on each page load: the account cart wins instead.
 */
export function reconcileCart(account: CartItemInput[], device: CartItemInput[], owner: string | null): CartItemInput[] {
  return owner === null ? mergeCarts(account, device) : account;
}

/** The same rule for the wishlist: union a guest list into the account, otherwise the account list wins. */
export function reconcileWishlist(account: string[], device: string[], owner: string | null): string[] {
  return owner === null ? [...new Set([...account, ...device])] : account;
}
