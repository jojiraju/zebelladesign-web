import { createHmac, timingSafeEqual } from "node:crypto";

function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Razorpay Checkout: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyCheckoutSignature(args: {
  providerOrderId: string;
  paymentId: string;
  signature: string;
  secret: string;
}): boolean {
  if (!args.secret || !args.signature) return false;
  const expected = createHmac("sha256", args.secret)
    .update(`${args.providerOrderId}|${args.paymentId}`)
    .digest("hex");
  return safeEqualHex(expected, args.signature);
}

/** Razorpay webhooks: HMAC_SHA256(RAW request body, webhook_secret). */
export function verifyWebhookSignature(args: { rawBody: string; signature: string | null; secret: string }): boolean {
  if (!args.secret || !args.signature) return false;
  const expected = createHmac("sha256", args.secret).update(args.rawBody).digest("hex");
  return safeEqualHex(expected, args.signature);
}
