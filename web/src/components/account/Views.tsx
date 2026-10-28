"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { Loader2, MailWarning } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { db } from "@/lib/firebase/client";
import { formatINR } from "@/lib/commerce/money";
import { orderStatusLabel } from "@/lib/commerce/order-status";
import { addressSchema } from "@/lib/validation";
import { RetryPaymentButton } from "@/components/checkout/RetryPayment";
import type { Address, Order } from "@/lib/types";

const date = (ms: number) => new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const Spinner = () => <div className="grid min-h-40 place-items-center"><Loader2 className="animate-spin text-taupe" /></div>;

export function OverviewView() {
  const { user, profile, resendVerification } = useAuth();
  const toast = useToast();
  return (
    <div className="space-y-8">
      <p className="text-lg">Hello, <span className="font-serif text-2xl">{profile.displayName || user?.displayName || "there"}</span>.</p>
      {user && !user.emailVerified && (
        <div className="flex flex-wrap items-center gap-4 border border-gold/60 bg-white p-5 text-sm">
          <MailWarning className="text-gold-deep" size={20} />
          <p className="flex-1">Please verify <b>{user.email}</b> so we can send order updates.</p>
          <button className="btn btn-ghost !min-h-10" onClick={async () => { await resendVerification(); toast("Verification email sent"); }}>Resend email</button>
        </div>
      )}
      <ul className="grid gap-4 sm:grid-cols-3">
        {[["/account/orders", "Your orders", "Track and review purchases"], ["/account/wishlist", "Wishlist", `${profile.wishlist?.length ?? 0} saved`], ["/account/addresses", "Addresses", `${profile.addresses?.length ?? 0} saved`]].map(([h, t, s]) => (
          <li key={h}><Link href={h} className="block border border-line bg-white p-6 transition hover:border-espresso"><p className="font-serif text-2xl">{t}</p><p className="mt-1 text-sm text-taupe-deep">{s}</p></Link></li>
        ))}
      </ul>
    </div>
  );
}

export function ProfileView() {
  const { profile } = useAuth();
  // Re-mount the form when the saved profile changes so its fields reset from stored values.
  return <ProfileForm key={`${profile.displayName ?? ""}|${profile.phone ?? ""}`} />;
}

function ProfileForm() {
  const { user, profile, saveProfile } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(profile.displayName ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [busy, setBusy] = useState(false);
  return (
    <form className="max-w-md space-y-5" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true);
      try { await saveProfile({ displayName: name.trim(), phone: phone.trim() }); toast("Profile saved"); } catch { toast("Could not save your profile", "error"); } finally { setBusy(false); }
    }}>
      <div><label className="label" htmlFor="pn">Full name</label><input id="pn" className="field" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div><label className="label" htmlFor="pe">Email</label><input id="pe" className="field bg-cream" value={user?.email ?? ""} readOnly /></div>
      <div><label className="label" htmlFor="pp">Mobile</label><input id="pp" className="field" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
      <button className="btn btn-solid" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
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
        {list.map((a) => (
          <li key={a.id} className="border border-line bg-white p-5 text-sm leading-6">
            <p className="font-medium">{a.fullName}</p>
            <p>{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p><p>{a.city}, {a.state} {a.pincode}</p><p>{a.phone}</p>
            <button className="mt-3 text-xs uppercase tracking-widest underline" onClick={() => saveProfile({ addresses: list.filter((x) => x.id !== a.id) })}>Remove</button>
          </li>
        ))}
      </ul>
      {!list.length && !form && <p className="text-taupe-deep">You have no saved addresses yet.</p>}
      {form ? (
        <div className="mt-6 grid max-w-xl gap-4 sm:grid-cols-2">
          {field("fullName", "Full name", { autoComplete: "name" })}{field("phone", "Mobile", { inputMode: "tel", autoComplete: "tel" })}
          <div className="sm:col-span-2">{field("line1", "Address line 1", { autoComplete: "address-line1" })}</div>
          <div className="sm:col-span-2">{field("line2", "Address line 2 (optional)", { autoComplete: "address-line2" })}</div>
          {field("city", "City", { autoComplete: "address-level2" })}{field("state", "State", { autoComplete: "address-level1" })}{field("pincode", "PIN code", { inputMode: "numeric", maxLength: 6, autoComplete: "postal-code" })}
          <div className="flex gap-3 sm:col-span-2"><button className="btn btn-solid" onClick={save}>Save address</button><button className="btn btn-ghost" onClick={() => { setForm(null); setErrors({}); }}>Cancel</button></div>
        </div>
      ) : <button className="btn btn-ghost mt-6" onClick={() => setForm(blank)}>Add an address</button>}
    </div>
  );
}

