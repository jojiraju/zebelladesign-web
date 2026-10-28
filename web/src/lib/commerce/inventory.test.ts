import { describe, expect, it } from "vitest";
import { commitStock, releaseStock, reserveStock, restoreStock } from "./inventory";
import { variant } from "@/test/fixtures";

const vs = () => [variant({ id: "a", stock: 3, reserved: 0 }), variant({ id: "b", stock: 1, reserved: 0 })];

describe("inventory reservation and release", () => {
  it("reserves without touching physical stock", () => {
    const r = reserveStock(vs(), [{ variantId: "a", quantity: 2 }]);
    expect(r.ok && r.variants[0]).toMatchObject({ stock: 3, reserved: 2 });
  });
  it("prevents overselling across concurrent holds", () => {
    const first = reserveStock(vs(), [{ variantId: "a", quantity: 2 }]);
    if (!first.ok) throw new Error("expected ok");
    expect(reserveStock(first.variants, [{ variantId: "a", quantity: 2 }]).ok).toBe(false);
    expect(reserveStock(first.variants, [{ variantId: "a", quantity: 1 }]).ok).toBe(true);
  });
  it("is all-or-nothing and does not mutate its input", () => {
    const input = vs();
    expect(reserveStock(input, [{ variantId: "a", quantity: 1 }, { variantId: "b", quantity: 2 }]).ok).toBe(false);
    expect(input[0].reserved).toBe(0);
  });
  it("releases holds and never goes negative", () => {
    const held = [variant({ id: "a", stock: 3, reserved: 2 })];
    expect(releaseStock(held, [{ variantId: "a", quantity: 2 }])[0].reserved).toBe(0);
    expect(releaseStock(held, [{ variantId: "a", quantity: 9 }])[0].reserved).toBe(0);
  });
  it("commits a hold into a sale", () => {
    const held = [variant({ id: "a", stock: 3, reserved: 2 })];
    expect(commitStock(held, [{ variantId: "a", quantity: 2 }])[0]).toMatchObject({ stock: 1, reserved: 0 });
  });
  it("restores stock after a cancellation", () => {
    expect(restoreStock([variant({ id: "a", stock: 1 })], [{ variantId: "a", quantity: 2 }])[0].stock).toBe(3);
  });
});
