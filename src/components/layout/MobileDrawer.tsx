"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ChevronDown, Heart, LogOut, MessageCircle, PackageSearch, ShoppingBag, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/components/providers/AuthProvider";
import { collectionArt } from "@/lib/art";
import type { Category, Collection } from "@/lib/types";

const noop = () => () => {};
/** True only in the browser (so the portal never renders during SSR). */
const useIsClient = () => useSyncExternalStore(noop, () => true, () => false);

function Row({ href, label, hint, onClose }: { href: string; label: string; hint?: string; onClose(): void }) {
  return (
    <Link href={href} onClick={onClose} className="group flex items-center justify-between gap-3 border-b border-line/70 px-2 py-3 transition active:bg-blush/60">
      <span><span className="block font-serif text-[1.65rem] leading-tight">{label}</span>{hint && <span className="mt-0.5 block text-xs text-taupe-deep">{hint}</span>}</span>
      <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-white text-gold-deep transition group-active:translate-x-1 group-active:bg-blush"><ArrowRight size={16} /></span>
    </Link>
  );
}

function Fold({ id, label, hint, open, onToggle, children }: { id: string; label: string; hint: string; open: boolean; onToggle(): void; children: React.ReactNode }) {
  return (
    <div className={`border-b border-line/70 transition ${open ? "rounded-2xl border-transparent bg-white shadow-[0_18px_40px_-34px_rgba(143,74,91,.6)] ring-1 ring-line" : ""}`}>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={onToggle} className="flex w-full items-center justify-between gap-3 px-2 py-3 text-left">
        <span><span className="block font-serif text-[1.65rem] leading-tight">{label}</span><span className="mt-0.5 block text-xs text-taupe-deep">{hint}</span></span>
        <span aria-hidden className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-white text-gold-deep transition-transform duration-300 ${open ? "rotate-180" : ""}`}><ChevronDown size={16} /></span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div id={id} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <div className="px-3 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Slide-in menu. Rendered in a portal on <body>: inside the sticky header, its backdrop-filter would trap `position: fixed`. */
export function MobileDrawer({ open, onClose, categories, collections }: { open: boolean; onClose(): void; categories: Category[]; collections: Collection[] }) {
  const { user, profile, logout } = useAuth();
  const client = useIsClient();
  const panel = useRef<HTMLElement>(null);
  const [fold, setFold] = useState<"collections" | "categories" | null>(null);

  useEffect(() => { if (open) panel.current?.focus({ preventScroll: true }); }, [open]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);

  if (!client) return null;
  const name = profile.displayName || user?.displayName || user?.username || "";

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[80] bg-espresso/55 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden />
          <motion.aside ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Menu"
            className="fixed inset-y-0 left-0 z-[81] flex w-[90vw] max-w-sm flex-col overflow-hidden outline-none rounded-r-[2rem] bg-ivory text-espresso shadow-[30px_0_80px_-30px_rgba(35,26,29,.55)]"
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "tween", duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-5">
              <Logo />
              <button onClick={onClose} aria-label="Close menu" className="grid h-11 w-11 place-items-center rounded-full border border-line bg-white transition hover:bg-blush"><X size={20} strokeWidth={1.5} /></button>
            </div>

            <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
              {/* Account card */}
              {user ? (
                <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-gold via-gold-deep to-wine p-4 text-ivory">
                  <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ivory/20 text-lg font-semibold ring-2 ring-ivory/40" style={{ fontFamily: "var(--font-sans)" }}>{(name[0] ?? "Z").toUpperCase()}</span>
                  <div className="min-w-0 flex-1"><p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ivory/75">Welcome back</p><p className="truncate font-semibold" style={{ fontFamily: "var(--font-sans)" }}>{name || "there"}</p></div>
                  <Link href="/account" onClick={onClose} className="rounded-full bg-ivory px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep">Account</Link>
                </div>
              ) : (
                <div className="rounded-2xl bg-gradient-to-br from-blush to-white p-4 ring-1 ring-line">
                  <p className="font-serif text-xl leading-tight">Sign in for faster checkout</p>
                  <p className="mt-1 text-xs text-taupe-deep">Track orders and save your favourites.</p>
                  <div className="mt-3 flex gap-2">
                    <Link href="/login" onClick={onClose} className="btn btn-solid !min-h-10 flex-1 !px-4">Sign in</Link>
                    <Link href="/register" onClick={onClose} className="btn btn-ghost !min-h-10 flex-1 !px-4">Create account</Link>
                  </div>
                </div>
              )}

              {/* Main navigation */}
              <nav aria-label="Mobile" className="mt-3">
                <Row href="/shop" label="Shop" hint="Everything, newest first" onClose={onClose} />
                <Row href="/shop?sort=newest" label="New Arrivals" hint="Just landed" onClose={onClose} />

                {collections.length > 0 && (
                  <Fold id="m-collections" label="Collections" hint={`${collections.length} curated edits`} open={fold === "collections"} onToggle={() => setFold(fold === "collections" ? null : "collections")}>
                    <ul className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 no-scrollbar">
                      {collections.map((c, i) => (
                        <li key={c.id} className="w-28 shrink-0 snap-start">
                          <Link href={`/collections/${c.slug}`} onClick={onClose} className="group block">
                            <span className="relative block aspect-[3/4] overflow-hidden rounded-xl bg-cream"><Image src={collectionArt(c.imageUrl, i)} alt="" fill sizes="112px" className="object-cover object-top" /></span>
                            <span className="mt-1.5 line-clamp-2 block text-xs font-medium leading-4">{c.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link href="/collections" onClick={onClose} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gold-deep">View all collections <ArrowRight size={13} aria-hidden /></Link>
                  </Fold>
                )}

                {categories.length > 0 && (
                  <Fold id="m-categories" label="Shop by category" hint="Anarkalis, frocks, gowns…" open={fold === "categories"} onToggle={() => setFold(fold === "categories" ? null : "categories")}>
                    <ul className="flex flex-wrap gap-2">
                      {categories.map((c) => <li key={c.id}><Link href={`/categories/${c.slug}`} onClick={onClose} className="inline-flex rounded-full border border-line bg-ivory px-4 py-2 text-sm transition active:bg-blush">{c.name}</Link></li>)}
                    </ul>
                  </Fold>
                )}

                <Row href="/about" label="About Us" hint="Our story" onClose={onClose} />
                <Row href="/contact" label="Contact" hint="We're here to help" onClose={onClose} />
              </nav>

              {/* Quick actions */}
              <ul className="mt-5 grid grid-cols-3 gap-2.5">
                {[
                  { href: "/account/wishlist", label: "Wishlist", Icon: Heart },
                  { href: "/order-tracking", label: "Track order", Icon: PackageSearch },
                  { href: "/cart", label: "My bag", Icon: ShoppingBag },
                ].map(({ href, label, Icon }) => (
                  <li key={href}><Link href={href} onClick={onClose} className="flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-white px-2 py-3.5 text-center text-xs font-medium transition active:bg-blush"><Icon size={19} strokeWidth={1.6} className="text-gold-deep" aria-hidden />{label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line bg-white/70 px-5 py-3.5" style={{ paddingBottom: "max(0.875rem, env(safe-area-inset-bottom))" }}>
              <Link href="/contact" onClick={onClose} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-taupe-deep"><MessageCircle size={15} aria-hidden />Need help?</Link>
              {user ? (
                <button type="button" onClick={async () => { await logout(); onClose(); }} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-danger"><LogOut size={15} aria-hidden />Log out</button>
              ) : (
                <Link href="/order-tracking" onClick={onClose} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-taupe-deep"><PackageSearch size={15} aria-hidden />Track order</Link>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
