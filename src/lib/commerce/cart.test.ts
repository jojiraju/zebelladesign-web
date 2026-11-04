import { describe, expect, it } from "vitest";
import { MAX_QTY_PER_LINE } from "./catalog-rules";
import { mergeCarts, reconcileCart, reconcileWishlist } from "./cart";

const line = (variantId: string, quantity: number) => ({ productId: "p1", variantId, quantity });

describe("mergeCarts", () => {
  it("sums matching lines up to the cap and keeps the rest", () => {
    expect(mergeCarts([line("a", 2)], [line("a", 3), line("b", 1)])).toEqual([line("a", 5), line("b", 1)]);
    expect(mergeCarts([line("a", 9)], [line("a", 9)])).toEqual([line("a", MAX_QTY_PER_LINE)]);
  });
});

describe("reconcileCart", () => {
  it("merges a guest cart into the account cart", () => {
    expect(reconcileCart([line("a", 1)], [line("a", 2)], null)).toEqual([line("a", 3)]);
  });
  it("does not double quantities when the device already holds this account's cart", () => {
    let device = [line("a", 1)];
    for (let reload = 0; reload < 3; reload++) device = reconcileCart([line("a", 1)], device, "user-1");
    expect(device).toEqual([line("a", 1)]);
  });
  it("discards a cart left behind by another account", () => {
    expect(reconcileCart([], [line("a", 4)], "user-2")).toEqual([]);
  });
});

describe("reconcileWishlist", () => {
  it("unions a guest list and lets the account win otherwise", () => {
    expect(reconcileWishlist(["a"], ["a", "b"], null)).toEqual(["a", "b"]);
    expect(reconcileWishlist(["a"], ["a", "removed-elsewhere"], "user-1")).toEqual(["a"]);
  });
});
