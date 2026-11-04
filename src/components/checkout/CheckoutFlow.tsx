"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ChevronDown, CircleAlert, Loader2, Lock, Mail, MapPin, RotateCcw, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { ART } from "@/lib/art";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { apiJson, friendlyError, useMockApi } from "@/lib/api/client";
import { rememberCheckout } from "@/lib/checkout-marker";
import { useQuote } from "@/lib/use-quote";
import { formatINR } from "@/lib/commerce/money";
import { addressSchema } from "@/lib/validation";
import type { Address, Quote, ShippingMethod } from "@/lib/types";
import { Summary, TrustRow } from "@/components/cart/parts";
import { pay, type PaymentSession } from "./razorpay-client";

const blank: Address = { fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", country: "India" };
const STEPS = ["Contact", "Shipping", "Billing", "Delivery", "Payment"] as const;
const card = "rounded-2xl border border-line bg-white shadow-[0_18px_40px_-34px_rgba(143,74,91,.6)]";
const addrLine = (a: Address) => `${a.fullName}, ${a.line1}, ${a.city} ${a.pincode}`;

function AddressForm({ value, onChange, errors, prefix }: { value: Address; onChange(a: Address): void; errors: Record<string, string>; prefix: string }) {
  const field = (k: keyof Address, label: string, span = false, p: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className={span ? "sm:col-span-2" : ""} key={k}>
      <label className="label" htmlFor={`${prefix}-${k}`}>{label}</label>
      <input id={`${prefix}-${k}`} className="field !min-h-12" aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `${prefix}-${k}-e` : undefined} value={value[k] ?? ""} onChange={(e) => onChange({ ...value, [k]: e.target.value })} {...p} />
      {errors[k] && <p id={`${prefix}-${k}-e`} className="mt-1 flex items-center gap-1.5 text-xs text-danger"><CircleAlert size={13} aria-hidden />{errors[k]}</p>}
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

/** One step: a card that opens when active and collapses to a one-line summary once completed. */
function Section({ i, step, setStep, title, summary, children }: { i: number; step: number; setStep(n: number): void; title: string; summary?: string; children: React.ReactNode }) {
  const done = i < step, active = i === step;
  return (
    <section className={`${card} ${active ? "ring-2 ring-gold/40" : ""} p-5 sm:p-7`} aria-labelledby={`s${i}`}>
      <button type="button" id={`s${i}`} className="flex w-full items-center gap-4 text-left" onClick={() => done && setStep(i)} disabled={!done} aria-expanded={active}>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-medium transition ${done ? "bg-gradient-to-br from-gold to-gold-deep text-white" : active ? "bg-espresso text-ivory" : "bg-cream text-taupe-deep"}`}>{done ? <Check size={16} aria-hidden /> : i + 1}</span>
        <span className="min-w-0 flex-1">
          <span className={`block font-serif text-xl sm:text-2xl ${!done && !active ? "text-taupe" : ""}`}>{title}</span>
          {done && summary && <span className="mt-0.5 block truncate text-sm text-taupe-deep">{summary}</span>}
        </span>
        {done && <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-gold-deep underline underline-offset-4">Edit</span>}
      </button>
      {active && <div className="mt-6 sm:pl-[3.25rem]">{children}</div>}
    </section>
  );
}

/** Action row for a step: Back (optional) + Continue, with a quiet progress hint on the right. */
function NextButton({ onClick, label = "Continue", onBack, hint }: { onClick(): void; label?: string; onBack?(): void; hint?: string }) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-dashed border-line pt-6">
      {onBack && <button type="button" className="btn btn-ghost" onClick={onBack}><ArrowLeft size={15} aria-hidden /> Back</button>}
      <button type="button" className="btn btn-solid" onClick={onClick}>{label} <ArrowRight size={16} className="arrow" aria-hidden /></button>
      {hint && <span className="ml-auto hidden text-xs text-taupe-deep sm:inline">{hint}</span>}
    </div>
  );
}

/** Small reassurance cards shown inside steps. */
function InfoCards({ items }: { items: { icon: typeof Mail; title: string; text: string }[] }) {
  return (
    <ul className="mt-6 grid gap-3 sm:grid-cols-3">
      {items.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex gap-3 rounded-xl bg-blush/40 p-3.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-gold-deep"><Icon size={16} strokeWidth={1.6} aria-hidden /></span>
          <span className="text-xs leading-5"><b className="block text-sm font-medium text-espresso">{title}</b><span className="text-taupe-deep">{text}</span></span>
        </li>
      ))}
    </ul>
  );
}

const toAddress = (a: Address): Address => ({ fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2, city: a.city, state: a.state, pincode: a.pincode, country: a.country });

/** Rose header band: title, reassurance and the step tracker. */
function Band({ step, total }: { step?: number; total?: string }) {
  return (
    <header className="relative mb-8 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-gold via-gold-deep to-wine p-6 text-ivory shadow-[0_30px_70px_-40px_rgba(143,74,91,.7)] sm:mb-10 sm:p-9">
      <div aria-hidden className="pointer-events-none absolute -right-12 -top-20 h-72 w-72 rounded-full bg-ivory/10" />
      <div aria-hidden className="pointer-events-none absolute -bottom-28 right-32 h-60 w-60 rounded-full border border-ivory/20" />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-ivory/80"><Lock size={13} aria-hidden /> Secure checkout</p>
          <h1 className="mt-2 font-serif text-4xl sm:text-6xl">Checkout</h1>
          <p className="mt-2 text-sm text-ivory/80">Just a few steps to make it yours.</p>
        </div>
        {total && <div className="rounded-2xl bg-ivory/15 px-5 py-3 text-right backdrop-blur"><p className="text-[0.65rem] uppercase tracking-[0.2em] text-ivory/75">Order total</p><p className="font-serif text-3xl tabular-nums">{total}</p></div>}
      </div>
      {step !== undefined && (
        <>
          <ol className="relative mt-7 hidden items-center sm:flex" aria-label="Checkout progress">
            {STEPS.map((s, i) => (
              <li key={s} className="flex flex-1 items-center last:flex-none">
                <span className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] ${i <= step ? "text-ivory" : "text-ivory/55"}`}>
                  <span className={`grid h-7 w-7 place-items-center rounded-full text-[0.7rem] ${i < step ? "bg-ivory text-gold-deep" : i === step ? "bg-ivory text-espresso ring-4 ring-ivory/30" : "bg-ivory/15"}`}>{i < step ? <Check size={13} aria-hidden /> : i + 1}</span>{s}
                </span>
                {i < STEPS.length - 1 && <span className={`mx-3 h-px flex-1 ${i < step ? "bg-ivory/80" : "bg-ivory/25"}`} aria-hidden />}
              </li>
            ))}
          </ol>
          <div className="relative mt-6 sm:hidden" aria-label="Checkout progress">
            <p className="text-sm text-ivory/85">Step {step + 1} of {STEPS.length} · <b className="text-ivory">{STEPS[step]}</b></p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ivory/25"><div className="h-full rounded-full bg-ivory transition-[width] duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
          </div>
        </>
      )}
    </header>
  );
}

