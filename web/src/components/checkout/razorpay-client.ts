"use client";
import { authFetch } from "@/lib/firebase/client";

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
 * it is forwarded to /api/checkout/verify, which verifies the signature AND re-fetches the payment from Razorpay.
 */
export async function pay(session: PaymentSession, prefill: { name?: string; email?: string; contact?: string }): Promise<PayResult> {
  await loadScript();
  return new Promise<PayResult>((resolve) => {
    const rzp = new window.Razorpay!({
      key: session.publicKey, amount: session.amount, currency: session.currency, order_id: session.providerOrderId,
      name: "Zebella Designs", description: `Order ${session.orderId}`, prefill, theme: { color: "#231A1D" },
      modal: { ondismiss: () => resolve({ state: "dismissed" }) },
      handler: async (r: RzpResponse) => {
        try {
          const res = await authFetch("/api/checkout/verify", { method: "POST", body: JSON.stringify({ orderId: session.orderId, ...r }) });
          const data = await res.json();
          if (!res.ok) return resolve({ state: "failed", message: data.error ?? "We could not confirm your payment." });
          resolve({ state: data.state === "paid" ? "paid" : "pending", orderId: session.orderId });
        } catch {
          // Payment may have succeeded; the webhook will still confirm it. Tell the user honestly.
          resolve({ state: "pending", orderId: session.orderId });
        }
      },
    });
    rzp.on("payment.failed", (r) => resolve({ state: "failed", message: r.error?.description ?? "The payment did not go through." }));
    rzp.open();
  });
}
