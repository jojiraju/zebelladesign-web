import type { CartItemInput, Coupon, Paise, PricedLine, Product, Quote, ShippingMethod } from "../types";
import { evaluateCoupon } from "./coupons";
import { availableUnits, effectivePrice, validateCartLine } from "./catalog-rules";

export interface TaxSettings {
  /** GST rate (%) already included in displayed prices. 0 disables the informational line. */
  inclusiveRatePercent: number;
}

/** GST contained in a tax-inclusive amount. */
export const taxContained = (inclusive: Paise, ratePercent: number): Paise =>
  ratePercent <= 0 ? 0 : Math.round(inclusive - inclusive / (1 + ratePercent / 100));

export function shippingFee(method: ShippingMethod | undefined, afterDiscount: Paise): Paise {
  if (!method) return 0;
  if (method.freeAbove != null && afterDiscount >= method.freeAbove) return 0;
  return method.fee;
}

/**
 * Builds the authoritative quote. This is the ONLY place order totals are computed;
 * the browser's idea of price is never used for charging.
 */
export function buildQuote(args: {
  items: CartItemInput[];
  products: Map<string, Product>;
  coupon?: Coupon;
  couponCode?: string;
  userRedemptions?: number;
  shippingMethod?: ShippingMethod;
  tax: TaxSettings;
  now?: number;
  allowDemo?: boolean;
}): Quote {
  const lines: PricedLine[] = args.items.map((item) => {
    const product = args.products.get(item.productId);
    const check = validateCartLine(product, item, { allowDemo: args.allowDemo });
    const variant = product?.variants.find((v) => v.id === item.variantId);
    const unit = product ? effectivePrice(product) : 0;
    return {
      productId: item.productId,
      variantId: item.variantId,
      slug: product?.slug ?? "",
      name: product?.name ?? "Unavailable item",
      sku: variant?.sku ?? product?.sku ?? "",
      image: product?.images[0]?.url,
      size: variant?.size,
      color: variant?.color,
      quantity: item.quantity,
      unitPrice: unit,
      listPrice: product?.price ?? 0,
      lineTotal: check.ok ? unit * item.quantity : 0,
      collectionIds: product?.collectionIds ?? [],
      available: variant ? availableUnits(variant) : 0,
      issue: check.ok ? undefined : check.reason,
    };
  });

  const subtotal = lines.reduce((n, l) => n + l.lineTotal, 0);

  let discount = 0;
  let couponError: string | undefined;
  let couponCode: string | undefined;
  if (args.couponCode) {
    const res = evaluateCoupon(args.coupon, lines, { now: args.now, userRedemptions: args.userRedemptions });
    if (res.error) couponError = res.error;
    else {
      discount = res.discount;
      couponCode = args.coupon?.code;
    }
  }

  const afterDiscount = subtotal - discount;
  const shipping = lines.length ? shippingFee(args.shippingMethod, afterDiscount) : 0;
  const total = afterDiscount + shipping;
  const freeAbove = args.shippingMethod?.freeAbove;

  return {
    lines,
    subtotal,
    discount,
    couponCode,
    couponError,
    shipping,
    taxIncluded: taxContained(afterDiscount, args.tax.inclusiveRatePercent),
    total,
    freeShippingRemaining:
      freeAbove != null && afterDiscount < freeAbove && lines.length ? freeAbove - afterDiscount : undefined,
    valid: lines.length > 0 && lines.every((l) => !l.issue),
  };
}
