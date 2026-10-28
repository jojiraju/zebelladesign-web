"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { authFetch } from "@/lib/firebase/client";
import { useQuote } from "@/lib/use-quote";
import { formatINR } from "@/lib/commerce/money";
import { addressSchema } from "@/lib/validation";
import type { Address, ShippingMethod } from "@/lib/types";
import { pay, type PaymentSession } from "./razorpay-client";

const blank: Address = { fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", country: "India" };

function AddressForm({ value, onChange, errors, prefix }: { value: Address; onChange(a: Address): void; errors: Record<string, string>; prefix: string }) {
  const field = (k: keyof Address, label: string, span = false, p: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className={span ? "sm:col-span-2" : ""} key={k}>
      <label className="label" htmlFor={`${prefix}-${k}`}>{label}</label>
      <input id={`${prefix}-${k}`} className="field" aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `${prefix}-${k}-e` : undefined} value={value[k] ?? ""} onChange={(e) => onChange({ ...value, [k]: e.target.value })} {...p} />
      {errors[k] && <p id={`${prefix}-${k}-e`} className="mt-1 text-xs text-danger">{errors[k]}</p>}
    </div>
  );
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {field("fullName", "Full name", false, { autoComplete: "name" })}
      {field("phone", "Mobile number", false, { inputMode: "tel", autoComplete: "tel" })}
      {field("line1", "Address line 1", true, { autoComplete: "address-line1" })}
      {field("line2", "Address line 2 (optional)", true, { autoComplete: "address-line2" })}
      {field("city", "City", false, { autoComplete: "address-level2" })}
      {field("state", "State", false, { autoComplete: "address-level1" })}
      {field("pincode", "PIN code", false, { inputMode: "numeric", maxLength: 6, autoComplete: "postal-code" })}
    </div>
  );
}

function Section({ i, step, setStep, title, children }: { i: number; step: number; setStep(n: number): void; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-7" aria-labelledby={`s${i}`}>
      <button type="button" id={`s${i}`} className="flex w-full items-center gap-4 text-left" onClick={() => i < step && setStep(i)} disabled={i >= step} aria-expanded={i === step}>
        <span className={`grid h-8 w-8 place-items-center rounded-full border text-sm ${i < step ? "border-espresso bg-espresso text-ivory" : i === step ? "border-espresso" : "border-line text-taupe"}`}>{i < step ? <Check size={14} /> : i + 1}</span>
        <span className={`font-serif text-2xl ${i > step ? "text-taupe" : ""}`}>{title}</span>
        {i < step && <span className="ml-auto text-xs uppercase tracking-widest underline">Edit</span>}
      </button>
      {i === step && <div className="mt-6 sm:pl-12">{children}</div>}
    </section>
  );
}

function NextButton({ onClick, label = "Continue" }: { onClick(): void; label?: string }) {
  return <button className="btn btn-solid mt-8" onClick={onClick}>{label} <span className="arrow">→</span></button>;
}

const toAddress = (a: Address): Address => ({ fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2, city: a.city, state: a.state, pincode: a.pincode, country: a.country });

