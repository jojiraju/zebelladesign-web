"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { apiJson, isApiConfigured, tokenStore } from "@/lib/api/client";
import { clampQty, reconcileCart, sameLine as same } from "@/lib/commerce/cart";
import type { CartItemInput } from "@/lib/types";
import { useAuth } from "./AuthProvider";

const KEY = "zebella.cart.v1";

interface CartCtx {
  items: CartItemInput[];
  couponCode: string;
  count: number;
  open: boolean;
  setOpen(v: boolean): void;
  add(item: CartItemInput): void;
  setQty(productId: string, variantId: string, qty: number): void;
  remove(productId: string, variantId: string): void;
  setCoupon(code: string): void;
  clear(): void;
}

const Ctx = createContext<CartCtx | null>(null);

function readLocal(): { items: CartItemInput[]; couponCode: string; owner: string | null } {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (raw && Array.isArray(raw.items)) return { items: raw.items, couponCode: raw.couponCode ?? "", owner: raw.owner ?? null };
  } catch { /* corrupted storage: start fresh */ }
  return { items: [], couponCode: "", owner: null };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const [items, setItems] = useState<CartItemInput[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [open, setOpen] = useState(false);
  // State (not a ref): the persist effect must only run once the stored cart is IN state, otherwise the first
  // commit would overwrite the saved cart with the empty initial one.
  const [hydrated, setHydrated] = useState(false);
  // Which account this device's cart is a copy of (null: a guest cart whose items are not on any account yet).
  const [owner, setOwner] = useState<string | null>(null);
  // Mirroring is only safe once the account cart has loaded; before that it could overwrite the account with this device's cart.
  const [syncedFor, setSyncedFor] = useState<string | null>(null);
  const loadStartedFor = useRef<string | null>(null);

  // Hydrate the cart from localStorage once.
  useEffect(() => {
    const l = readLocal();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from localStorage; must run post-mount to avoid an SSR mismatch */
    setItems(l.items);
    setCouponCode(l.couponCode);
    setOwner(l.owner);
    /* eslint-enable react-hooks/set-state-in-effect */
    setHydrated(true);
  }, []);

  // Persist locally on every change.
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(KEY, JSON.stringify({ items, couponCode, owner })); } catch { /* private mode */ }
  }, [items, couponCode, owner, hydrated]);

  // Signed-in: load the account cart once per login and combine it with this device's cart.
  useEffect(() => {
    if (!hydrated || !ready || !user || !isApiConfigured() || loadStartedFor.current === user.id) return;
    const id = user.id;
    loadStartedFor.current = id;
    (async () => {
      try {
        // GET /cart -> { items: CartItemInput[], couponCode?: string }
        const remote = await apiJson<{ items?: CartItemInput[]; couponCode?: string }>("/cart", { method: "GET" });
        if (loadStartedFor.current !== id) return; // signed out while loading
        setItems((device) => reconcileCart(remote.items ?? [], device, owner));
        setCouponCode((c) => (owner === null ? c || remote.couponCode || "" : remote.couponCode ?? ""));
        setOwner(id);
        setSyncedFor(id);
      } catch (e) {
        console.error("[cart] could not load account cart", e);
      }
    })();
  }, [hydrated, ready, user, owner]);

  // Signed out: an account's cart must not stay on the device for the next person. (A remaining token means the
  // session check only failed on a network error, so the shopper is still signed in and their copy stays.)
  useEffect(() => {
    if (user) return;
    loadStartedFor.current = null;
    /* eslint-disable react-hooks/set-state-in-effect -- resets derived sync state when the signed-in user goes away */
    setSyncedFor(null);
    if (ready && owner && !tokenStore.get()) {
      setItems([]);
      setCouponCode("");
      setOwner(null);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [user, ready, owner]);

  // Mirror to the account cart (debounced).
  useEffect(() => {
    if (!user || !isApiConfigured() || syncedFor !== user.id) return;
    const t = setTimeout(() => {
      // PUT /cart { items, couponCode }
      apiJson("/cart", { method: "PUT", json: { items, couponCode } }).catch((e) =>
        console.error("[cart] sync failed", e));
    }, 600);
    return () => clearTimeout(t);
  }, [items, couponCode, user, syncedFor]);

  // Cross-tab sync.
  useEffect(() => {
    const on = (e: StorageEvent) => { if (e.key === KEY) { const l = readLocal(); setItems(l.items); setCouponCode(l.couponCode); setOwner(l.owner); } };
    window.addEventListener("storage", on);
    return () => window.removeEventListener("storage", on);
  }, []);

  const add = useCallback((item: CartItemInput) => {
    setItems((cur) => {
      const hit = cur.find((i) => same(i, item));
      return hit ? cur.map((i) => (same(i, item) ? { ...i, quantity: clampQty(i.quantity + item.quantity) } : i)) : [...cur, { ...item, quantity: clampQty(item.quantity) }];
    });
  }, []);
  const setQty = useCallback((productId: string, variantId: string, qty: number) =>
    setItems((cur) => cur.map((i) => (same(i, { productId, variantId }) ? { ...i, quantity: clampQty(qty) } : i))), []);
  const remove = useCallback((productId: string, variantId: string) =>
    setItems((cur) => cur.filter((i) => !same(i, { productId, variantId }))), []);
  const clear = useCallback(() => { setItems([]); setCouponCode(""); }, []);

  const value = useMemo<CartCtx>(() => ({
    items, couponCode, open, setOpen, add, setQty, remove, clear, setCoupon: setCouponCode,
    count: items.reduce((n, i) => n + i.quantity, 0),
  }), [items, couponCode, open, add, setQty, remove, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside <CartProvider>");
  return c;
}