function OrderItems({ quote }: { quote: Quote | null }) {
  return (
    <ul className="divide-y divide-line">
      {quote?.lines.map((l) => (
        <li key={l.productId + l.variantId} className="flex gap-3.5 py-3.5 text-sm first:pt-0">
          <div className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-lg bg-cream"><Image src={l.image || ART.productPlaceholder} alt="" fill sizes="64px" className="object-cover object-top" /><span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-espresso px-1 text-[0.65rem] text-ivory">{l.quantity}</span></div>
          <div className="min-w-0 flex-1"><p className="truncate font-serif text-lg leading-tight">{l.name}</p><p className="mt-0.5 text-xs text-taupe-deep">{[l.size, l.color].filter(Boolean).join(" · ")}</p>{l.issue && <p className="text-xs text-danger">{l.issue}</p>}</div>
          <p className="tabular-nums">{l.issue ? "—" : formatINR(l.lineTotal)}</p>
        </li>
      ))}
    </ul>
  );
}

export function CheckoutFlow({ methods }: { methods: ShippingMethod[] }) {
  const { user, ready, profile, configured, logout } = useAuth();
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
  const method = methods.find((m) => m.id === methodId);
  const accountName = profile.displayName || user?.displayName || user?.username || "";
  async function switchAccount() { await logout(); router.push("/login?next=/checkout"); }

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
      const session = await apiJson<PaymentSession>("/checkout", {
        json: { items: cart.items, couponCode: cart.couponCode || undefined, idempotencyKey: key.current.id, email, shippingAddress: ship, billingAddress: sameBill ? undefined : bill, shippingMethodId: methodId },
      });
      setLastOrder(session.orderId);
      rememberCheckout(session.orderId, cart.items);
      const r = await pay(session, { name: ship.fullName, email, contact: ship.phone });
      if (r.state === "paid" || r.state === "pending") { cart.clear(); router.push(`/checkout/success?order=${session.orderId}`); return; }
      if (r.state === "failed") { setPayError(r.message); router.push(`/checkout/failed?order=${session.orderId}&reason=${encodeURIComponent(r.message)}`); return; }
      setPayError("Payment was cancelled. Your bag is saved — you can try again whenever you're ready.");
    } catch (e) {
      setPayError(friendlyError(e, "We couldn't start your payment. Please check your connection and try again."));
    } finally { setPaying(false); }
  }

  if (!configured) return <><Band /><p className="rounded-2xl bg-cream p-6">Checkout is unavailable until the store backend is configured. See the README for setup.</p></>;
  if (!ready || !user) return <><Band /><div className="grid min-h-[30vh] place-items-center"><Loader2 className="animate-spin text-taupe" /></div></>;
  if (cart.items.length === 0) return (
    <><Band />
    <div className="grid place-items-center py-14 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-blush to-rose-soft/50 text-gold-deep"><ShoppingBag size={30} strokeWidth={1.4} aria-hidden /></span>
      <p className="mt-6 font-serif text-4xl">Your bag is empty</p><p className="mt-2 text-taupe-deep">Add something beautiful before checking out.</p>
      <Link href="/shop" className="btn btn-solid mt-8">Continue shopping</Link>
    </div></>
  );

  const summaryCard = (
    <>
      <OrderItems quote={quote} />
      {quoteError && <p role="alert" className="mt-3 text-sm text-danger">{quoteError}</p>}
      <div className="mt-5 border-t border-dashed border-line pt-4"><Summary quote={quote} loading={loading} /></div>
    </>
  );

  return (
    <>
    <Band step={step} total={quote ? formatINR(quote.total) : undefined} />
    <div className="grid gap-8 lg:grid-cols-[1fr_26rem] lg:gap-10">
      <div className="space-y-4">
        {/* Mobile order summary */}
        <details className={`${card} lg:hidden`}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm">
            <span className="inline-flex items-center gap-2"><ShoppingBag size={16} className="text-gold-deep" aria-hidden />Show order summary <ChevronDown size={15} aria-hidden /></span>
            <b className="font-serif text-xl">{quote ? formatINR(quote.total) : "—"}</b>
          </summary>
          <div className="border-t border-line p-4">{summaryCard}</div>
        </details>

        <Section i={0} step={step} setStep={setStep} title="Contact" summary={email}>
          {user && (
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-gradient-to-r from-blush/60 to-white p-4">
              <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-deep font-serif text-xl text-white">{(accountName[0] ?? "Z").toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-taupe-deep">Signed in as</p>
                <p className="truncate font-medium">{accountName}</p>
                {user.username && <p className="truncate text-xs text-taupe-deep">@{user.username}</p>}
              </div>
              <button type="button" onClick={switchAccount} className="text-xs text-taupe-deep underline underline-offset-4 hover:text-espresso">Not you? Switch account</button>
            </div>
          )}

          <div className="mt-6 max-w-xl">
            <label className="label" htmlFor="c-email">Email address</label>
            <div className="relative">
              <Mail size={17} strokeWidth={1.6} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-taupe-deep" />
              <input id="c-email" type="email" className="field !min-h-12 !pl-11" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} aria-describedby="c-email-h" />
            </div>
            {errors.email && <p className="mt-1.5 flex items-center gap-1.5 text-xs text-danger"><CircleAlert size={13} aria-hidden />{errors.email}</p>}
            <p id="c-email-h" className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-taupe-deep"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-gold-deep" aria-hidden />We&apos;ll send your receipt, order confirmation and tracking updates here. Your email is never shared.</p>
          </div>

          <InfoCards items={[
            { icon: Mail, title: "Order updates", text: "Receipt and confirmation straight to your inbox." },
            { icon: Truck, title: "Live tracking", text: "Follow your parcel from dispatch to your doorstep." },
            { icon: RotateCcw, title: "Easy returns", text: "7 days to return unworn pieces with tags." },
          ]} />
          <NextButton onClick={next} hint="Step 1 of 5 · takes about 2 minutes" />
        </Section>

        <Section i={1} step={step} setStep={setStep} title="Shipping address" summary={addrLine(ship)}>
          {!!profile.addresses?.length && (
            <div className="mb-5 grid gap-3 sm:grid-cols-2">{profile.addresses.map((a) => (
              <button key={a.id} type="button" onClick={() => setShip(toAddress(a))} className="flex items-start gap-3 rounded-xl border border-line p-3.5 text-left text-sm transition hover:border-gold">
                <MapPin size={16} className="mt-0.5 shrink-0 text-gold-deep" aria-hidden /><span><b className="block font-medium">{a.fullName}</b><span className="text-taupe-deep">{a.line1}, {a.city}</span></span>
              </button>
            ))}</div>
          )}
          <p className="mb-5 flex items-start gap-2 rounded-xl bg-blush/40 p-3.5 text-xs leading-5 text-taupe-deep"><Truck size={15} className="mt-0.5 shrink-0 text-gold-deep" aria-hidden /><span>We deliver across India{methods[0]?.eta ? <> in <b className="font-medium text-espresso">{methods[0].eta}</b></> : null}.{methods[0]?.freeAbove ? <> Complimentary shipping on orders over <b className="font-medium text-espresso">{formatINR(methods[0].freeAbove)}</b>.</> : null} Please double-check your PIN code.</span></p>
          <AddressForm value={ship} onChange={setShip} errors={errors} prefix="ship" /><NextButton onClick={next} onBack={() => setStep(0)} hint="Step 2 of 5" />
        </Section>

        <Section i={2} step={step} setStep={setStep} title="Billing address" summary={sameBill ? "Same as shipping address" : addrLine(bill)}>
          <label className="flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#8f4a5b]" checked={sameBill} onChange={(e) => setSameBill(e.target.checked)} /> Same as shipping address</label>
          {!sameBill && <div className="mt-5"><AddressForm value={bill} onChange={setBill} errors={errors} prefix="bill" /></div>}<NextButton onClick={next} onBack={() => setStep(1)} hint="Step 3 of 5" />
        </Section>

        <Section i={3} step={step} setStep={setStep} title="Delivery method" summary={method ? `${method.label} · ${method.eta}` : undefined}>
          <div className="space-y-3" role="radiogroup" aria-label="Delivery method">
            {methods.map((m) => (
              <label key={m.id} className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 transition ${methodId === m.id ? "border-gold bg-blush/40 ring-1 ring-gold/40" : "border-line hover:border-taupe"}`}>
                <span className="flex items-center gap-3"><input type="radio" name="method" checked={methodId === m.id} onChange={() => setMethodId(m.id)} className="accent-[#8f4a5b]" /><Truck size={18} className="text-gold-deep" aria-hidden /><span><b className="font-medium">{m.label}</b><br /><span className="text-sm text-taupe-deep">{m.eta}</span></span></span>
                <span className="text-right">{m.fee === 0 ? "Free" : formatINR(m.fee)}{m.freeAbove ? <span className="block text-xs text-taupe-deep">Free over {formatINR(m.freeAbove)}</span> : null}</span>
              </label>
            ))}
          </div><NextButton onClick={next} label="Review order" onBack={() => setStep(2)} hint="Step 4 of 5" />
        </Section>

        <Section i={4} step={step} setStep={setStep} title="Review & pay">
          <div className="rounded-xl bg-blush/40 p-4 text-sm leading-6">
            <p>Delivering to <b>{ship.fullName}</b>, {ship.line1}{ship.line2 ? `, ${ship.line2}` : ""}, {ship.city}, {ship.state} {ship.pincode}</p>
            <p className="text-taupe-deep">Confirmation will be sent to <b className="text-espresso">{email}</b></p>
          </div>
          <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-taupe-deep">Pay with {["UPI", "Cards", "Netbanking", "Wallets"].map((m) => <span key={m} className="rounded-full border border-line px-2.5 py-1">{m}</span>)}</p>
          {useMockApi && <p className="mt-4 rounded-xl border border-gold/40 bg-blush/50 p-3 text-xs leading-5 text-taupe-deep"><b className="text-espresso">Demo mode.</b> Payment is switched off until the backend is connected.</p>}
          {payError && <p role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-danger/25 bg-red-50 p-4 text-sm text-danger"><CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden /><span>{payError} {lastOrder && <Link className="underline" href={`/account/orders/${lastOrder}`}>View order</Link>}</span></p>}
          <button className="btn mt-7 w-full !rounded-xl !border-transparent !text-white shadow-[0_14px_28px_-14px_rgba(35,26,29,.8)] hover:brightness-125 disabled:opacity-60 sm:w-auto sm:min-w-80"
            style={{ backgroundImage: "linear-gradient(90deg, #231a1d 0%, #5a2e3a 100%)" }} disabled={paying || !quote?.valid || loading} onClick={payNow}>
            {paying ? <><Loader2 className="animate-spin" size={16} /> Opening secure payment…</> : <><Lock size={15} aria-hidden /> Pay {quote ? formatINR(quote.total) : ""} securely</>}
          </button>
          <p className="mt-4 text-xs text-taupe-deep">Payments are processed by Razorpay. We never see or store your card details.</p>
        </Section>
      </div>

      <aside aria-label="Order summary" className="hidden h-fit space-y-5 rounded-2xl border border-gold/25 bg-gradient-to-b from-blush/70 via-white to-white p-6 shadow-[0_30px_60px_-40px_rgba(143,74,91,.6)] lg:sticky lg:top-28 lg:block" aria-busy={loading}>
        <div className="flex items-baseline justify-between"><h2 className="font-serif text-2xl">Order summary</h2><span className="text-xs uppercase tracking-[0.16em] text-taupe-deep">{cart.count} {cart.count === 1 ? "item" : "items"}</span></div>
        {summaryCard}
        <TrustRow />
        <p className="text-center text-xs text-taupe-deep">The amount charged is calculated again on our server when you pay.</p>
      </aside>
    </div>
    </>
  );
}
