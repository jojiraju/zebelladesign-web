"use client";
import { useState } from "react";
import { Check, CircleAlert, Clock, Loader2, Mail, MessageSquare, Send, User } from "lucide-react";
import { formatINR } from "@/lib/commerce/money";
import { apiFetch } from "@/lib/api/client";

type Status = { kind: "idle" | "loading" } | { kind: "ok" | "error"; text: string };

const TOPICS = ["Order help", "Product or sizing question", "Custom stitching", "Returns & exchanges", "Press & collaborations", "Something else"];

export function ContactForm() {
  const empty = { name: "", email: "", topic: TOPICS[0], message: "", company: "" };
  const [f, setF] = useState(empty);
  const [s, setS] = useState<Status>({ kind: "idle" });
  const [touched, setTouched] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const err = {
    name: f.name.trim().length < 2 ? "Please enter your name." : "",
    email: !/^\S+@\S+\.\S+$/.test(f.email) ? "Please enter a valid email address." : "",
    message: f.message.trim().length < 10 ? "Tell us a little more (at least 10 characters)." : "",
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (err.name || err.email || err.message) return;
    setS({ kind: "loading" });
    try {
      const res = await apiFetch("/contact", { method: "POST", body: JSON.stringify(f) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setS({ kind: "error", text: data.error ?? "We couldn't send your message. Please try again." });
      setS({ kind: "ok", text: "" });
      setF(empty); setTouched(false);
    } catch { setS({ kind: "error", text: "Network problem. Please try again." }); }
  }

  if (s.kind === "ok")
    return (
      <div className="grid place-items-center px-4 py-14 text-center" role="status">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-deep text-white ring-8 ring-blush"><Check size={36} strokeWidth={2.2} aria-hidden /></span>
        <h3 className="mt-6 font-serif text-3xl sm:text-4xl">Message sent</h3>
        <p className="mt-3 max-w-sm text-taupe-deep">Thank you — we have received your message and will reply by email, usually within one working day.</p>
        <button type="button" className="btn btn-ghost mt-8" onClick={() => setS({ kind: "idle" })}>Send another message</button>
      </div>
    );

  const field = (id: string, label: string, Icon: typeof User, error: string, input: React.ReactNode) => (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <div className="relative">
        <Icon size={17} strokeWidth={1.6} aria-hidden className="pointer-events-none absolute left-4 top-[1.05rem] text-taupe-deep" />
        {input}
      </div>
      {touched && error && <p className="mt-1.5 flex items-center gap-1.5 text-xs text-danger"><CircleAlert size={13} aria-hidden />{error}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {field("cn", "Your name", User, err.name, <input id="cn" className="field !min-h-12 !pl-11" autoComplete="name" placeholder="e.g. Ananya Sharma" aria-invalid={touched && !!err.name} value={f.name} onChange={set("name")} />)}
        {field("ce", "Email address", Mail, err.email, <input id="ce" type="email" className="field !min-h-12 !pl-11" autoComplete="email" placeholder="you@example.com" aria-invalid={touched && !!err.email} value={f.email} onChange={set("email")} />)}
      </div>

      <div>
        <p className="label">What can we help with?</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Topic">
          {TOPICS.map((t) => (
            <button key={t} type="button" role="radio" aria-checked={f.topic === t} onClick={() => setF({ ...f, topic: t })}
              className={`rounded-full border px-4 py-2 text-xs font-medium transition ${f.topic === t ? "border-transparent bg-espresso text-ivory shadow-sm" : "border-line bg-white text-taupe-deep hover:border-gold hover:text-espresso"}`}>{t}</button>
          ))}
        </div>
      </div>

      {field("cm", "Your message", MessageSquare, err.message, <textarea id="cm" rows={6} className="field !pl-11 !pt-3.5" placeholder="Tell us how we can help — order number, style name or size if you have them." aria-invalid={touched && !!err.message} value={f.message} onChange={set("message")} maxLength={2000} />)}
      <p className="-mt-3 text-right text-xs text-taupe-deep tabular-nums">{f.message.length} / 2000</p>

      <input tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" name="company" value={f.company} onChange={set("company")} />

      {s.kind === "error" && <p role="alert" className="flex items-start gap-2 rounded-xl border border-danger/25 bg-red-50 p-3.5 text-sm text-danger"><CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden />{s.text}</p>}

      <div className="flex flex-wrap items-center gap-4 border-t border-dashed border-line pt-6">
        <button className="btn w-full !rounded-xl !border-transparent !text-white shadow-[0_14px_28px_-14px_rgba(35,26,29,.8)] hover:brightness-125 disabled:opacity-60 sm:w-auto sm:min-w-56" style={{ backgroundImage: "linear-gradient(90deg, #231a1d 0%, #5a2e3a 100%)" }} disabled={s.kind === "loading"}>
          {s.kind === "loading" ? <Loader2 size={16} className="animate-spin" /> : <><Send size={15} aria-hidden /> Send message</>}
        </button>
        <p className="flex items-center gap-1.5 text-xs text-taupe-deep"><Clock size={14} className="text-gold-deep" aria-hidden />We usually reply within one working day.</p>
      </div>
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
      const r = await apiFetch("/orders/track", { method: "POST", body: JSON.stringify({ orderId, email }) });
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
