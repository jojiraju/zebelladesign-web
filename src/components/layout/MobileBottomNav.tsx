"use client";
import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Heart, House, LayoutGrid, ShoppingCart, Sparkles, type LucideIcon } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";

type Item = { key: string; label: string; full: string; href: string; Icon: LucideIcon; active: (path: string, sort: string | null) => boolean };

const ITEMS: Item[] = [
  { key: "home", label: "Home", full: "Home", href: "/", Icon: House, active: (p) => p === "/" },
  { key: "collections", label: "Collections", full: "Collections", href: "/collections", Icon: LayoutGrid, active: (p) => p.startsWith("/collections") },
  { key: "new", label: "New", full: "New launches", href: "/shop?sort=newest", Icon: Sparkles, active: (p, s) => p.startsWith("/shop") && s === "newest" },
  { key: "wishlist", label: "Wishlist", full: "Wishlist", href: "/account/wishlist", Icon: Heart, active: (p) => p.startsWith("/account/wishlist") },
];

function Bar() {
  const path = usePathname();
  const sort = useSearchParams().get("sort");
  const { count, setOpen } = useCart();

  const cell = "group relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 py-2 text-center text-[0.6rem] font-semibold leading-none tracking-tight outline-none min-[360px]:text-[0.68rem] min-[360px]:tracking-normal";

  return (
    <nav aria-label="Quick navigation" className="fixed inset-x-3 bottom-3 z-40 min-[1440px]:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <motion.div
        initial={{ y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="glass mx-auto grid max-w-md grid-cols-5 items-stretch rounded-[1.5rem] p-1 shadow-[0_20px_50px_-15px_rgba(143,74,91,.5)]"
      >
        {ITEMS.map(({ key, label, full, href, Icon, active }) => {
          const on = active(path, sort);
          return (
            <Link key={key} href={href} aria-label={full} aria-current={on ? "page" : undefined} className={`${cell} ${on ? "text-gold-deep" : "text-taupe-deep hover:text-gold-deep"}`}>
              {on && <motion.span layoutId="bottom-nav-pill" className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-b from-blush to-white shadow-[inset_0_0_0_1px_rgba(185,110,124,.25)]" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
              <motion.span whileHover={{ y: -3, scale: 1.12 }} whileTap={{ scale: 0.85, rotate: -6 }} animate={on ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
                <Icon size={21} fill={on ? "currentColor" : "none"} strokeWidth={on ? 1.6 : 1.8} />
              </motion.span>
              <span className="block w-full truncate">{label}</span>
            </Link>
          );
        })}
        <button type="button" onClick={() => setOpen(true)} aria-label={`Cart, ${count} items`} className={`${cell} text-taupe-deep hover:text-gold-deep`}>
          <motion.span className="relative" whileHover={{ y: -3, scale: 1.12 }} whileTap={{ scale: 0.85, rotate: -6 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
            <ShoppingCart size={21} strokeWidth={1.8} />
            {count > 0 && (
              <motion.span key={count} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }} className="absolute -right-2.5 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-gold-deep px-1 text-[0.6rem] text-white">{count > 99 ? "99+" : count}</motion.span>
            )}
          </motion.span>
          <span>Cart</span>
        </button>
      </motion.div>
    </nav>
  );
}

export function MobileBottomNav() {
  return <Suspense fallback={null}><Bar /></Suspense>;
}

function Rail() {
  const path = usePathname();
  const sort = useSearchParams().get("sort");
  const { count, setOpen } = useCart();
  const btn = "group relative grid h-10 w-10 place-items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold-deep";
  const tip = "pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-full bg-espresso px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ivory opacity-0 shadow-lg transition duration-200 group-hover:translate-x-1 group-hover:opacity-100 group-focus-visible:opacity-100";

  return (
    <nav aria-label="Quick navigation" className="fixed left-1 top-1/2 z-40 hidden -translate-y-1/2 min-[1440px]:block">
      <motion.ul
        initial={{ x: -70, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 24, delay: 0.3 }}
        className="glass flex flex-col items-center gap-1 rounded-full p-1 shadow-[0_20px_50px_-15px_rgba(143,74,91,.5)]"
      >
        {ITEMS.map(({ key, full, href, Icon, active }) => {
          const on = active(path, sort);
          return (
            <li key={key}>
              <Link href={href} aria-label={full} aria-current={on ? "page" : undefined} className={`${btn} ${on ? "text-gold-deep" : "text-taupe-deep hover:text-gold-deep"}`}>
                {on && <motion.span layoutId="side-nav-pill" className="absolute inset-0 rounded-full bg-gradient-to-b from-blush to-white shadow-[inset_0_0_0_1px_rgba(185,110,124,.3)]" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
                <motion.span className="relative" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
                  <Icon size={20} fill={on ? "currentColor" : "none"} strokeWidth={on ? 1.6 : 1.6} aria-hidden />
                </motion.span>
                <span aria-hidden className={tip}>{full}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <button type="button" onClick={() => setOpen(true)} aria-label={`Cart, ${count} items`} className={`${btn} text-taupe-deep hover:text-gold-deep`}>
            <motion.span className="relative" whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
              <ShoppingCart size={20} strokeWidth={1.6} aria-hidden />
              {count > 0 && <motion.span key={count} initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-gold-deep px-1 text-[0.6rem] text-white">{count > 99 ? "99+" : count}</motion.span>}
            </motion.span>
            <span aria-hidden className={tip}>Cart</span>
          </button>
        </li>
      </motion.ul>
    </nav>
  );
}

/** Persistent vertical quick-nav on wide screens (1440px and up). */
export function SideNav() {
  return <Suspense fallback={null}><Rail /></Suspense>;
}
