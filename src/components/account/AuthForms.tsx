"use client";
import { Suspense, useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, CircleAlert, Eye, EyeOff, Heart, Loader2, Lock, Mail, Package, ShieldCheck, Truck, User, UserRound } from "lucide-react";
import { AuthIllustration } from "./AuthIllustration";
import { Logo } from "@/components/ui/Logo";
import { authApi } from "@/lib/api/auth";
import { useMockApi } from "@/lib/api/client";
import { safeNext } from "@/lib/safe-next";
import { authMessage, useAuth } from "@/components/providers/AuthProvider";

type Mode = "login" | "register" | "forgot" | "reset";
type Field = "name" | "username" | "email" | "password" | "confirm";

const USERNAME = /^[A-Za-z0-9._-]{3,30}$/;

const COPY: Record<Mode, { title: string; lead: string; cta: string }> = {
  login: { title: "Sign in", lead: "Enter your username and password to continue shopping.", cta: "Sign in" },
  register: { title: "Create Account", lead: "Join Zebella for a faster checkout and order tracking.", cta: "Create account" },
  forgot: { title: "Forgot password?", lead: "Enter your username or email and we'll send you a reset link.", cta: "Send reset link" },
  reset: { title: "Set a new password", lead: "Choose a password you haven't used before.", cta: "Update password" },
};

const EYEBROW: Record<Mode, string> = { login: "Welcome back", register: "Join Zebella", forgot: "Account help", reset: "Account help" };

const headingStyle = { fontFamily: "var(--font-sans)", fontWeight: 700, letterSpacing: "-0.01em" } as const;
const pill = "btn w-full !rounded-xl !border-transparent !text-white shadow-[0_14px_28px_-14px_rgba(35,26,29,.8)] hover:brightness-125 disabled:opacity-60";
const pillStyle = { backgroundImage: "linear-gradient(90deg, #231a1d 0%, #5a2e3a 100%)" } as const;
const plainLabel = "label !text-sm !font-normal !normal-case !tracking-normal";

function Input({ id, label, error, hint, password, icon: Icon, ...p }: { id: string; label: string; icon: typeof User; error?: string; hint?: React.ReactNode; password?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  const err = useId();
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between"><label className={`${plainLabel} !mb-0`} htmlFor={id}>{label}</label>{hint}</div>
      <div className="relative">
        <Icon aria-hidden size={18} strokeWidth={1.6} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-taupe-deep" />
        <input id={id} className={`field !min-h-[3.25rem] !pl-12 ${password ? "!pr-12" : ""}`} aria-invalid={!!error} aria-describedby={error ? err : undefined} {...p} type={password && show ? "text" : p.type ?? (password ? "password" : "text")} />
        {password && (
          <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}
            className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-taupe-deep transition hover:text-espresso">
            {show ? <EyeOff size={18} strokeWidth={1.6} /> : <Eye size={18} strokeWidth={1.6} />}
          </button>
        )}
      </div>
      {error && <p id={err} className="mt-1.5 flex items-center gap-1.5 text-xs text-danger"><CircleAlert size={13} aria-hidden />{error}</p>}
    </div>
  );
}

