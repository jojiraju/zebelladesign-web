"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "./AuthProvider";

const KEY = "zebella.wishlist.v1";
const Ctx = createContext<{ ids: string[]; has(id: string): boolean; toggle(id: string): boolean } | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, profile, ready, saveProfile } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const mergedFor = useRef<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage; must run post-mount to avoid an SSR mismatch
    try { setIds(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch { /* ignore */ }
  }, []);

  // On login, union guest + account wishlists, then store on the account.
  useEffect(() => {
    if (!ready || !user || mergedFor.current === user.uid) return;
    mergedFor.current = user.uid;
    setIds((local) => {
      const merged = [...new Set([...(profile.wishlist ?? []), ...local])];
      if (merged.length !== (profile.wishlist ?? []).length) void saveProfile({ wishlist: merged });
      return merged;
    });
  }, [ready, user, profile.wishlist, saveProfile]);
  useEffect(() => { if (!user) mergedFor.current = null; }, [user]);

  const toggle = useCallback((id: string) => {
    let added = false;
    setIds((cur) => {
      added = !cur.includes(id);
      const next = added ? [...cur, id] : cur.filter((x) => x !== id);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
      if (user) void saveProfile({ wishlist: next });
      return next;
    });
    return added;
  }, [user, saveProfile]);

  const value = useMemo(() => ({ ids, has: (id: string) => ids.includes(id), toggle }), [ids, toggle]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return c;
}
