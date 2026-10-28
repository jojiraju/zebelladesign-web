"use client";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

type State = { kind: "idle" } | { kind: "loading" } | { kind: "done"; text: string } | { kind: "error"; text: string };

export function NewsletterForm({ consent, dark = false }: { consent?: string; dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [hp, setHp] = useState("");
  const [s, setS] = useState<State>({ kind: "idle" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setS({ kind: "error", text: "Please enter a valid email address." });
    if (!agree) return setS({ kind: "error", text: "Please tick the consent box to subscribe." });
    setS({ kind: "loading" });
    try {
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, consent: true, company: hp }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setS({ kind: "error", text: data.error ?? "We couldn't subscribe you. Please try again." });
      setS({ kind: "done", text: data.status === "already_subscribed" ? "You're already on the list — thank you!" : "Thank you — you're subscribed." });
      setEmail("");
    } catch {
      setS({ kind: "error", text: "Network problem. Please try again." });
    }
  }

  const line = dark ? "border-ivory/50 text-ivory placeholder:text-ivory/60" : "border-espresso text-espresso placeholder:text-taupe-deep";
  return (
    <form onSubmit={submit} noValidate className={dark ? "w-full max-w-md" : "mx-auto w-full max-w-xl"}>
      <label htmlFor="nl-email" className="sr-only">Email address</label>
      <div className={dark ? `flex items-center border-b ${line}` : "flex items-center gap-2 rounded-full border border-white/20 bg-white/10 p-1.5 pl-6 backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-300 focus-within:border-rose-soft focus-within:bg-white/15 focus-within:shadow-[0_0_0_4px_rgba(217,154,167,.25),0_0_40px_-5px_rgba(217,154,167,.5)]"}>
        <input id="nl-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" className={`h-12 w-full bg-transparent outline-none ${dark ? "" : "text-white placeholder:text-white/50"}`} aria-invalid={s.kind === "error"} />
        <button type="submit" disabled={s.kind === "loading"} aria-label="Subscribe" className={dark ? "grid h-12 w-12 place-items-center transition-transform hover:translate-x-1 disabled:opacity-50" : "group/btn inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-ivory px-6 text-xs font-bold uppercase tracking-[0.16em] text-gold-deep shadow-[0_10px_30px_-10px_rgba(255,255,255,.5)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_16px_40px_-10px_rgba(217,154,167,.9)] active:scale-95 disabled:opacity-50"}>
          {s.kind === "loading" ? <Loader2 className="animate-spin" size={18} /> : dark ? <ArrowRight size={18} /> : <>Subscribe <ArrowRight size={16} className="transition-transform duration-300 group-hover/btn:translate-x-1" /></>}
        </button>
      </div>
      {/* honeypot: hidden from people, tempting to bots */}
      <input tabIndex={-1} autoComplete="off" aria-hidden value={hp} onChange={(e) => setHp(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" name="company" />
      <label className={`mt-3 flex cursor-pointer items-start gap-3 text-xs ${dark ? "text-ivory/80" : "justify-center text-left text-white/65"}`}>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#8f4a5b]" />
        <span>{consent ?? "I agree to receive emails about new collections. I can unsubscribe at any time."}</span>
      </label>
      <p role="status" aria-live="polite" className={`mt-2 min-h-5 text-sm ${s.kind === "error" ? "text-red-300" : dark ? "text-gold" : "text-rose-soft"}`}>
        {s.kind === "done" || s.kind === "error" ? s.text : ""}
      </p>
    </form>
  );
}
