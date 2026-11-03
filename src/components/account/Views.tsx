"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, ChevronRight, Heart, MapPin, Package, Plus, ShoppingBag, Trash2, UserRound } from "lucide-react";
import { ART } from "@/lib/art";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { apiJson } from "@/lib/api/client";
import { formatINR } from "@/lib/commerce/money";
import { orderStatusLabel } from "@/lib/commerce/order-status";
import { addressSchema } from "@/lib/validation";
import { RetryPaymentButton } from "@/components/checkout/RetryPayment";
import type { Address, Order } from "@/lib/types";

const date = (ms: number) => new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const countItems = (o: Order) => o.items.reduce((n, i) => n + i.quantity, 0);
const card = "rounded-2xl border border-line bg-white shadow-[0_18px_40px_-30px_rgba(143,74,91,.45)]";

const Spinner = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading">
    <div className="skeleton h-7 w-56" />
    <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>
  </div>
);

/** Coloured status pill for an order. */
function StatusChip({ order }: { order: Pick<Order, "paymentStatus" | "fulfillmentStatus"> }) {
  const f = order.fulfillmentStatus;
  const tone = f === "delivered" ? "bg-green-50 text-ok ring-ok/20"
    : f === "cancelled" || order.paymentStatus === "failed" ? "bg-red-50 text-danger ring-danger/20"
    : f === "awaiting_payment" ? "bg-amber-50 text-gold-deep ring-gold/30"
    : f === "shipped" ? "bg-sky-50 text-sky-800 ring-sky-200"
    : "bg-blush text-gold-deep ring-gold/20";
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] ring-1 ${tone}`}>{orderStatusLabel(order)}</span>;
}

function Thumb({ src, className = "" }: { src?: string; className?: string }) {
  return <span className={`relative block aspect-[3/4] shrink-0 overflow-hidden rounded-lg bg-cream ring-2 ring-white ${className}`}><Image src={src || ART.productPlaceholder} alt="" fill sizes="64px" className="object-cover object-top" /></span>;
}

function StatCard({ href, icon: Icon, label, value, hint }: { href: string; icon: typeof Package; label: string; value: React.ReactNode; hint: string }) {
  return (
    <Link href={href} className={`${card} group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-gold`}>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blush to-rose-soft/60 text-gold-deep"><Icon size={20} strokeWidth={1.6} aria-hidden /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-taupe-deep">{label}</span>
        <span className="block font-serif text-3xl leading-tight">{value}</span>
        <span className="block truncate text-xs text-taupe-deep">{hint}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-taupe transition group-hover:translate-x-0.5 group-hover:text-espresso" aria-hidden />
    </Link>
  );
}

export function OverviewView() {
  const { profile } = useAuth();
  const wish = useWishlist();
  const [orders, setOrders] = useState<Order[] | null>(null);
  useEffect(() => {
    apiJson<{ orders: Order[] }>("/orders", { method: "GET" }).then((r) => setOrders(r.orders)).catch(() => setOrders([]));
  }, []);
  const recent = orders?.[0];
  const nAddr = profile.addresses?.length ?? 0;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard href="/account/orders" icon={Package} label="Orders" value={orders ? orders.length : "–"} hint="Track and review purchases" />
        <StatCard href="/account/wishlist" icon={Heart} label="Wishlist" value={wish.ids.length} hint={wish.ids.length ? "Pieces you love" : "Nothing saved yet"} />
        <StatCard href="/account/addresses" icon={MapPin} label="Addresses" value={nAddr} hint={nAddr ? "Ready for checkout" : "Add your first address"} />
      </div>

      <section aria-labelledby="recent-h">
        <div className="mb-4 flex items-end justify-between"><h2 id="recent-h" className="font-serif text-2xl">Recent order</h2><Link href="/account/orders" className="link-underline text-xs font-semibold uppercase tracking-[0.18em]">View all</Link></div>
        {orders === null ? <div className="skeleton h-28 rounded-2xl" /> : recent ? (
          <Link href={`/account/orders/${recent.id}`} className={`${card} flex flex-wrap items-center gap-x-5 gap-y-3 p-5 transition hover:border-gold`}>
            <span className="flex -space-x-3">{recent.items.slice(0, 3).map((i) => <Thumb key={i.productId + i.variantId} src={i.image} className="w-14" />)}</span>
            <span className="min-w-0 flex-1 basis-40"><span className="block whitespace-nowrap font-medium">{recent.id}</span><span className="block text-sm text-taupe-deep">{date(recent.createdAt)} · {countItems(recent)} {countItems(recent) === 1 ? "item" : "items"}</span></span>
            <StatusChip order={recent} />
            <span className="font-serif text-2xl tabular-nums">{formatINR(recent.total)}</span>
          </Link>
        ) : (
          <div className={`${card} flex flex-wrap items-center justify-between gap-4 p-6`}><p className="text-taupe-deep">You haven&apos;t placed an order yet.</p><Link href="/shop" className="btn btn-solid !min-h-11">Start shopping</Link></div>
        )}
      </section>

      <Link href="/collections" className="group relative block overflow-hidden rounded-3xl bg-espresso text-ivory">
        <Image src="/art/hero.svg" alt="" fill sizes="(min-width:1024px) 60vw, 100vw" className="object-cover object-[75%_8%] opacity-90 transition-transform duration-[1600ms] group-hover:scale-105" />
        <span className="absolute inset-0 bg-gradient-to-r from-espresso/85 via-espresso/45 to-transparent" aria-hidden />
        <span className="relative block p-8 sm:p-10">
          <span className="eyebrow !text-ivory/80">New season</span>
          <span className="mt-3 block max-w-xs font-serif text-3xl leading-tight sm:text-4xl">Find something you&apos;ll love</span>
          <span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]">Explore collections <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden /></span>
        </span>
      </Link>
    </div>
  );
}

export function ProfileView() {
  const { profile } = useAuth();
  // Re-mount the form when the saved profile changes so its fields reset from stored values.
  return <ProfileForm key={`${profile.displayName ?? ""}|${profile.email ?? ""}|${profile.phone ?? ""}`} />;
}

function ProfileForm() {
  const { user, profile, saveProfile } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(profile.displayName ?? "");
  const [email, setEmail] = useState(profile.email ?? user?.email ?? "");
  const [phone, setPhone] = useState(profile.phone ?? user?.phone ?? "");
  const [busy, setBusy] = useState(false);
  return (
    <form className={`${card} max-w-2xl p-6 sm:p-8`} onSubmit={async (e) => {
      e.preventDefault(); setBusy(true);
      try { await saveProfile({ displayName: name.trim(), email: email.trim(), phone: phone.trim() }); toast("Profile saved"); } catch { toast("Could not save your profile", "error"); } finally { setBusy(false); }
    }}>
      <div className="mb-7 flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-full bg-blush text-gold-deep"><UserRound size={22} strokeWidth={1.6} aria-hidden /></span><div><p className="font-serif text-2xl">Personal details</p><p className="text-sm text-taupe-deep">Used for orders and delivery updates.</p></div></div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label" htmlFor="pn">Full name</label><input id="pn" className="field" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className="label" htmlFor="pu">Username</label><input id="pu" className="field bg-cream" value={user?.username ?? ""} readOnly /></div>
        <div><label className="label" htmlFor="pp">Mobile</label><input id="pp" className="field" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="pe">Email</label><input id="pe" type="email" className="field" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      </div>
      <button className="btn btn-solid mt-8" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
    </form>
  );
}

const blank: Address = { fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", country: "India" };

export function AddressesView() {
  const { profile, saveProfile } = useAuth();
  const toast = useToast();
  const list = profile.addresses ?? [];
  const [form, setForm] = useState<Address | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function save() {
    const parsed = addressSchema.safeParse(form);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { e[String(i.path[0])] = i.message; });
      return setErrors(e);
    }
    await saveProfile({ addresses: [...list, { ...parsed.data, id: crypto.randomUUID() }] });
    setForm(null); setErrors({}); toast("Address saved");
  }
  const field = (k: keyof Address, label: string, p: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div key={k}><label className="label" htmlFor={`a-${k}`}>{label}</label><input id={`a-${k}`} className="field" aria-invalid={!!errors[k]} value={form?.[k] ?? ""} onChange={(e) => setForm({ ...form!, [k]: e.target.value })} {...p} />{errors[k] && <p className="mt-1 text-xs text-danger">{errors[k]}</p>}</div>
  );
  return (
    <div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {list.map((a, i) => (
          <li key={a.id} className={`${card} p-5 text-sm leading-6`}>
            <div className="mb-3 flex items-center justify-between"><span className="inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold-deep"><MapPin size={14} aria-hidden />{i === 0 ? "Default" : "Saved"}</span>
              <button className="inline-flex items-center gap-1.5 text-xs text-taupe-deep transition hover:text-danger" onClick={() => saveProfile({ addresses: list.filter((x) => x.id !== a.id) })}><Trash2 size={14} aria-hidden />Remove</button></div>
            <p className="font-medium">{a.fullName}</p>
            <p>{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p><p>{a.city}, {a.state} {a.pincode}</p><p className="text-taupe-deep">{a.phone}</p>
          </li>
        ))}
        {!form && (
          <li><button onClick={() => setForm(blank)} className="grid h-full min-h-36 w-full place-items-center rounded-2xl border-2 border-dashed border-line bg-white/40 p-6 text-center text-taupe-deep transition hover:border-gold hover:text-espresso">
            <span><Plus className="mx-auto mb-2" size={22} aria-hidden /><span className="text-sm font-medium">{list.length ? "Add another address" : "Add your first address"}</span></span>
          </button></li>
        )}
      </ul>
      {form && (
        <div className={`${card} mt-6 grid gap-4 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-3`}>
          {field("fullName", "Full name", { autoComplete: "name" })}{field("phone", "Mobile", { inputMode: "tel", autoComplete: "tel" })}
          <div className="sm:col-span-2 lg:col-span-3">{field("line1", "Address line 1", { autoComplete: "address-line1" })}</div>
          <div className="sm:col-span-2 lg:col-span-3">{field("line2", "Address line 2 (optional)", { autoComplete: "address-line2" })}</div>
          {field("city", "City", { autoComplete: "address-level2" })}{field("state", "State", { autoComplete: "address-level1" })}{field("pincode", "PIN code", { inputMode: "numeric", maxLength: 6, autoComplete: "postal-code" })}
          <div className="flex gap-3 sm:col-span-2 lg:col-span-3"><button className="btn btn-solid" onClick={save}>Save address</button><button className="btn btn-ghost" onClick={() => { setForm(null); setErrors({}); }}>Cancel</button></div>
        </div>
      )}
    </div>
  );
}

export function OrdersView() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!user) return;
    // GET /orders -> { orders: Order[] } for the signed-in user, newest first.
    apiJson<{ orders: Order[] }>("/orders", { method: "GET" })
      .then((r) => setOrders(r.orders))
      .catch((e) => { console.error(e); setError(true); });
  }, [user]);

  if (error) return <p role="alert" className="text-danger">We couldn&apos;t load your orders. Please refresh and try again.</p>;
  if (!orders) return <Spinner />;
  if (!orders.length) return (
    <div className={`${card} grid place-items-center px-6 py-16 text-center`}>
      <span className="grid h-16 w-16 place-items-center rounded-full bg-blush text-gold-deep"><ShoppingBag size={26} strokeWidth={1.5} aria-hidden /></span>
      <p className="mt-5 font-serif text-3xl">No orders yet</p><p className="mt-1 text-taupe-deep">When you place an order it will show up here.</p>
      <Link href="/shop" className="btn btn-solid mt-7">Start shopping</Link>
    </div>
  );
  return (
    <ul className="space-y-4">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/account/orders/${o.id}`} className={`${card} group flex flex-wrap items-center gap-x-6 gap-y-3 p-5 transition hover:-translate-y-0.5 hover:border-gold`}>
            <span className="flex -space-x-3">{o.items.slice(0, 3).map((i) => <Thumb key={i.productId + i.variantId} src={i.image} className="w-14" />)}</span>
            <span className="min-w-0 flex-1 basis-40"><span className="block whitespace-nowrap font-medium">{o.id}</span><span className="block text-sm text-taupe-deep">{date(o.createdAt)} · {countItems(o)} {countItems(o) === 1 ? "item" : "items"}</span></span>
            <StatusChip order={o} />
            <span className="font-serif text-2xl tabular-nums">{formatINR(o.total)}</span>
            <ChevronRight size={18} className="text-taupe transition group-hover:translate-x-0.5 group-hover:text-espresso" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}

