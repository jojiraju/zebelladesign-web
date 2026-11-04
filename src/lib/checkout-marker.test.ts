import { beforeEach, describe, expect, it, vi } from "vitest";
import { consumeCheckout, rememberCheckout } from "./checkout-marker";

const bag = [{ productId: "p1", variantId: "v1", quantity: 1 }];

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
  });
});

describe("checkout marker", () => {
  it("clears the bag once for the order it was created from", () => {
    rememberCheckout("ZB-1", bag);
    expect(consumeCheckout("ZB-1", bag)).toBe(true);
    expect(consumeCheckout("ZB-1", bag)).toBe(false);
  });
  it("leaves the bag alone when revisiting a different order", () => {
    rememberCheckout("ZB-2", bag);
    expect(consumeCheckout("ZB-1", bag)).toBe(false);
    expect(consumeCheckout("ZB-2", bag)).toBe(true);
  });
  it("leaves the bag alone when it changed after the order was created", () => {
    rememberCheckout("ZB-1", bag);
    expect(consumeCheckout("ZB-1", [...bag, { productId: "p2", variantId: "v9", quantity: 1 }])).toBe(false);
  });
  it("does nothing when no checkout was started on this device", () => {
    expect(consumeCheckout("ZB-1", bag)).toBe(false);
  });
});
