"use client";
import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Flame, House, LayoutGrid, ShoppingCart, Sparkles, type LucideIcon } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";

type Item = { key: string; label: string; href: string; Icon: LucideIcon; active: (path: string, sort: string | null) => boolean };

const ITEMS: Item[] = [
  { key: "home", label: "Home", href: "/", Icon: House, active: (p) => p === "/" },
  { key: "collections", label: "Collections", href: "/collections", Icon: LayoutGrid, active: (p) => p.startsWith("/collections") },
  { key: "best", label: "Best Sellers", href: "/shop?sort=popular", Icon: Flame, active: (p, s) => p.startsWith("/shop") && s === "popular" },
  { key: "new", label: "New Launches", href: "/shop?sort=newest", Icon: Sparkles, active: (p, s) => p.startsWith("/shop") && s === "newest" },
];

function Bar() {
  const path = usePathname();
  const sort = useSearchParams().get("sort");
  const { count, setOpen } = useCart();

  const cell = "group relative flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-center text-[0.68rem] font-semibold leading-tight outline-none";

  return (
    <nav aria-label="Quick navigation" className="fixed inset-x-3 bottom-3 z-40 lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <motion.div
        initial={{ y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="glass mx-auto flex max-w-md items-stretch rounded-[1.75rem] p-1.5 shadow-[0_20px_50px_-15px_rgba(143,74,91,.5)]"
      >
        {ITEMS.map(({ key, label, href, Icon, active }) => {
          const on = active(path, sort);
          return (
            <Link key={key} href={href} aria-current={on ? "page" : undefined} className={`${cell} ${on ? "text-gold-deep" : "text-taupe-deep hover:text-gold-deep"}`}>
              {on && <motion.span layoutId="bottom-nav-pill" className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-b from-blush to-white shadow-[inset_0_0_0_1px_rgba(185,110,124,.25)]" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
              <motion.span whileHover={{ y: -3, scale: 1.12 }} whileTap={{ scale: 0.85, rotate: -6 }} animate={on ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
                <Icon size={22} fill={on ? "currentColor" : "none"} strokeWidth={on ? 1.6 : 1.8} />
              </motion.span>
              <span className="transition-transform duration-300 group-hover:-translate-y-0.5">{label}</span>
            </Link>
          );
        })}
        <button type="button" onClick={() => setOpen(true)} aria-label={`Cart, ${count} items`} className={`${cell} text-taupe-deep hover:text-gold-deep`}>
          <motion.span className="relative" whileHover={{ y: -3, scale: 1.12 }} whileTap={{ scale: 0.85, rotate: -6 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
            <ShoppingCart size={22} strokeWidth={1.8} />
            {count > 0 && (
              <motion.span key={count} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }} className="absolute -right-2.5 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-gold-deep px-1 text-[0.6rem] text-white">{count}</motion.span>
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