const STEPS = ["Order placed", "Packed", "Shipped", "Delivered"] as const;
const stepOf = (f: Order["fulfillmentStatus"]) => ({ awaiting_payment: -1, processing: 0, packed: 1, shipped: 2, delivered: 3, cancelled: -1 }[f]);

export function OrderDetailView({ orderId }: { orderId: string }) {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  useEffect(() => {
    if (!user) return;
    apiJson<Order>(`/orders/${encodeURIComponent(orderId)}`, { method: "GET" }).then(setOrder).catch(() => setOrder(null)); // API returns 404 for other customers' orders
  }, [user, orderId]);
  if (order === undefined) return <Spinner />;
  if (order === null) return <div className={`${card} p-10 text-center`}><p className="font-serif text-3xl">Order not found</p><Link className="btn btn-ghost mt-6" href="/account/orders">Back to orders</Link></div>;
  const a = order.shippingAddress;
  const unpaid = order.paymentStatus !== "paid" && order.fulfillmentStatus === "awaiting_payment";
  const step = stepOf(order.fulfillmentStatus);
  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-taupe-deep hover:text-espresso"><ChevronRight size={14} className="rotate-180" aria-hidden />All orders</Link>

      <div className={`${card} p-6 sm:p-8`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="eyebrow">Order</p><h2 className="mt-2 font-serif text-3xl sm:text-4xl">{order.id}</h2><p className="mt-1 text-sm text-taupe-deep">Placed {date(order.createdAt)}{order.paymentMode === "test" && " · TEST payment"}</p></div>
          <StatusChip order={order} />
        </div>
        {order.fulfillmentStatus !== "cancelled" && step >= 0 && (
          <ol className="mt-8 grid grid-cols-4 gap-2" aria-label="Order progress">
            {STEPS.map((s, i) => (
              <li key={s} className="text-center">
                <div className="relative flex items-center justify-center">
                  <span className={`absolute left-0 right-1/2 top-1/2 h-0.5 -translate-y-1/2 ${i === 0 ? "opacity-0" : i <= step ? "bg-gold" : "bg-line"}`} aria-hidden />
                  <span className={`absolute left-1/2 right-0 top-1/2 h-0.5 -translate-y-1/2 ${i === STEPS.length - 1 ? "opacity-0" : i < step ? "bg-gold" : "bg-line"}`} aria-hidden />
                  <span className={`relative grid h-8 w-8 place-items-center rounded-full text-xs ring-4 ring-white ${i <= step ? "bg-gradient-to-br from-gold to-gold-deep text-white" : "bg-cream text-taupe"}`}>{i <= step ? <Check size={15} aria-hidden /> : i + 1}</span>
                </div>
                <p className={`mt-2 text-xs ${i <= step ? "font-medium text-espresso" : "text-taupe-deep"}`}>{s}</p>
              </li>
            ))}
          </ol>
        )}
      </div>

      {unpaid && <div className="rounded-2xl border border-gold/40 bg-blush/50 p-5"><p className="mb-3 text-sm">This order is awaiting payment.</p><RetryPaymentButton orderId={order.id} email={order.email} /></div>}
      {order.tracking && <p className="rounded-2xl border border-line bg-white p-5 text-sm">Shipped via <b>{order.tracking.carrier}</b> · Tracking <b>{order.tracking.trackingNumber}</b> {order.tracking.url && <a className="underline" href={order.tracking.url} target="_blank" rel="noopener noreferrer">Track</a>}</p>}

      <ul className={`${card} divide-y divide-line`}>
        {order.items.map((i) => (
          <li key={i.productId + i.variantId} className="flex gap-4 p-4 sm:p-5">
            <Thumb src={i.image} className="w-20" />
            <div className="min-w-0 flex-1"><p className="font-serif text-xl leading-tight">{i.name}</p><p className="mt-1 text-xs uppercase tracking-widest text-taupe-deep">{[i.size, i.color].filter(Boolean).join(" · ")} · Qty {i.quantity}</p></div>
            <p className="tabular-nums">{formatINR(i.lineTotal)}</p>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className={`${card} p-6 text-sm leading-6`}><p className="label">Delivering to</p><p className="font-medium">{a.fullName}</p><p>{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p><p>{a.city}, {a.state} {a.pincode}</p><p className="text-taupe-deep">{a.phone}</p></div>
        <dl className={`${card} space-y-1.5 p-6 text-sm`}>
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatINR(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between text-ok"><dt>Discount {order.couponCode && `(${order.couponCode})`}</dt><dd>−{formatINR(order.discount)}</dd></div>}
          <div className="flex justify-between"><dt>Shipping</dt><dd>{order.shipping ? formatINR(order.shipping) : "Complimentary"}</dd></div>
          <div className="flex justify-between border-t border-line pt-3 font-serif text-2xl"><dt>Total</dt><dd>{formatINR(order.total)}</dd></div>
        </dl>
      </div>
    </div>
  );
}
