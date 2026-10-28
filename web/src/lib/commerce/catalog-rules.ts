import type { CartItemInput, Product, Variant } from "../types";

export const MAX_QTY_PER_LINE = 10;

/** The price a customer actually pays per unit. Sale price only counts when genuinely lower. */
export function effectivePrice(p: Pick<Product, "price" | "salePrice">): number {
  return p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;
}

export const availableUnits = (v: Variant): number => Math.max(0, v.stock - v.reserved);

export function totalAvailable(p: Pick<Product, "variants">): number {
  return p.variants.reduce((n, v) => n + availableUnits(v), 0);
}

export const needsSize = (p: Pick<Product, "variants">) => p.variants.some((v) => !!v.size);
export const needsColor = (p: Pick<Product, "variants">) => p.variants.some((v) => !!v.color);

/**
 * Resolve the variant for a customer's size/color selection.
 * Returns an error string when the selection is incomplete or does not exist.
 */
export function resolveVariant(
  p: Pick<Product, "variants">,
  sel: { size?: string; color?: string },
): { variant?: Variant; error?: string } {
  if (needsSize(p) && !sel.size) return { error: "Please select a size." };
  if (needsColor(p) && !sel.color) return { error: "Please select a colour." };
  const variant = p.variants.find(
    (v) => (v.size ?? undefined) === (sel.size || undefined) && (v.color ?? undefined) === (sel.color || undefined),
  );
  if (!variant) return { error: "This combination is not available." };
  return { variant };
}

export type LineCheck = { ok: true; variant: Variant } | { ok: false; reason: string; available?: number };

/** Validates one cart line against the authoritative product record. */
export function validateCartLine(
  product: Product | undefined,
  input: CartItemInput,
  opts: { allowDemo?: boolean } = {},
): LineCheck {
  if (!product || product.status !== "published") return { ok: false, reason: "This product is no longer available." };
  // Development seed data is never real inventory unless explicitly enabled for test-mode payments.
  if (product.isDemo && !opts.allowDemo) return { ok: false, reason: "Demo product — not available for purchase." };
  if (!Number.isInteger(input.quantity) || input.quantity < 1) return { ok: false, reason: "Invalid quantity." };
  if (input.quantity > MAX_QTY_PER_LINE)
    return { ok: false, reason: `You can order at most ${MAX_QTY_PER_LINE} of an item.` };
  const variant = product.variants.find((v) => v.id === input.variantId);
  if (!variant) return { ok: false, reason: "Selected option is no longer available." };
  const available = availableUnits(variant);
  if (available <= 0) return { ok: false, reason: "Sold out.", available: 0 };
  if (input.quantity > available) return { ok: false, reason: `Only ${available} left.`, available };
  return { ok: true, variant };
}
