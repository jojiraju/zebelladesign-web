"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { Heart, House, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useCart } from "@/components/providers/CartProvider";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import type { Category, Collection } from "@/lib/types";

type Mega = "shop" | "collections" | null;

export function Header({ categories, collections }: { categories: Category[]; collections: Collection[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { count, setOpen: openCart } = useCart();
  const wishlist = useWishlist();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState<Mega>(null);
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);
  const [hot, setHot] = useState<string | null>(null);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 24 });
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isHome = pathname === "/";
  const transparent = isHome && !scrolled && !mega && !drawer;

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) { setLastPath(pathname); setMega(null); setDrawer(false); setSearch(false); }
  useEffect(() => {
    document.body.style.overflow = drawer || search ? "hidden" : "";
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setMega(null); setDrawer(false); setSearch(false); } };
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [drawer, search]);

  const openMega = (m: Mega) => { clearTimeout(closeTimer.current); setMega(m); };
  const closeMega = () => { closeTimer.current = setTimeout(() => setMega(null), 120); };

  const tone = transparent ? "text-ivory" : "text-espresso";
  const pillBg = transparent ? "bg-white/20" : "bg-blush";
  const iconBtn = `group/icon relative grid h-11 w-11 place-items-center rounded-full transition-[color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:bg-blush hover:text-gold-deep active:scale-90 ${tone}`;
  const iconSvg = "transition-transform duration-500 ease-[var(--ease-lux)] group-hover/icon:scale-110 group-hover/icon:-rotate-6";

  const navItem = ({ id, href, label, mega: m, active }: { id: string; href: string; label: string; mega?: Mega; active: boolean }) => (
    <Link key={id} href={href} onMouseEnter={() => { setHot(id); openMega(m ?? null); }} onFocus={() => { setHot(id); openMega(m ?? null); }}
      aria-haspopup={m ? "true" : undefined} aria-expanded={m ? mega === m : undefined} aria-current={active ? "page" : undefined}
      className={`relative rounded-full px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] transition-colors duration-300 ${tone} ${hot === id ? (transparent ? "" : "text-gold-deep") : ""}`}>
      {hot === id && <motion.span layoutId="nav-hover" className={`absolute inset-0 -z-10 rounded-full ${pillBg}`} transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
      {label}
      {active && <motion.span layoutId="nav-active" className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold" />}
    </Link>
  );
  const rise = (i: number) => ({ initial: { opacity: 0, y: -12 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.08 * i + 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } });

  return (
    <header className="sticky top-0 z-50" onMouseLeave={() => { closeMega(); setHot(null); }}>
      <div className={`relative transition-[background-color,box-shadow,backdrop-filter] duration-500 ${transparent ? "bg-transparent" : "bg-ivory/80 backdrop-blur-xl backdrop-saturate-150 shadow-[0_10px_40px_-20px_rgba(143,74,91,.35)]"}`}>
        {!transparent && <motion.div aria-hidden style={{ scaleX: progress }} className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-gradient-to-r from-rose-soft via-gold to-gold-deep" />}
        <div className={`container-x grid grid-cols-[1fr_auto_1fr] items-center transition-[height] duration-500 ${scrolled ? "h-16" : "h-20"}`}>
          {/* left: nav (desktop) / menu button (mobile) */}
          <motion.nav aria-label="Primary" className="hidden items-center gap-1 lg:flex" {...rise(0)}>
            {navItem({ id: "shop", href: "/shop", label: "Shop", mega: "shop", active: pathname === "/shop" })}
            {navItem({ id: "new", href: "/shop?sort=newest", label: "New Arrivals", active: false })}
            {navItem({ id: "col", href: "/collections", label: "Collections", mega: "collections", active: pathname.startsWith("/collections") })}
            {navItem({ id: "about", href: "/about", label: "About", active: pathname === "/about" })}
            {navItem({ id: "contact", href: "/contact", label: "Contact", active: pathname === "/contact" })}
          </motion.nav>
          <button className={`${iconBtn} -ml-3 justify-self-start lg:hidden`} aria-label="Open menu" onClick={() => setDrawer(true)}><Menu size={22} strokeWidth={1.4} /></button>

          <motion.div className="justify-self-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}><Logo light={transparent} /></motion.div>

          {/* right: utilities */}
          <motion.div className="flex items-center justify-end gap-0.5 sm:gap-1" {...rise(2)}>
            <Link className={`${iconBtn} hidden sm:grid`} href="/" aria-label="Home" aria-current={isHome ? "page" : undefined}><House size={20} strokeWidth={1.5} className={iconSvg} /></Link>
            <button className={iconBtn} aria-label="Search" onClick={() => setSearch(true)}><Search size={20} strokeWidth={1.5} className={iconSvg} /></button>
            <Link className={`${iconBtn} hidden sm:grid`} href={user ? "/account" : "/login"} aria-label={user ? "My account" : "Sign in"}><User size={20} strokeWidth={1.5} className={iconSvg} /></Link>
            <Link className={`${iconBtn} hidden sm:grid`} href="/account/wishlist" aria-label={`Wishlist, ${wishlist.ids.length} items`}>
              <Heart size={20} strokeWidth={1.5} className={iconSvg} />
              {wishlist.ids.length > 0 && <Dot n={wishlist.ids.length} />}
            </Link>
            <button className={iconBtn} aria-label={`Shopping bag, ${count} items`} onClick={() => openCart(true)}>
              <ShoppingBag size={20} strokeWidth={1.5} className={iconSvg} />
              {count > 0 && <Dot n={count} />}
            </button>
          </motion.div>
        </div>

        {/* mega menu */}
        <AnimatePresence>
          {mega && (
            <motion.div key={mega} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
              className="absolute inset-x-0 top-full hidden border-t border-line bg-ivory shadow-xl lg:block" onMouseEnter={() => openMega(mega)}>
              <div className="container-x grid grid-cols-12 gap-10 py-10 text-espresso">
                {mega === "shop" ? (
                  <>
                    <div className="col-span-3">
                      <p className="eyebrow mb-5">Categories</p>
                      <ul className="space-y-3">
                        <li><Link href="/shop" className="link-underline text-sm">All products</Link></li>
                        {categories.map((c) => <li key={c.id}><Link href={`/categories/${c.slug}`} className="link-underline text-sm">{c.name}</Link></li>)}
                      </ul>
                      {categories.length === 0 && <p className="text-sm text-taupe-deep">Categories appear here once added in the CMS.</p>}
                    </div>
                    <MegaTiles items={collections.slice(0, 3)} />
                  </>
                ) : (
                  <>
                    <div className="col-span-3">
                      <p className="eyebrow mb-5">Collections</p>
                      <ul className="space-y-3">
                        {collections.map((c) => <li key={c.id}><Link href={`/collections/${c.slug}`} className="link-underline text-sm">{c.name}</Link></li>)}
                        <li><Link href="/collections" className="link-underline text-sm text-gold-deep">View all</Link></li>
                      </ul>
                    </div>
                    <MegaTiles items={collections.slice(0, 3)} />
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <MobileDrawer open={drawer} onClose={() => setDrawer(false)} categories={categories} collections={collections} signedIn={!!user} />
      <SearchOverlay open={search} onClose={() => setSearch(false)} onSubmit={(q) => router.push(`/search?q=${encodeURIComponent(q)}`)} />
    </header>
  );
}

const Dot = ({ n }: { n: number }) => (
  <span className="absolute right-0.5 top-1 grid h-[1.1rem] min-w-[1.1rem] place-items-center rounded-full bg-gradient-to-br from-gold to-gold-deep px-1 text-[0.62rem] shadow-sm font-medium leading-none text-white" aria-hidden>{n > 99 ? "99+" : n}</span>
);

function MegaTiles({ items }: { items: Collection[] }) {
  if (!items.length) return <div className="col-span-9" />;
  return (
    <div className="col-span-9 grid grid-cols-3 gap-6">
      {items.map((c) => (
        <Link key={c.id} href={`/collections/${c.slug}`} className="group block">
          <div className="relative aspect-[4/5] overflow-hidden bg-cream">
            {c.imageUrl && <Image src={c.imageUrl} alt="" fill sizes="25vw" className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-lux)] group-hover:scale-105" />}
          </div>
          <p className="mt-3 font-serif text-xl">{c.name}</p>
        </Link>
      ))}
    </div>
  );
}

function MobileDrawer({ open, onClose, categories, collections, signedIn }: { open: boolean; onClose(): void; categories: Category[]; collections: Collection[]; signedIn: boolean }) {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (open) first.current?.focus(); }, [open]);
  const link = "block py-3 font-serif text-3xl";
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[70] bg-espresso/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-y-0 left-0 z-[71] flex w-[88vw] max-w-sm flex-col overflow-y-auto bg-ivory p-6 text-espresso"
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "tween", duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
            <div className="flex items-center justify-between">
              <Logo />
              <button ref={first} onClick={onClose} aria-label="Close menu" className="grid h-11 w-11 place-items-center"><X size={22} strokeWidth={1.4} /></button>
            </div>
            <nav className="mt-8 flex-1" aria-label="Mobile">
              <Link href="/shop" className={link}>Shop</Link>
              <Link href="/shop?sort=newest" className={link}>New Arrivals</Link>
              <Link href="/collections" className={link}>Collections</Link>
              {categories.length > 0 && (
                <div className="mb-3 ml-1 border-l border-line pl-4">
                  {categories.map((c) => <Link key={c.id} href={`/categories/${c.slug}`} className="block py-1.5 text-sm text-taupe-deep">{c.name}</Link>)}
                </div>
              )}
              {collections.length > 0 && (
                <div className="mb-3 ml-1 border-l border-line pl-4">
                  {collections.map((c) => <Link key={c.id} href={`/collections/${c.slug}`} className="block py-1.5 text-sm text-taupe-deep">{c.name}</Link>)}
                </div>
              )}
              <Link href="/about" className={link}>About Us</Link>
              <Link href="/contact" className={link}>Contact</Link>
            </nav>
            <div className="mt-6 flex flex-col gap-3 border-t border-line pt-6 text-sm uppercase tracking-[0.2em]">
              <Link href={signedIn ? "/account" : "/login"}>{signedIn ? "My Account" : "Sign In / Register"}</Link>
              <Link href="/account/wishlist">Wishlist</Link>
              <Link href="/order-tracking">Track an order</Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function SearchOverlay({ open, onClose, onSubmit }: { open: boolean; onClose(): void; onSubmit(q: string): void }) {
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  useEffect(() => { if (open) setTimeout(() => input.current?.focus(), 50); }, [open]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-0 z-[72] bg-ivory text-espresso" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="container-x flex h-20 items-center justify-end"><button onClick={onClose} aria-label="Close search" className="grid h-11 w-11 place-items-center"><X size={24} strokeWidth={1.3} /></button></div>
          <form className="container-x mx-auto mt-[12vh] max-w-3xl" onSubmit={(e) => { e.preventDefault(); if (q.trim()) onSubmit(q.trim()); }} role="search">
            <label htmlFor="site-search" className="eyebrow">Search Zebella</label>
            <div className="mt-4 flex items-center gap-4 border-b border-espresso pb-3">
              <Search size={26} strokeWidth={1.2} aria-hidden />
              <input id="site-search" ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kurta, saree, lehenga…" className="w-full bg-transparent font-serif text-3xl outline-none placeholder:text-taupe sm:text-5xl" autoComplete="off" />
            </div>
            <p className="mt-4 text-sm text-taupe-deep">Press Enter to search</p>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