export function CheckoutFlow({ methods, paymentMode, paymentsReady }: { methods: ShippingMethod[]; paymentMode: "test" | "live"; paymentsReady: boolean }) {
  const { user, ready, profile, configured } = useAuth();
  const cart = useCart();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [emailDraft, setEmail] = useState<string | null>(null);
  const [shipDraft, setShipDraft] = useState<Address | null>(null);
  const [bill, setBill] = useState<Address>(blank);
  const [sameBill, setSameBill] = useState(true);
  const [methodId, setMethodId] = useState(methods[0]?.id ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<string | null>(null);
  const { quote, loading, error: quoteError } = useQuote(cart.items, cart.couponCode, methodId);

  useEffect(() => { if (ready && !user && configured) router.replace("/login?next=/checkout"); }, [ready, user, configured, router]);
  // Defaults come from the account until the shopper edits them (derived, so no effect-driven state sync).
  const email = emailDraft ?? user?.email ?? "";
  const saved = profile.addresses?.[0];
  const ship = shipDraft ?? (saved ? toAddress(saved) : blank);
  const setShip = setShipDraft;

  // One idempotency key per distinct order content: double-clicks / retries reuse it, edits get a fresh one.
  const sig = useMemo(() => JSON.stringify([cart.items, cart.couponCode, methodId, ship, sameBill ? null : bill, email]), [cart.items, cart.couponCode, methodId, ship, sameBill, bill, email]);
  const key = useRef<{ sig: string; id: string }>({ sig: "", id: "" });

  function validate(s: number): boolean {
    const e: Record<string, string> = {};
    if (s === 0 && !/^\S+@\S+\.\S+$/.test(email)) e.email = "Enter a valid email address.";
    const check = (a: Address) => { const r = addressSchema.safeParse(a); if (!r.success) r.error.issues.forEach((i) => { e[String(i.path[0])] = i.message; }); };
    if (s === 1) check(ship);
    if (s === 2 && !sameBill) check(bill);
    setErrors(e);
    return Object.keys(e).length === 0;
  }
  const next = () => validate(step) && setStep(step + 1);

  async function payNow() {
    if (key.current.sig !== sig) key.current = { sig, id: crypto.randomUUID().replace(/-/g, "") };
    setPaying(true); setPayError(null);
    try {
      const res = await authFetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({ items: cart.items, couponCode: cart.couponCode || undefined, idempotencyKey: key.current.id, email, shippingAddress: ship, billingAddress: sameBill ? undefined : bill, shippingMethodId: methodId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "We couldn't start your payment.");
      const session = data as PaymentSession;
      setLastOrder(session.orderId);
      const r = await pay(session, { name: ship.fullName, email, contact: ship.phone });
      if (r.state === "paid" || r.state === "pending") { cart.clear(); router.push(`/checkout/success?order=${session.orderId}`); return; }
      if (r.state === "failed") { setPayError(r.message); router.push(`/checkout/failed?order=${session.orderId}&reason=${encodeURIComponent(r.message)}`); return; }
      setPayError("Payment was cancelled. Your bag is saved — you can try again whenever you're ready.");
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally { setPaying(false); }
  }

  if (!configured) return <p className="bg-cream p-6">Checkout is unavailable until Firebase and Razorpay are configured. See the README for setup.</p>;
  if (!ready || !user) return <div className="grid min-h-[40vh] place-items-center"><Loader2 className="animate-spin text-taupe" /></div>;
  if (cart.items.length === 0) return <div className="py-20 text-center"><p className="font-serif text-3xl">Your bag is empty</p><Link href="/shop" className="btn btn-solid mt-8">Continue shopping</Link></div>;

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_26rem]">
      <div>
        {paymentMode === "test" && <p className="mb-6 border border-gold bg-white p-4 text-sm"><b>Test mode.</b> Payments are simulated — no real money moves. Use Razorpay test card 4111 1111 1111 1111, any future expiry and any CVV.</p>}
        {!paymentsReady && <p role="alert" className="mb-6 bg-red-50 p-4 text-sm text-danger">Payments are not configured on this server yet (missing Razorpay keys).</p>}

        <Section i={0} step={step} setStep={setStep} title="Contact">
          <label className="label" htmlFor="c-email">Email</label>
          <input id="c-email" type="email" className="field max-w-md" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-invalid={!!errors.email} />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
          <NextButton onClick={next} />
        </Section>
        <Section i={1} step={step} setStep={setStep} title="Shipping address">
          {!!profile.addresses?.length && (
            <div className="mb-5 flex flex-wrap gap-2">{profile.addresses.map((a) => <button key={a.id} type="button" className="border border-line px-3 py-2 text-left text-xs hover:border-espresso" onClick={() => setShip(toAddress(a))}>{a.fullName}, {a.city}</button>)}</div>
          )}
          <AddressForm value={ship} onChange={setShip} errors={errors} prefix="ship" /><NextButton onClick={next} />
        </Section>
        <Section i={2} step={step} setStep={setStep} title="Billing address">
          <label className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#8f4a5b]" checked={sameBill} onChange={(e) => setSameBill(e.target.checked)} /> Same as shipping address</label>
          {!sameBill && <div className="mt-5"><AddressForm value={bill} onChange={setBill} errors={errors} prefix="bill" /></div>}<NextButton onClick={next} />
        </Section>
        <Section i={3} step={step} setStep={setStep} title="Delivery method">
          <div className="space-y-3" role="radiogroup" aria-label="Delivery method">
            {methods.map((m) => (
              <label key={m.id} className={`flex cursor-pointer items-center justify-between gap-4 border p-4 ${methodId === m.id ? "border-espresso bg-white" : "border-line"}`}>
                <span className="flex items-center gap-3"><input type="radio" name="method" checked={methodId === m.id} onChange={() => setMethodId(m.id)} className="accent-[#8f4a5b]" /><span><b className="font-medium">{m.label}</b><br /><span className="text-sm text-taupe-deep">{m.eta}</span></span></span>
                <span>{m.fee === 0 ? "Free" : formatINR(m.fee)}{m.freeAbove ? <span className="block text-xs text-taupe-deep">Free over {formatINR(m.freeAbove)}</span> : null}</span>
              </label>
            ))}
          </div><NextButton onClick={next} label="Review order" />
        </Section>
        <Section i={4} step={step} setStep={setStep} title="Review & pay">
          <p className="text-sm text-taupe-deep">Delivering to <b className="text-espresso">{ship.fullName}</b>, {ship.line1}, {ship.city} {ship.pincode}. Confirmation will be sent to <b className="text-espresso">{email}</b>.</p>
          {payError && <p role="alert" className="mt-5 bg-red-50 p-4 text-sm text-danger">{payError} {lastOrder && <Link className="underline" href={`/account/orders/${lastOrder}`}>View order</Link>}</p>}
          <button className="btn btn-solid mt-8 w-full sm:w-auto sm:min-w-72" disabled={paying || !paymentsReady || !quote?.valid || loading} onClick={payNow}>
            {paying ? <><Loader2 className="animate-spin" size={16} /> Opening secure payment…</> : <>Pay {quote ? formatINR(quote.total) : ""} securely</>}
          </button>
          <p className="mt-4 flex items-center gap-2 text-xs text-taupe-deep"><ShieldCheck size={14} /> Payments are processed by Razorpay. We never see or store your card details.</p>
        </Section>
      </div>

      <aside aria-label="Order summary" className="h-fit bg-white p-6 lg:sticky lg:top-28" aria-busy={loading}>
        <h2 className="font-serif text-2xl">Order summary</h2>
        {quoteError && <p role="alert" className="mt-3 text-sm text-danger">{quoteError}</p>}
        <ul className="mt-5 divide-y divide-line">
          {quote?.lines.map((l) => (
            <li key={l.productId + l.variantId} className="flex gap-3 py-3 text-sm">
              <div className="relative aspect-[3/4] w-14 shrink-0 bg-cream">{l.image && <Image src={l.image} alt="" fill sizes="56px" className="object-cover" />}<span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-espresso text-[0.65rem] text-ivory">{l.quantity}</span></div>
              <div className="flex-1"><p className="font-serif text-lg leading-tight">{l.name}</p><p className="text-xs text-taupe-deep">{[l.size, l.color].filter(Boolean).join(" · ")}</p>{l.issue && <p className="text-xs text-danger">{l.issue}</p>}</div>
              <p className="tabular-nums">{l.issue ? "—" : formatINR(l.lineTotal)}</p>
            </li>
          ))}
        </ul>
        {quote && (
          <dl className={`mt-4 space-y-1 border-t border-line pt-4 text-sm ${loading ? "opacity-60" : ""}`}>
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatINR(quote.subtotal)}</dd></div>
            {quote.discount > 0 && <div className="flex justify-between text-ok"><dt>Discount {quote.couponCode && `(${quote.couponCode})`}</dt><dd>−{formatINR(quote.discount)}</dd></div>}
            <div className="flex justify-between"><dt>Shipping</dt><dd>{quote.shipping ? formatINR(quote.shipping) : "Complimentary"}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 font-serif text-2xl"><dt>Total</dt><dd>{formatINR(quote.total)}</dd></div>
            {quote.taxIncluded > 0 && <p className="text-xs text-taupe-deep">Includes {formatINR(quote.taxIncluded)} GST</p>}
          </dl>
        )}
        <p className="mt-4 text-xs text-taupe-deep">The amount charged is calculated again on our server when you pay.</p>
      </aside>
    </div>
  );
}
