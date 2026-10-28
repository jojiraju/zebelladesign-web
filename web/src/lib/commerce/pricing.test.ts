import { describe, expect, it } from "vitest";
import { buildQuote, shippingFee, taxContained } from "./pricing";
import { effectivePrice } from "./catalog-rules";
import { discountPercent } from "./money";
import { coupon, product } from "@/test/fixtures";

const method = { id: "std", label: "Standard", fee: 9900, freeAbove: 600000, eta: "5 days" };
const tax = { inclusiveRatePercent: 5 };
const mapOf = (...ps: ReturnType<typeof product>[]) => new Map(ps.map((p) => [p.id, p]));

describe("product pricing", () => {
  it("uses the sale price only when it is genuinely lower", () => {
    expect(effectivePrice(product({ price: 1000, salePrice: 800 }))).toBe(800);
    expect(effectivePrice(product({ price: 1000, salePrice: 1200 }))).toBe(1000); // bogus "sale" ignored
    expect(effectivePrice(product({ price: 1000, salePrice: null }))).toBe(1000);
    expect(effectivePrice(product({ price: 1000, salePrice: 0 }))).toBe(1000);
  });

  it("reports discount percent only for real discounts", () => {
    expect(discountPercent(1000, 750)).toBe(25);
    expect(discountPercent(1000, 1000)).toBe(0);
    expect(discountPercent(1000, null)).toBe(0);
  });

  it("extracts GST contained in an inclusive price", () => {
    expect(taxContained(10500, 5)).toBe(500);
    expect(taxContained(10500, 0)).toBe(0);
  });
});

describe("order total calculation", () => {
  it("sums lines, applies shipping below the free threshold", () => {
    const p = product({ price: 200000, salePrice: 150000 });
    const q = buildQuote({ items: [{ productId: "p1", variantId: "m-ivory", quantity: 2 }], products: mapOf(p), shippingMethod: method, tax });
    expect(q.subtotal).toBe(300000);
    expect(q.shipping).toBe(9900);
    expect(q.total).toBe(309900);
    expect(q.valid).toBe(true);
    expect(q.freeShippingRemaining).toBe(300000);
  });

  it("gives free shipping at the threshold", () => {
    const q = buildQuote({ items: [{ productId: "p1", variantId: "m-ivory", quantity: 2 }], products: mapOf(product({ price: 300000 })), shippingMethod: method, tax });
    expect(q.shipping).toBe(0);
    expect(q.total).toBe(600000);
  });

  it("applies a percent coupon before shipping and never goes negative", () => {
    const q = buildQuote({
      items: [{ productId: "p1", variantId: "m-ivory", quantity: 1 }], products: mapOf(product({ price: 100000 })),
      coupon: coupon({ type: "fixed", value: 999999 }), couponCode: "WELCOME10", shippingMethod: method, tax,
    });
    expect(q.discount).toBe(100000);
    expect(q.total).toBe(9900);
  });

  it("surfaces a coupon error without discounting", () => {
    const q = buildQuote({
      items: [{ productId: "p1", variantId: "m-ivory", quantity: 1 }], products: mapOf(product()),
      coupon: coupon({ active: false }), couponCode: "WELCOME10", shippingMethod: method, tax,
    });
    expect(q.discount).toBe(0);
    expect(q.couponError).toBeTruthy();
  });

  it("marks the quote invalid when a line cannot be fulfilled", () => {
    const q = buildQuote({ items: [{ productId: "p1", variantId: "m-ivory", quantity: 99 }], products: mapOf(product()), shippingMethod: method, tax });
    expect(q.valid).toBe(false);
    expect(q.lines[0].issue).toBeTruthy();
    expect(q.subtotal).toBe(0); // unfulfillable lines are never charged
  });

  it("treats unknown or unpublished products as unavailable", () => {
    const q = buildQuote({ items: [{ productId: "ghost", variantId: "x", quantity: 1 }], products: new Map(), shippingMethod: method, tax });
    expect(q.valid).toBe(false);
    const q2 = buildQuote({ items: [{ productId: "p1", variantId: "m-ivory", quantity: 1 }], products: mapOf(product({ status: "draft" })), shippingMethod: method, tax });
    expect(q2.valid).toBe(false);
  });

  it("charges no shipping for an empty bag", () => {
    expect(buildQuote({ items: [], products: new Map(), shippingMethod: method, tax }).total).toBe(0);
    expect(shippingFee(undefined, 100)).toBe(0);
  });
});