export function OrdersView() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!user) return;
    // Firestore rules only return documents whose userId matches the signed-in user.
    getDocs(query(collection(db(), "orders"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(50)))
      .then((s) => setOrders(s.docs.map((d) => ({ ...(d.data() as Order), id: d.id }))))
      .catch((e) => { console.error(e); setError(true); });
  }, [user]);

  if (error) return <p role="alert" className="text-danger">We couldn&apos;t load your orders. Please refresh and try again.</p>;
  if (!orders) return <Spinner />;
  if (!orders.length) return <div><p className="font-serif text-3xl">No orders yet</p><Link href="/shop" className="btn btn-solid mt-6">Start shopping</Link></div>;
  return (
    <ul className="divide-y divide-line border-y border-line">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/account/orders/${o.id}`} className="grid items-center gap-3 py-5 transition hover:bg-white/60 sm:grid-cols-[1fr_auto_auto] sm:gap-8 sm:px-3">
            <div><p className="font-medium">{o.id}</p><p className="text-sm text-taupe-deep">{date(o.createdAt)} · {o.items.reduce((n, i) => n + i.quantity, 0)} items</p></div>
            <p className="text-xs uppercase tracking-[0.18em] text-gold-deep">{orderStatusLabel(o)}</p>
            <p className="tabular-nums">{formatINR(o.total)}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function OrderDetailView({ orderId }: { orderId: string }) {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db(), "orders", orderId)).then((s) => setOrder(s.exists() ? { ...(s.data() as Order), id: s.id } : null)).catch(() => setOrder(null)); // rules deny other customers' orders
  }, [user, orderId]);
  if (order === undefined) return <Spinner />;
  if (order === null) return <div><p className="font-serif text-3xl">Order not found</p><Link className="btn btn-ghost mt-6" href="/account/orders">Back to orders</Link></div>;
  const a = order.shippingAddress;
  const unpaid = order.paymentStatus !== "paid" && order.fulfillmentStatus === "awaiting_payment";
  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Order</p><h2 className="font-serif text-4xl">{order.id}</h2><p className="text-sm text-taupe-deep">Placed {date(order.createdAt)}{order.paymentMode === "test" && " · TEST payment"}</p></div>
        <p className="border border-gold px-4 py-2 text-xs uppercase tracking-[0.2em] text-gold-deep">{orderStatusLabel(order)}</p>
      </div>
      {unpaid && <div className="bg-white p-5"><p className="mb-3 text-sm">This order is awaiting payment.</p><RetryPaymentButton orderId={order.id} email={order.email} /></div>}
      {order.tracking && <p className="bg-white p-5 text-sm">Shipped via <b>{order.tracking.carrier}</b> · Tracking <b>{order.tracking.trackingNumber}</b> {order.tracking.url && <a className="underline" href={order.tracking.url} target="_blank" rel="noopener noreferrer">Track</a>}</p>}
      <ul className="divide-y divide-line border-y border-line">
        {order.items.map((i) => (
          <li key={i.productId + i.variantId} className="flex gap-4 py-4">
            <div className="relative aspect-[3/4] w-20 shrink-0 bg-cream">{i.image && <Image src={i.image} alt="" fill sizes="80px" className="object-cover" />}</div>
            <div className="flex-1"><p className="font-serif text-xl">{i.name}</p><p className="text-xs uppercase tracking-widest text-taupe-deep">{[i.size, i.color].filter(Boolean).join(" · ")} · Qty {i.quantity}</p></div>
            <p className="tabular-nums">{formatINR(i.lineTotal)}</p>
          </li>
        ))}
      </ul>
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="text-sm leading-6"><p className="label">Delivering to</p><p>{a.fullName}</p><p>{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p><p>{a.city}, {a.state} {a.pincode}</p><p>{a.phone}</p></div>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatINR(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between text-ok"><dt>Discount {order.couponCode && `(${order.couponCode})`}</dt><dd>−{formatINR(order.discount)}</dd></div>}
          <div className="flex justify-between"><dt>Shipping</dt><dd>{order.shipping ? formatINR(order.shipping) : "Complimentary"}</dd></div>
          <div className="flex justify-between border-t border-line pt-2 font-serif text-2xl"><dt>Total</dt><dd>{formatINR(order.total)}</dd></div>
        </dl>
      </div>
    </div>
  );
}
