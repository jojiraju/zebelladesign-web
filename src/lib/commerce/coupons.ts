import type { Coupon, Paise, PricedLine } from "../types";
import { percentOf } from "./money";

export interface CouponResult {
  discount: Paise;
  error?: string;
}

/**
 * Pure coupon evaluation. All inputs come from the server (coupon doc, priced lines,
 * the customer's prior redemption count) — never from the browser.
 */
export function evaluateCoupon(
  coupon: Coupon | undefined,
  lines: PricedLine[],
  opts: { now?: number; userRedemptions?: number } = {},
): CouponResult {
  const now = opts.now ?? Date.now();
  if (!coupon || !coupon.active) return { discount: 0, error: "This coupon code is not valid." };
  if (coupon.startsAt && now < coupon.startsAt) return { discount: 0, error: "This coupon is not active yet." };
  if (coupon.endsAt && now > coupon.endsAt) return { discount: 0, error: "This coupon has expired." };
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit)
    return { discount: 0, error: "This coupon has reached its usage limit." };
  if (coupon.perUserLimit != null && (opts.userRedemptions ?? 0) >= coupon.perUserLimit)
    return { discount: 0, error: "You have already used this coupon." };

  const restrictedProducts = coupon.productIds?.length ? new Set(coupon.productIds) : null;
  const restrictedCollections = coupon.collectionIds?.length ? new Set(coupon.collectionIds) : null;
  const eligible = lines.filter((l) => {
    if (l.issue) return false;
    if (!restrictedProducts && !restrictedCollections) return true;
    return (
      (restrictedProducts?.has(l.productId) ?? false) ||
      l.collectionIds.some((c) => restrictedCollections?.has(c))
    );
  });
  if (eligible.length === 0) return { discount: 0, error: "This coupon does not apply to the items in your bag." };

  const eligibleTotal = eligible.reduce((n, l) => n + l.lineTotal, 0);
  const orderTotal = lines.filter((l) => !l.issue).reduce((n, l) => n + l.lineTotal, 0);
  if (coupon.minOrder && orderTotal < coupon.minOrder)
    return { discount: 0, error: "Your order does not meet the minimum value for this coupon." };

  let discount = coupon.type === "percent" ? percentOf(eligibleTotal, coupon.value) : coupon.value;
  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, eligibleTotal); // never discount below zero
  return { discount: Math.max(0, discount) };
}
