"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LayoutGrid, Loader2, LogOut, MapPin, Package, UserRound } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

const NAV = [
  { href: "/account", label: "Overview", title: "My account", icon: LayoutGrid },
  { href: "/account/orders", label: "Orders", title: "Orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", title: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", title: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile", title: "Profile", icon: UserRound },
] as const;

const titleFor = (path: string) => (path.startsWith("/account/orders/") ? "Order details" : NAV.find((n) => n.href === path)?.title ?? "My account");

/** The wishlist also works for guests (saved on the device), so it is the one tab not behind the sign-in guard. */
const PUBLIC_TABS = new Set(["/account/wishlist"]);

/** Clean sans for names/initials. (A style prop is needed: the global h1-h3 rule forces the serif otherwise.) */
const SANS = { fontFamily: "var(--font-sans)", fontWeight: 600, fontVariationSettings: "normal", letterSpacing: "-0.015em" } as const;

const initials = (s: string) => s.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "Z";

function AccountSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading your account">
      <div className="skeleton h-7 w-56" />
      <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>
    </div>
  );
}

/** Client-side route guard + account chrome. (Data access is enforced by the backend API, not by this redirect.) */
export function AccountShell({ children }: { children: React.ReactNode }) {
  const { user, profile, ready, configured, logout } = useAuth();
  const router = useRouter();
  const path = usePathname();
  const title = titleFor(path);
  const guarded = !PUBLIC_TABS.has(path);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => { if (guarded && ready && !user && configured && !leaving) router.replace(`/login?next=${encodeURIComponent(path)}`); }, [guarded, ready, user, configured, router, path, leaving]);

  async function signOut() {
    setLeaving(true);
    try { await logout(); } finally { router.push("/"); }
  }

  if (guarded && !configured) return <div className="container-x py-24 text-center"><p className="font-serif text-3xl">Accounts aren&apos;t available yet</p><p className="mt-2 text-taupe-deep">The store backend has not been configured for this site.</p></div>;
  // While the session is being checked (or we are redirecting) keep the layout and show placeholders instead of a spinner swap.
  const loading = guarded && (!ready || !user);
  const name = profile.displayName || user?.displayName || user?.username || "";
  const sub = user?.email || user?.username || "";

  return (
    <div className="container-x py-8 sm:py-12">
      {/* Welcome header */}
      <header className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-gold via-gold-deep to-wine p-6 text-ivory shadow-[0_30px_70px_-40px_rgba(143,74,91,.7)] sm:p-9">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-ivory/10 blur-sm" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full border border-ivory/20" />
        <div className="relative flex flex-wrap items-center gap-5">
          <span aria-hidden style={SANS} className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-ivory/15 text-2xl font-semibold ring-2 ring-ivory/40 sm:h-20 sm:w-20 sm:text-3xl">
            {loading ? <Loader2 className="animate-spin" size={22} /> : user ? initials(name) : <UserRound size={28} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-ivory/75">{user ? "Welcome back" : "Guest"}</p>
            <h2 style={SANS} className="mt-1.5 truncate text-3xl font-semibold tracking-tight sm:text-[2.5rem] sm:leading-tight">{loading ? " " : user ? name || "there" : "Your wishlist"}</h2>
            {user && sub && <p className="mt-1 truncate text-sm text-ivory/80">{sub}</p>}
          </div>
          {user ? (
            <button type="button" onClick={signOut} disabled={leaving}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ivory/60 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-ivory transition hover:bg-ivory hover:text-espresso disabled:opacity-60">
              {leaving ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} aria-hidden />} Log out
            </button>
          ) : ready && (
            <Link href={`/login?next=${encodeURIComponent(path)}`} className="btn btn-light !min-h-11">Sign in</Link>
          )}
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[15rem_1fr] lg:gap-10">
        <nav aria-label="Account" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-col lg:overflow-visible lg:rounded-2xl lg:border lg:border-line lg:bg-white lg:p-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/account" ? path === href : path === href || path.startsWith(`${href}/`);
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-3 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition lg:rounded-xl ${active ? "bg-espresso text-ivory shadow-sm" : "bg-white text-taupe-deep ring-1 ring-line hover:text-espresso lg:bg-transparent lg:ring-0 lg:hover:bg-blush/60"}`}>
                <Icon size={17} strokeWidth={1.6} aria-hidden />{label}
              </Link>
            );
          })}
          {user && (
            <button type="button" onClick={signOut} disabled={leaving}
              className="inline-flex shrink-0 items-center gap-3 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium text-danger transition hover:bg-red-50 lg:mt-2 lg:rounded-xl lg:border-t lg:border-line lg:pt-3.5">
              <LogOut size={17} strokeWidth={1.6} aria-hidden />Log out
            </button>
          )}
        </nav>

        <main className="min-w-0">
          <h1 className="mb-7 font-serif text-3xl sm:text-4xl">{title}</h1>
          {loading ? <AccountSkeleton /> : children}
        </main>
      </div>
    </div>
  );
}
