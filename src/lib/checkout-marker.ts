import type { CartItemInput } from "./types";

const KEY = "zebella.checkout.pending";

const signature = (items: CartItemInput[]) =>
  JSON.stringify(items.map((i) => `${i.productId}|${i.variantId}|${i.quantity}`).sort());

/** Remember which bag this order was created from, so a later confirmation can clear exactly that bag. */
export function rememberCheckout(orderId: string, items: CartItemInput[]): void {
  try { localStorage.setItem(KEY, JSON.stringify({ orderId, cart: signature(items) })); } catch { /* private mode */ }
}

/**
 * True once, when this order is confirmed and the bag is still the one it was created from.
 * Revisiting an old confirmation page, or adding items since, leaves the current bag alone.
 */
export function consumeCheckout(orderId: string, items: CartItemInput[]): boolean {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (saved?.orderId !== orderId) return false;
    localStorage.removeItem(KEY);
    return saved.cart === signature(items);
  } catch {
    return false;
  }
}
