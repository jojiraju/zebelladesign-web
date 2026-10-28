"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authMessage, useAuth } from "@/components/providers/AuthProvider";

type Mode = "login" | "register" | "forgot";

/** Only allow same-site relative redirects (prevents open-redirect abuse via ?next=). */
export const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/account");

function Form({ mode }: { mode: Mode }) {
  const auth = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  if (!auth.configured)
    return <p className="bg-cream p-5 text-sm">Customer accounts are not available yet — Firebase has not been configured for this site.</p>;

  async function run(fn: () => Promise<void>, after?: () => void) {
    setBusy(true); setError(null); setInfo(null);
    try { await fn(); after?.(); } catch (e) { setError(authMessage(e)); } finally { setBusy(false); }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setError("Please enter a valid email address.");
    if (mode === "forgot")
      return void run(() => auth.resetPassword(f.email), () => setInfo("If an account exists for that email, a reset link is on its way."));
    if (f.password.length < 8) return setError("Password must be at least 8 characters.");
    if (mode === "register") {
      if (f.name.trim().length < 2) return setError("Please enter your name.");
      if (f.password !== f.confirm) return setError("Passwords do not match.");
      return void run(() => auth.register({ name: f.name.trim(), email: f.email, password: f.password }), () => router.push(next));
    }
    void run(() => auth.login(f.email, f.password), () => router.push(next));
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {mode === "register" && <div><label className="label" htmlFor="name">Full name</label><input id="name" className="field" autoComplete="name" value={f.name} onChange={set("name")} /></div>}
      <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" className="field" autoComplete="email" value={f.email} onChange={set("email")} /></div>
      {mode !== "forgot" && <div><label className="label" htmlFor="password">Password</label><input id="password" type="password" className="field" autoComplete={mode === "login" ? "current-password" : "new-password"} value={f.password} onChange={set("password")} /></div>}
      {mode === "register" && <div><label className="label" htmlFor="confirm">Confirm password</label><input id="confirm" type="password" className="field" autoComplete="new-password" value={f.confirm} onChange={set("confirm")} /></div>}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {info && <p role="status" className="text-sm text-ok">{info}</p>}
      <button className="btn btn-solid w-full" disabled={busy}>{busy ? <Loader2 className="animate-spin" size={16} /> : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset link"}</button>
      {mode !== "forgot" && (
        <>
          <div className="flex items-center gap-4 text-xs uppercase tracking-widest text-taupe-deep"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
          <button type="button" className="btn btn-ghost w-full" disabled={busy} onClick={() => run(auth.google, () => router.push(next))}>Continue with Google</button>
        </>
      )}
      <p className="text-center text-sm text-taupe-deep">
        {mode === "login" && <><Link className="underline" href="/forgot-password">Forgot password?</Link> · <Link className="underline" href={`/register?next=${encodeURIComponent(next)}`}>Create an account</Link></>}
        {mode === "register" && <>Already registered? <Link className="underline" href={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link></>}
        {mode === "forgot" && <Link className="underline" href="/login">Back to sign in</Link>}
      </p>
    </form>
  );
}

export function AuthCard({ mode, title, subtitle }: { mode: Mode; title: string; subtitle: string }) {
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-16">
      <div className="glass relative w-full max-w-md rounded-[2rem] p-8 shadow-[0_40px_90px_-40px_rgba(143,74,91,.45)] sm:p-12">
        <div aria-hidden className="absolute inset-x-10 -top-px h-1 rounded-b-full bg-gradient-to-r from-rose-soft via-gold to-gold-deep" />
        <p className="eyebrow">{subtitle}</p>
        <h1 className="mb-8 mt-3 font-serif text-4xl"><span className="text-gradient">{title}</span></h1>
        <Suspense><Form mode={mode} /></Suspense>
      </div>
    </div>
  );
}
