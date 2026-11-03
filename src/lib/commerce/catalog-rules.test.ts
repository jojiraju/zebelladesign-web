import { describe, expect, it } from "vitest";
import { MAX_QTY_PER_LINE, resolveVariant, validateCartLine } from "./catalog-rules";
import { product, variant } from "@/test/fixtures";

describe("variant validation", () => {
  const p = product();

  it("requires size and colour when the product has them", () => {
    expect(resolveVariant(p, {}).error).toMatch(/size/i);
    expect(resolveVariant(p, { size: "M" }).error).toMatch(/colour/i);
  });

  it("rejects combinations that do not exist", () => {
    expect(resolveVariant(p, { size: "XXL", color: "Ivory" }).error).toBeTruthy();
  });

  it("resolves a valid combination", () => {
    expect(resolveVariant(p, { size: "L", color: "Ivory" }).variant?.id).toBe("l-ivory");
  });

  it("allows single-variant products without selection", () => {
    const one = product({ variants: [variant({ id: "default", size: undefined, color: undefined })] });
    expect(resolveVariant(one, {}).variant?.id).toBe("default");
  });
});

describe("cart quantity validation", () => {
  const p = product();
  const line = (quantity: number, variantId = "m-ivory") => ({ productId: "p1", variantId, quantity });

  it("accepts a valid quantity", () => expect(validateCartLine(p, line(2)).ok).toBe(true));
  it("rejects zero, negative and fractional quantities", () => {
    for (const q of [0, -1, 1.5]) expect(validateCartLine(p, line(q)).ok).toBe(false);
  });
  it("rejects quantities above the per-line cap", () => {
    const big = product({ variants: [variant({ stock: 500 })] });
    expect(validateCartLine(big, line(MAX_QTY_PER_LINE + 1)).ok).toBe(false);
  });
  it("rejects more than is available, counting reserved stock", () => {
    const held = product({ variants: [variant({ stock: 5, reserved: 4 })] });
    const r = validateCartLine(held, line(2));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.available).toBe(1);
  });
  it("rejects sold-out, missing variants and unpublished products", () => {
    expect(validateCartLine(product({ variants: [variant({ stock: 0 })] }), line(1)).ok).toBe(false);
    expect(validateCartLine(p, line(1, "nope")).ok).toBe(false);
    expect(validateCartLine(product({ status: "archived" }), line(1)).ok).toBe(false);
    expect(validateCartLine(undefined, line(1)).ok).toBe(false);
  });
});
