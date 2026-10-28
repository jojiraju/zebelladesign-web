import { describe, expect, it } from "vitest";
import { evaluateCoupon } from "./coupons";
import type { PricedLine } from "../types";
import { coupon } from "@/test/fixtures";

const line = (over: Partial<PricedLine> = {}): PricedLine => ({
  productId: "p1", variantId: "v", slug: "s", name: "n", sku: "k", quantity: 1,
  unitPrice: 100000, listPrice: 100000, lineTotal: 100000, collectionIds: ["col1"], available: 5, ...over,
});
const NOW = 1_700_000_000_000;

describe("coupon validation", () => {
  it("applies percent discounts", () => expect(evaluateCoupon(coupon(), [line()], { now: NOW }).discount).toBe(10000));
  it("applies fixed discounts capped at the eligible total", () => {
    expect(evaluateCoupon(coupon({ type: "fixed", value: 30000 }), [line()]).discount).toBe(30000);
    expect(evaluateCoupon(coupon({ type: "fixed", value: 999999 }), [line()]).discount).toBe(100000);
  });
  it("honours maxDiscount", () =>
    expect(evaluateCoupon(coupon({ value: 50, maxDiscount: 20000 }), [line()]).discount).toBe(20000));
  it("rejects inactive, not-yet-started and expired coupons", () => {
    expect(evaluateCoupon(coupon({ active: false }), [line()]).error).toBeTruthy();
    expect(evaluateCoupon(coupon({ startsAt: NOW + 1 }), [line()], { now: NOW }).error).toBeTruthy();
    expect(evaluateCoupon(coupon({ endsAt: NOW - 1 }), [line()], { now: NOW }).error).toBeTruthy();
  });
  it("enforces global and per-user usage limits", () => {
    expect(evaluateCoupon(coupon({ usageLimit: 5, usedCount: 5 }), [line()]).error).toBeTruthy();
    expect(evaluateCoupon(coupon({ perUserLimit: 1 }), [line()], { userRedemptions: 1 }).error).toBeTruthy();
    expect(evaluateCoupon(coupon({ perUserLimit: 2 }), [line()], { userRedemptions: 1 }).error).toBeUndefined();
  });
  it("enforces the minimum order value", () =>
    expect(evaluateCoupon(coupon({ minOrder: 200000 }), [line()]).error).toBeTruthy());
  it("restricts to listed products or collections", () => {
    const lines = [line({ productId: "p1" }), line({ productId: "p2", collectionIds: ["col2"], lineTotal: 50000 })];
    expect(evaluateCoupon(coupon({ productIds: ["p2"] }), lines).discount).toBe(5000);
    expect(evaluateCoupon(coupon({ collectionIds: ["col1"] }), lines).discount).toBe(10000);
    expect(evaluateCoupon(coupon({ productIds: ["zzz"] }), lines).error).toBeTruthy();
  });
  it("ignores lines with issues", () => {
    expect(evaluateCoupon(coupon(), [line({ issue: "Sold out.", lineTotal: 0 })]).error).toBeTruthy();
  });
  it("treats a missing coupon as invalid", () => expect(evaluateCoupon(undefined, [line()]).error).toBeTruthy());
});
