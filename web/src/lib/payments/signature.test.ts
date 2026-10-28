import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyCheckoutSignature, verifyWebhookSignature } from "./signature";

const hmac = (secret: string, body: string) => createHmac("sha256", secret).update(body).digest("hex");

describe("Razorpay checkout signature", () => {
  const base = { providerOrderId: "order_A", paymentId: "pay_B", secret: "s3cret" };
  const good = hmac("s3cret", "order_A|pay_B");

  it("accepts a correct signature", () => expect(verifyCheckoutSignature({ ...base, signature: good })).toBe(true));
  it("rejects a tampered payment or order id", () => {
    expect(verifyCheckoutSignature({ ...base, paymentId: "pay_X", signature: good })).toBe(false);
    expect(verifyCheckoutSignature({ ...base, providerOrderId: "order_X", signature: good })).toBe(false);
  });
  it("rejects wrong secret, empty and wrong-length signatures", () => {
    expect(verifyCheckoutSignature({ ...base, secret: "other", signature: good })).toBe(false);
    expect(verifyCheckoutSignature({ ...base, signature: "" })).toBe(false);
    expect(verifyCheckoutSignature({ ...base, signature: "abc" })).toBe(false);
    expect(verifyCheckoutSignature({ ...base, secret: "", signature: hmac("", "order_A|pay_B") })).toBe(false);
  });
});

describe("Razorpay webhook signature", () => {
  const body = '{"event":"payment.captured"}';
  it("verifies against the raw body", () => {
    expect(verifyWebhookSignature({ rawBody: body, signature: hmac("wh", body), secret: "wh" })).toBe(true);
  });
  it("fails if the body was re-serialised or altered", () => {
    expect(verifyWebhookSignature({ rawBody: '{ "event": "payment.captured" }', signature: hmac("wh", body), secret: "wh" })).toBe(false);
  });
  it("fails closed when signature or secret is missing", () => {
    expect(verifyWebhookSignature({ rawBody: body, signature: null, secret: "wh" })).toBe(false);
    expect(verifyWebhookSignature({ rawBody: body, signature: hmac("", body), secret: "" })).toBe(false);
  });
});
