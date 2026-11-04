"use client";
import { ApiError, apiJson } from "@/lib/api/client";

export interface PaymentSession {
  orderId: string; providerOrderId: string; amount: number; currency: "INR"; publicKey: string; mode: "test" | "live"; email: string;
}

interface RzpResponse { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }
interface RzpInstance { open(): void; on(evt: "payment.failed", cb: (r: { error?: { description?: string } }) => void): void }
declare global { interface Window { Razorpay?: new (opts: Record<string, unknown>) => RzpInstance } }

let loading: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { loading = null; reject(new Error("Could not load the payment window. Check your connection and try again.")); };
    document.body.appendChild(s);
  });
  return loading;
}

export type PayResult = { state: "paid" | "pending"; orderId: string } | { state: "dismissed" } | { state: "failed"; message: string };

/**
 * Opens Razorpay Checkout for a server-created order. The browser's success callback is only a hint:
 * it is forwarded to POST /checkout/verify on the backend, which verifies the signature AND re-fetches the payment from Razorpay.
 */
export async function pay(session: PaymentSession, prefill: { name?: string; email?: string; contact?: string }): Promise<PayResult> {
  await loadScript();
  return new Promise<PayResult>((resolve) => {
    // Razorpay keeps its window open after a failed attempt so the shopper can retry there, so a failure is only
    // final once they close it. Reporting it earlier would show "failed" behind a window that can still take payment.
    let lastFailure: string | null = null;
    const rzp = new window.Razorpay!({
      key: session.publicKey, amount: session.amount, currency: session.currency, order_id: session.providerOrderId,
      name: "Zebella Designs", description: `Order ${session.orderId}`, prefill, theme: { color: "#231A1D" },
      modal: { ondismiss: () => resolve(lastFailure ? { state: "failed", message: lastFailure } : { state: "dismissed" }) },
      handler: async (r: RzpResponse) => {
        try {
          const data = await apiJson<{ state?: string }>("/checkout/verify", { json: { orderId: session.orderId, ...r } });
          resolve({ state: data.state === "paid" ? "paid" : "pending", orderId: session.orderId });
        } catch (e) {
          if (e instanceof ApiError && e.status < 500) return resolve({ state: "failed", message: e.message });
          // Payment may have succeeded (network or server trouble); the webhook will still confirm it. Tell the user honestly.
          resolve({ state: "pending", orderId: session.orderId });
        }
      },
    });
    rzp.on("payment.failed", (r) => { lastFailure = r.error?.description ?? "The payment did not go through."; });
    rzp.open();
  });
}
