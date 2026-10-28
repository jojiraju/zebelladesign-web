"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { formatINR } from "@/lib/commerce/money";

type Status = { kind: "idle" | "loading" } | { kind: "ok" | "error"; text: string };

export function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", message: "", company: "" });
  const [s, setS] = useState<Status>({ kind: "idle" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(f.email) || f.message.trim().length < 10)
      return setS({ kind: "error", text: "Please enter your name, a valid email and a message of at least 10 characters." });
    setS({ kind: "loading" });
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setS({ kind: "error", text: data.error ?? "We couldn't send your message. Please try again." });
      setS({ kind: "ok", text: "Thank you — your message has been received. We'll reply by email." });
      setF({ name: "", email: "", message: "", company: "" });
    } catch { setS({ kind: "error", text: "Network problem. Please try again." }); }
  }
  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div><label className="label" htmlFor="cn">Name</label><input id="cn" className="field" autoComplete="name" value={f.name} onChange={set("name")} /></div>
        <div><label className="label" htmlFor="ce">Email</label><input id="ce" type="email" className="field" autoComplete="email" value={f.email} onChange={set("email")} /></div>
      </div>
      <div><label className="label" htmlFor="cm">Message</label><textarea id="cm" rows={6} className="field" value={f.message} onChange={set("message")} /></div>
      <input tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" name="company" value={f.company} onChange={set("company")} />
      <button className="btn btn-solid" disabled={s.kind === "loading"}>{s.kind === "loading" ? <Loader2 size={16} className="animate-spin" /> : "Send message"}</button>
      <p role="status" aria-live="polite" className={`min-h-5 text-sm ${s.kind === "error" ? "text-danger" : "text-ok"}`}>{s.kind === "ok" || s.kind === "error" ? s.text : ""}</p>
    </form>
  );
}

interface Tracking { orderId: string; status: string; placedAt: number; items: { name: string; size?: string; color?: string; quantity: number }[]; tracking: { carrier: string; trackingNumber: string; url?: string } | null }

export function TrackForm() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [s, setS] = useState<Status>({ kind: "idle" });
  const [res, setRes] = useState<Tracking | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setS({ kind: "loading" }); setRes(null);
    try {
      const r = await fetch("/api/orders/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, email }) });
      const data = await r.json();
      if (!r.ok) return setS({ kind: "error", text: data.error ?? "We couldn't find that order." });
      setRes(data); setS({ kind: "idle" });
    } catch { setS({ kind: "error", text: "Network problem. Please try again." }); }
  }
  void formatINR;
  return (
    <div className="max-w-md">
      <form onSubmit={submit} className="space-y-5">
        <div><label className="label" htmlFor="to">Order ID</label><input id="to" className="field" placeholder="ZB-XXXXXXXX" value={orderId} onChange={(e) => setOrderId(e.target.value)} /></div>
        <div><label className="label" htmlFor="te">Email used at checkout</label><input id="te" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <button className="btn btn-solid" disabled={s.kind === "loading" || !orderId || !email}>{s.kind === "loading" ? <Loader2 size={16} className="animate-spin" /> : "Track order"}</button>
        {s.kind === "error" && <p role="alert" className="text-sm text-danger">{s.text}</p>}
      </form>
      {res && (
        <div className="mt-10 border border-line bg-white p-6" role="status">
          <p className="eyebrow">Order {res.orderId}</p>
          <p className="mt-2 font-serif text-3xl">{res.status}</p>
          <ul className="mt-4 space-y-1 text-sm">{res.items.map((i, n) => <li key={n}>{i.quantity} × {i.name} {[i.size, i.color].filter(Boolean).join(" · ")}</li>)}</ul>
          {res.tracking && <p className="mt-4 text-sm">{res.tracking.carrier} · {res.tracking.trackingNumber} {res.tracking.url && <a className="underline" href={res.tracking.url} target="_blank" rel="noopener noreferrer">Track shipment</a>}</p>}
        </div>
      )}
    </div>
  );
}
