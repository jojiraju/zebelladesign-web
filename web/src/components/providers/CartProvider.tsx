"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { MAX_QTY_PER_LINE } from "@/lib/commerce/catalog-rules";
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

const same = (a: CartItemInput, b: { productId: string; variantId: string }) => a.productId === b.productId && a.variantId === b.variantId;
const clampQty = (n: number) => Math.max(1, Math.min(MAX_QTY_PER_LINE, Math.floor(n)));

/** Merge two carts: same line quantities are summed (capped), so nothing a shopper added is lost at login. */
export function mergeCarts(a: CartItemInput[], b: CartItemInput[]): CartItemInput[] {
  const out = a.map((i) => ({ ...i }));
  for (const item of b) {
    const hit = out.find((o) => same(o, item));
    if (hit) hit.quantity = clampQty(hit.quantity + item.quantity);
    else out.push({ ...item });
  }
  return out;
}

function readLocal(): { items: CartItemInput[]; couponCode: string } {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (raw && Array.isArray(raw.items)) return { items: raw.items, couponCode: raw.couponCode ?? "" };
  } catch { /* corrupted storage: start fresh */ }
  return { items: [], couponCode: "" };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const [items, setItems] = useState<CartItemInput[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [open, setOpen] = useState(false);
  const hydrated = useRef(false);
  const mergedFor = useRef<string | null>(null);

  // Hydrate guest cart from localStorage once.
  useEffect(() => {
    const l = readLocal();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from localStorage; must run post-mount to avoid an SSR mismatch */
    setItems(l.items);
    setCouponCode(l.couponCode);
    /* eslint-enable react-hooks/set-state-in-effect */
    hydrated.current = true;
  }, []);

  // Persist locally (guest carts) on every change.
  useEffect(() => {
    if (!hydrated.current) return;
    try { localStorage.setItem(KEY, JSON.stringify({ items, couponCode })); } catch { /* private mode */ }
  }, [items, couponCode]);

  // Signed-in: merge guest cart with the account cart exactly once per login, then mirror to Firestore.
  useEffect(() => {
    if (!ready || !user || !isFirebaseConfigured() || mergedFor.current === user.uid) return;
    mergedFor.current = user.uid;
    (async () => {
      try {
        const snap = await getDoc(doc(db(), "carts", user.uid));
        const remote = (snap.exists() ? (snap.data().items as CartItemInput[]) : []) ?? [];
        setItems((local) => mergeCarts(remote, local));
        if (snap.exists() && snap.data().couponCode) setCouponCode((c) => c || snap.data().couponCode);
      } catch (e) {
        console.error("[cart] could not load account cart", e);
      }
    })();
  }, [ready, user]);

  useEffect(() => { if (!user) mergedFor.current = null; }, [user]);

  // Mirror to the account cart (debounced).
  useEffect(() => {
    if (!user || !isFirebaseConfigured() || mergedFor.current !== user.uid || !hydrated.current) return;
    const t = setTimeout(() => {
      setDoc(doc(db(), "carts", user.uid), { items, couponCode, updatedAt: serverTimestamp() }).catch((e) =>
        console.error("[cart] sync failed", e));
    }, 600);
    return () => clearTimeout(t);
  }, [items, couponCode, user]);

  // Cross-tab sync for guest carts.
  useEffect(() => {
    const on = (e: StorageEvent) => { if (e.key === KEY) { const l = readLocal(); setItems(l.items); setCouponCode(l.couponCode); } };
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
