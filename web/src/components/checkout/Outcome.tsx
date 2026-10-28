"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { db } from "@/lib/firebase/client";
import { formatINR } from "@/lib/commerce/money";
import { RetryPaymentButton } from "./RetryPayment";
import type { Order } from "@/lib/types";

/** Live view of the order: shows "confirmed" only when the SERVER has marked it paid (not on browser redirect alone). */
export function SuccessView({ orderId }: { orderId: string }) {
  const { user, ready } = useAuth();
  const cart = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!user) return;
    const off = onSnapshot(doc(db(), "orders", orderId), (s) => setOrder(s.exists() ? ({ ...(s.data() as Order), id: s.id }) : null), () => setOrder(null));
    const t = setTimeout(() => setTimedOut(true), 45_000);
    return () => { off(); clearTimeout(t); };
  }, [user, orderId]);

  const paid = order?.paymentStatus === "paid";
  useEffect(() => { if (paid) cart.clear(); }, [paid]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return null;
  if (paid && order)
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <CheckCircle2 className="mx-auto text-ok" size={44} strokeWidth={1.2} />
        <h1 className="mt-6 font-serif text-5xl">Thank you</h1>
        <p className="mt-4 text-taupe-deep">Your payment of <b>{formatINR(order.total)}</b> was received for order <b>{order.id}</b>. A confirmation has been sent to {order.email}.</p>
        {order.paymentMode === "test" && <p className="mt-4 text-sm text-gold-deep">This was a TEST payment — no real money was charged.</p>}
        <div className="mt-10 flex flex-wrap justify-center gap-3"><Link href={`/account/orders/${order.id}`} className="btn btn-solid">View order</Link><Link href="/shop" className="btn btn-ghost">Continue shopping</Link></div>
      </div>
    );
  return (
    <div className="mx-auto max-w-xl py-20 text-center">
      {timedOut ? <XCircle className="mx-auto text-gold-deep" size={44} strokeWidth={1.2} /> : <Loader2 className="mx-auto animate-spin text-taupe" size={40} />}
      <h1 className="mt-6 font-serif text-4xl">{timedOut ? "We're still confirming your payment" : "Confirming your payment…"}</h1>
      <p className="mt-4 text-taupe-deep">{timedOut ? "Your bank may be slow to respond. If money was debited, your order will be confirmed automatically and we'll email you. Check your orders page in a few minutes." : "Please don't close this page."}</p>
      <Link href="/account/orders" className="btn btn-ghost mt-8">Go to my orders</Link>
    </div>
  );
}

export function FailedView({ orderId, reason, email }: { orderId?: string; reason?: string; email?: string }) {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-xl py-20 text-center">
      <XCircle className="mx-auto text-danger" size={44} strokeWidth={1.2} />
      <h1 className="mt-6 font-serif text-5xl">Payment unsuccessful</h1>
      <p className="mt-4 text-taupe-deep">{reason || "Your payment didn't go through."} You have not been charged for a failed payment; if money was debited it is usually returned by your bank within a few working days.</p>
      <div className="mt-10 flex flex-wrap items-start justify-center gap-3">
        {orderId && user && <RetryPaymentButton orderId={orderId} email={email ?? user.email ?? ""} />}
        <Link href="/cart" className="btn btn-ghost">Return to bag</Link>
      </div>
    </div>
  );
}
