"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, CircleHelp, Loader2, Mail, PackageCheck, ShoppingBag, Truck, XCircle } from "lucide-react";
import { ART } from "@/lib/art";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { apiJson } from "@/lib/api/client";
import { formatINR } from "@/lib/commerce/money";
import { RetryPaymentButton } from "./RetryPayment";
import type { Order } from "@/lib/types";

const card = "rounded-2xl border border-line bg-white shadow-[0_18px_40px_-34px_rgba(143,74,91,.6)]";

const NEXT = [
  { icon: Mail, title: "Confirmation email", text: "A receipt is on its way to your inbox." },
  { icon: PackageCheck, title: "Packed with care", text: "We inspect and pack every piece by hand." },
  { icon: Truck, title: "On its way", text: "You'll get tracking details once it ships." },
];

/** Live view of the order: shows "confirmed" only when the SERVER has marked it paid (not on browser redirect alone). */
export function SuccessView({ orderId }: { orderId: string }) {
  const { user, ready } = useAuth();
  const cart = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Poll GET /orders/:id until the server reports the payment as received.
    let live = true;
    const load = () => apiJson<Order>(`/orders/${encodeURIComponent(orderId)}`, { method: "GET" })
      .then((o) => { if (live) setOrder(o); }).catch(() => undefined);
    void load();
    const poll = setInterval(load, 3_000);
    const t = setTimeout(() => setTimedOut(true), 45_000);
    return () => { live = false; clearInterval(poll); clearTimeout(t); };
  }, [user, orderId]);

  const paid = order?.paymentStatus === "paid";
  useEffect(() => { if (paid) cart.clear(); }, [paid]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return null;

  if (paid && order) {
    const a = order.shippingAddress;
    return (
      <div className="py-8 sm:py-14">
        {/* Celebration header */}
        <header className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-gold via-gold-deep to-wine px-6 py-12 text-center text-ivory shadow-[0_30px_70px_-40px_rgba(143,74,91,.7)] sm:py-16">
          <div aria-hidden className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-ivory/10" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full border border-ivory/20" />
          <span className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-ivory text-gold-deep ring-8 ring-ivory/20"><Check size={38} strokeWidth={2.2} aria-hidden /></span>
          <p className="relative mt-6 text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-ivory/80">Order confirmed</p>
          <h1 className="relative mt-2 font-serif text-4xl sm:text-6xl">Thank you{order.shippingAddress.fullName ? `, ${order.shippingAddress.fullName.split(" ")[0]}` : ""}</h1>
          <p className="relative mx-auto mt-4 max-w-lg text-ivory/85">Your payment of <b className="text-ivory">{formatINR(order.total)}</b> was received for order <b className="text-ivory">{order.id}</b>. A confirmation has been sent to {order.email}.</p>
          {order.paymentMode === "test" && <p className="relative mx-auto mt-4 inline-block rounded-full bg-ivory/15 px-4 py-1.5 text-xs">This was a TEST payment — no real money was charged.</p>}
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link href={`/account/orders/${order.id}`} className="btn btn-light">View order <ArrowRight size={15} className="arrow" aria-hidden /></Link>
            <Link href="/shop" className="btn btn-outline-light">Continue shopping</Link>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_24rem]">
          <section className={`${card} p-5 sm:p-7`} aria-label="Your items">
            <h2 className="mb-4 font-serif text-2xl">Your pieces</h2>
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.productId + i.variantId} className="flex gap-4 py-4 first:pt-0">
                  <span className="relative block aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-xl bg-cream"><Image src={i.image || ART.productPlaceholder} alt="" fill sizes="80px" className="object-cover object-top" /></span>
                  <div className="min-w-0 flex-1"><p className="font-serif text-xl leading-tight">{i.name}</p><p className="mt-1 text-xs uppercase tracking-widest text-taupe-deep">{[i.size, i.color].filter(Boolean).join(" · ")} · Qty {i.quantity}</p></div>
                  <p className="tabular-nums">{formatINR(i.lineTotal)}</p>
                </li>
              ))}
            </ul>
          </section>

          <aside className="space-y-6">
            <div className={`${card} p-6 text-sm leading-6`}><p className="label">Delivering to</p><p className="font-medium">{a.fullName}</p><p>{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p><p>{a.city}, {a.state} {a.pincode}</p><p className="text-taupe-deep">{a.phone}</p></div>
            <dl className={`${card} space-y-1.5 p-6 text-sm`}>
              <div className="flex justify-between"><dt className="text-taupe-deep">Subtotal</dt><dd>{formatINR(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between text-ok"><dt>Discount {order.couponCode && `(${order.couponCode})`}</dt><dd>−{formatINR(order.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-taupe-deep">Shipping</dt><dd>{order.shipping ? formatINR(order.shipping) : <span className="text-ok">Complimentary</span>}</dd></div>
              <div className="flex items-baseline justify-between border-t border-dashed border-line pt-3"><dt className="font-serif text-xl">Total paid</dt><dd className="font-serif text-2xl">{formatINR(order.total)}</dd></div>
            </dl>
          </aside>
        </div>

        <section className="mt-8" aria-label="What happens next">
          <h2 className="mb-4 font-serif text-2xl">What happens next</h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {NEXT.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className={`${card} flex gap-4 p-5`}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blush to-rose-soft/60 text-gold-deep"><Icon size={19} strokeWidth={1.6} aria-hidden /></span>
                <span><span className="block text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold-deep">Step {i + 1}</span><span className="block font-medium">{title}</span><span className="block text-sm text-taupe-deep">{text}</span></span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl py-16 sm:py-24">
      <div className={`${card} px-6 py-12 text-center sm:px-10`}>
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-blush to-rose-soft/50 text-gold-deep">
          {timedOut ? <CircleHelp size={34} strokeWidth={1.4} aria-hidden /> : <Loader2 className="animate-spin" size={32} aria-hidden />}
        </span>
        <h1 className="mt-6 font-serif text-3xl sm:text-4xl">{timedOut ? "We're still confirming your payment" : "Confirming your payment…"}</h1>
        <p className="mt-4 text-taupe-deep">{timedOut ? "Your bank may be slow to respond. If money was debited, your order will be confirmed automatically and we'll email you. Check your orders page in a few minutes." : "Please don't close this page."}</p>
        <Link href="/account/orders" className="btn btn-ghost mt-8">Go to my orders</Link>
      </div>
    </div>
  );
}

export function FailedView({ orderId, reason, email }: { orderId?: string; reason?: string; email?: string }) {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-xl py-16 sm:py-24">
      <div className={`${card} overflow-hidden text-center`}>
        <div className="bg-gradient-to-br from-red-50 to-blush/60 px-6 py-10">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white text-danger shadow-sm ring-8 ring-red-100/70"><XCircle size={38} strokeWidth={1.5} aria-hidden /></span>
          <h1 className="mt-6 font-serif text-3xl sm:text-5xl">Payment unsuccessful</h1>
        </div>
        <div className="px-6 py-8 sm:px-10">
          <p className="text-taupe-deep">{reason || "Your payment didn't go through."} You have not been charged for a failed payment; if money was debited it is usually returned by your bank within a few working days.</p>
          <div className="mt-8 flex flex-wrap items-start justify-center gap-3">
            {orderId && user && <RetryPaymentButton orderId={orderId} email={email ?? user.email ?? ""} />}
            <Link href="/cart" className="btn btn-ghost"><ShoppingBag size={15} aria-hidden /> Return to bag</Link>
          </div>
          <p className="mt-8 text-xs text-taupe-deep">Need help? <Link href="/contact" className="underline">Contact us</Link> and we&apos;ll sort it out.</p>
        </div>
      </div>
    </div>
  );
}
