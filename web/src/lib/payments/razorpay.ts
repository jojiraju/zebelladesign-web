import "server-only";
import Razorpay from "razorpay";
import { HttpError } from "../server/http";
import type { PaymentProvider } from "./provider";
import { verifyCheckoutSignature } from "./signature";

export const razorpayMode = (): "test" | "live" =>
  (process.env.RAZORPAY_KEY_ID ?? "").startsWith("rzp_live_") ? "live" : "test";

export function isRazorpayConfigured(): boolean {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function client() {
  if (!isRazorpayConfigured()) throw new HttpError(503, "Payments are not configured yet.", "PAYMENTS_NOT_CONFIGURED");
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
}

export const razorpayProvider: PaymentProvider = {
  name: "razorpay",
  mode: razorpayMode,

  async createOrder({ receipt, amount, notes }) {
    const o = await client().orders.create({ amount, currency: "INR", receipt, notes });
    return {
      providerOrderId: o.id,
      amount: Number(o.amount),
      currency: "INR",
      publicKey: process.env.RAZORPAY_KEY_ID!, // key id is public by design; the secret never leaves the server
      mode: razorpayMode(),
    };
  },

  verifyCheckout({ providerOrderId, paymentId, signature }) {
    return verifyCheckoutSignature({
      providerOrderId,
      paymentId,
      signature,
      secret: process.env.RAZORPAY_KEY_SECRET ?? "",
    });
  },

  async fetchPayment(paymentId) {
    const p = await client().payments.fetch(paymentId);
    return {
      id: p.id,
      orderId: String(p.order_id ?? ""),
      status: String(p.status),
      amount: Number(p.amount),
      amountRefunded: Number(p.amount_refunded ?? 0),
    };
  },

  async refund({ paymentId, amount, notes }) {
    const r = await client().payments.refund(paymentId, { amount, notes });
    return { id: r.id, amount: Number(r.amount), status: String(r.status) };
  },
};

export const paymentProvider: PaymentProvider = razorpayProvider;
