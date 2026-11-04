"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { tokenStore } from "@/lib/api/client";
import { reconcileWishlist } from "@/lib/commerce/cart";
import { useAuth } from "./AuthProvider";

const KEY = "zebella.wishlist.v1";
const OWNER_KEY = "zebella.wishlist.owner";
const Ctx = createContext<{ ids: string[]; has(id: string): boolean; toggle(id: string): boolean } | null>(null);

const saveFailed = (e: unknown) => console.error("[wishlist] could not save to the account", e);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, profile, ready, saveProfile } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  // The latest list, readable synchronously: toggle() must report its result before React has re-rendered.
  const latest = useRef<string[]>([]);
  // Which account this device's list is a copy of (null: a guest list whose items are not on any account yet).
  const owner = useRef<string | null>(null);
  const mergedFor = useRef<string | null>(null);

  const commit = useCallback((next: string[]) => {
    latest.current = next;
    setIds(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);
  const setOwner = useCallback((id: string | null) => {
    owner.current = id;
    try {
      if (id) localStorage.setItem(OWNER_KEY, id);
      else localStorage.removeItem(OWNER_KEY);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      owner.current = localStorage.getItem(OWNER_KEY);
      const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      if (Array.isArray(stored)) {
        latest.current = stored;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage; must run post-mount to avoid an SSR mismatch
        setIds(stored);
      }
    } catch { /* ignore */ }
  }, []);

  // On login, union a guest wishlist into the account; a list already owned by an account just follows the account.
  useEffect(() => {
    if (!ready || !user || mergedFor.current === user.id) return;
    mergedFor.current = user.id;
    const account = profile.wishlist ?? [];
    const guest = owner.current === null;
    const merged = reconcileWishlist(account, latest.current, owner.current);
    setOwner(user.id);
    commit(merged);
    if (guest && merged.length !== account.length) saveProfile({ wishlist: merged }).catch(saveFailed);
  }, [ready, user, profile.wishlist, saveProfile, commit, setOwner]);

  // Signed out: an account's wishlist must not stay on the device for the next person.
  useEffect(() => {
    if (user) return;
    mergedFor.current = null;
    if (ready && owner.current && !tokenStore.get()) {
      setOwner(null);
      commit([]);
    }
  }, [user, ready, commit, setOwner]);

  const toggle = useCallback((id: string) => {
    const added = !latest.current.includes(id);
    const next = added ? [...latest.current, id] : latest.current.filter((x) => x !== id);
    commit(next);
    if (user) saveProfile({ wishlist: next }).catch(saveFailed);
    return added;
  }, [user, saveProfile, commit]);

  const value = useMemo(() => ({ ids, has: (id: string) => ids.includes(id), toggle }), [ids, toggle]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return c;
}