function Form({ mode }: { mode: Mode }) {
  const auth = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const token = params.get("token") ?? "";
  const q = next === "/account" ? "" : `?next=${encodeURIComponent(next)}`;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [f, setF] = useState<Record<Field, string>>({ name: "", username: "", email: "", password: "", confirm: "" });
  const set = (k: Field) => (e: React.ChangeEvent<HTMLInputElement>) => { setF({ ...f, [k]: e.target.value }); if (errors[k]) setErrors({ ...errors, [k]: undefined }); };

  // Already signed in: go where they were headed.
  useEffect(() => { if ((mode === "login" || mode === "register") && auth.ready && auth.user) router.replace(next); }, [mode, auth.ready, auth.user, next, router]);

  function validate(): Partial<Record<Field, string>> {
    const e: Partial<Record<Field, string>> = {};
    if (mode === "forgot" && !f.username.trim()) e.username = "Enter your username or email.";
    if (mode === "login") {
      if (!f.username.trim()) e.username = "Please enter your username.";
      if (!f.password) e.password = "Please enter your password.";
    }
    if (mode === "register") {
      if (f.name.trim().length < 2) e.name = "Please enter your name.";
      if (!USERNAME.test(f.username)) e.username = "3-30 characters: letters, numbers, dot, dash or underscore.";
      if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Please enter a valid email address.";
    }
    if (mode === "register" || mode === "reset") {
      if (f.password.length < 8) e.password = "Use at least 8 characters.";
      if (f.password !== f.confirm) e.confirm = "Passwords do not match.";
    }
    return e;
  }

  async function run(fn: () => Promise<void>, after?: () => void) {
    setBusy(true); setError(null); setInfo(null);
    try { await fn(); after?.(); } catch (e) { setError(authMessage(e)); } finally { setBusy(false); }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setInfo(null);
    if (mode === "reset" && !token) return setError("This reset link is invalid or has expired. Please request a new one.");
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;
    if (mode === "forgot") return void run(() => auth.resetPassword(f.username.trim()), () => setInfo("If an account exists, a password reset link is on its way. Please check your inbox."));
    if (mode === "reset") return void run(() => authApi.confirmPasswordReset(token, f.password).then(() => undefined), () => { setInfo("Your password has been updated. Redirecting you to sign in…"); setTimeout(() => router.push("/login"), 1500); });
    if (mode === "login") return void run(() => auth.login(f.username.trim(), f.password), () => router.push(next));
    void run(() => auth.register({ name: f.name.trim(), username: f.username, email: f.email, password: f.password }), () => router.push(next));
  }

  return (
    <>
      <div>
        <p className="eyebrow">{EYEBROW[mode]}</p>
        <h1 className="mt-3 text-3xl sm:text-[2rem]" style={headingStyle}>{COPY[mode].title}</h1>
        <p className="mt-2.5 leading-6 text-taupe-deep">{COPY[mode].lead}</p>
      </div>

      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        {mode === "register" && <Input id="name" icon={UserRound} label="Full name" autoComplete="name" value={f.name} onChange={set("name")} error={errors.name} placeholder="Enter your full name" />}
        {mode !== "reset" && <Input id="username" icon={User} label={mode === "forgot" ? "Username or email" : "Username"} autoComplete="username" autoCapitalize="none" spellCheck={false} autoFocus
          value={f.username} onChange={set("username")} error={errors.username} placeholder={mode === "forgot" ? "Enter your username or email" : "Enter your username"} />}
        {mode === "register" && <Input id="email" icon={Mail} type="email" label="Email" autoComplete="email" value={f.email} onChange={set("email")} error={errors.email} placeholder="Enter your email" />}
        {mode !== "forgot" && (
          <Input id="password" icon={Lock} password label={mode === "reset" ? "New password" : "Password"} autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={f.password} onChange={set("password")} error={errors.password} placeholder={mode === "login" ? "Enter your password" : "At least 8 characters"} />
        )}
        {(mode === "register" || mode === "reset") && <Input id="confirm" icon={Lock} password label="Confirm password" autoComplete="new-password" value={f.confirm} onChange={set("confirm")} error={errors.confirm} placeholder="Re-enter your password" />}

        {error && <p role="alert" className="flex items-start gap-2 text-sm text-danger"><CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden />{error}</p>}
        {info && <p role="status" className="flex items-start gap-2 text-sm text-ok"><CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden />{info}</p>}

        <button className={`${pill} !mt-7`} style={pillStyle} disabled={busy}>{busy ? <Loader2 className="animate-spin" size={18} /> : COPY[mode].cta}</button>
      </form>

      <p className="mt-8 text-center text-sm text-taupe-deep sm:text-left">
        {mode === "login" && <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2"><Link className="font-medium text-espresso underline underline-offset-4" href="/forgot-password">Forgot password?</Link><span>New to Zebella? <Link className="font-medium text-espresso underline underline-offset-4" href={`/register${q}`}>Create an account</Link></span></span>}
        {mode === "register" && <>Already have an account? <Link className="font-medium text-espresso underline underline-offset-4" href={`/login${q}`}>Sign in</Link></>}
        {(mode === "forgot" || mode === "reset") && <Link className="font-medium text-espresso underline underline-offset-4" href="/login">Back to sign in</Link>}
      </p>
      <p className="mt-6 border-t border-line pt-6 text-center text-xs leading-5 text-taupe-deep sm:text-left">
        By continuing you agree to our <Link className="text-espresso underline" href="/terms">Terms</Link> &amp; <Link className="text-espresso underline" href="/privacy-policy">Privacy Policy</Link>.
      </p>
    </>
  );
}

const PERKS = [
  { icon: Package, title: "Track every order", text: "Live status from payment to delivery." },
  { icon: Heart, title: "Save your favourites", text: "Build a wishlist across all collections." },
  { icon: Truck, title: "Faster checkout", text: "Saved addresses and one-tap reorder." },
];

export function AuthCard({ mode }: { mode: Mode }) {
  return (
    <div className="container-x grid min-h-[78vh] place-items-center py-8 sm:py-14">
      <div className="grid w-full max-w-[64rem] overflow-hidden rounded-[1.75rem] bg-white shadow-[0_40px_100px_-45px_rgba(35,26,29,.5)] ring-1 ring-line lg:grid-cols-[1.02fr_1fr]">
        {/* Brand panel (desktop) */}
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-gold via-gold-deep to-wine p-10 text-ivory lg:flex lg:flex-col">
          <Logo light />
          <div className="mt-6 max-w-sm">
            <h2 className="font-serif text-4xl leading-[1.1]">Dressed for every occasion.</h2>
            <p className="mt-3 text-sm leading-6 text-ivory/85">Discover handcrafted ethnic and contemporary collections, curated for you.</p>
          </div>
          <AuthIllustration className="mx-auto my-4 h-auto w-full max-w-[19rem] drop-shadow-[0_20px_30px_rgba(35,26,29,.25)]" />
          <ul className="mt-auto grid gap-3 text-sm">
            {PERKS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ivory/15 ring-1 ring-ivory/25"><Icon size={16} aria-hidden /></span><span><b className="font-medium">{title}</b><span className="text-ivory/75"> — {text}</span></span></li>
            ))}
          </ul>
        </aside>

        {/* Form panel */}
        <section className="px-6 py-9 sm:px-12 sm:py-12">
          <div className="mb-8 lg:hidden"><Logo /></div>
          {useMockApi && <p className="mb-6 rounded-xl border border-gold/40 bg-blush/60 p-3 text-xs leading-5 text-taupe-deep"><b className="text-espresso">Demo mode.</b> Sample data only — sign in with any username and password.</p>}
          <Suspense><Form mode={mode} /></Suspense>
          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-taupe-deep sm:justify-start"><ShieldCheck size={14} aria-hidden /> Your details are sent securely and never shared.</p>
        </section>
      </div>
    </div>
  );
}
