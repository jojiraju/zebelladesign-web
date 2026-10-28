"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authFetch } from "@/lib/firebase/client";
import { pay, type PaymentSession } from "./razorpay-client";

/** Re-opens payment for an existing unpaid order (server confirms the stock hold is still valid). */
export function RetryPaymentButton({ orderId, email }: { orderId: string; email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function retry() {
    setBusy(true); setError(null);
    try {
      const res = await authFetch("/api/checkout/retry", { method: "POST", body: JSON.stringify({ orderId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not restart payment.");
      const r = await pay(data as PaymentSession, { email });
      if (r.state === "paid" || r.state === "pending") router.push(`/checkout/success?order=${orderId}`);
      else if (r.state === "failed") setError(r.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not restart payment.");
    } finally { setBusy(false); }
  }

  return (
    <div>
      <button className="btn btn-solid" onClick={retry} disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : "Retry payment"}</button>
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
