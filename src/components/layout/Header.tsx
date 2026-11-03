"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { collectionArt } from "@/lib/art";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { Heart, House, Search, ShoppingBag, User } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SearchOverlay } from "./SearchOverlay";
import { MobileDrawer } from "./MobileDrawer";
import { useCart } from "@/components/providers/CartProvider";
import { useWishlist } from "@/components/providers/WishlistProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import type { Category, Collection } from "@/lib/types";

type Mega = "shop" | "collections" | null;

export function Header({ categories, collections }: { categories: Category[]; collections: Collection[] }) {
  const pathname = usePathname();
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
  // A light desktop banner (Hero textInImage) needs the dark header text, not the ivory-on-photo style.
  const [lightBanner, setLightBanner] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setLightBanner(isHome && mq.matches && !!document.querySelector("[data-hero-banner]"));
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [isHome]);
  const transparent = isHome && !scrolled && !mega && !drawer && !lightBanner;

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
          <button className={`group/menu -ml-2 inline-flex h-11 items-center gap-2.5 justify-self-start rounded-full px-2 transition duration-300 hover:text-gold-deep active:scale-95 lg:hidden ${tone}`} aria-label="Open menu" onClick={() => setDrawer(true)}>
            <span aria-hidden className="flex w-6 flex-col items-start gap-[7px]">
              <span className="h-px w-full bg-current" />
              <span className="h-px w-[58%] bg-current transition-all duration-300 group-hover/menu:w-full" />
            </span>
            <span className="text-[0.66rem] font-semibold uppercase tracking-[0.26em] max-[379px]:sr-only">Menu</span>
          </button>

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

      <MobileDrawer open={drawer} onClose={() => setDrawer(false)} categories={categories} collections={collections} />
      <SearchOverlay open={search} onClose={() => setSearch(false)} categories={categories} />
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
      {items.map((c, i) => (
        <Link key={c.id} href={`/collections/${c.slug}`} className="group block">
          <div className="relative aspect-[4/5] overflow-hidden bg-cream">
            <Image src={collectionArt(c.imageUrl, i)} alt="" fill sizes="25vw" className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-lux)] group-hover:scale-105" />
          </div>
          <p className="mt-3 font-serif text-xl">{c.name}</p>
        </Link>
      ))}
    </div>
  );
}

