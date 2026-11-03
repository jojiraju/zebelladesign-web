"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, apiJson, isApiConfigured, tokenStore } from "@/lib/api/client";
import type { Address } from "@/lib/types";

export interface Profile {
  displayName?: string;
  phone?: string;
  addresses?: (Address & { id: string; label?: string })[];
  wishlist?: string[];
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  emailVerified: boolean;
}

interface Session { token: string; user: User; profile?: Profile }

interface AuthCtx {
  user: User | null;
  profile: Profile;
  ready: boolean;
  configured: boolean;
  register(a: { name: string; email: string; password: string }): Promise<void>;
  login(email: string, password: string): Promise<void>;
  resetPassword(email: string): Promise<void>;
  resendVerification(): Promise<void>;
  logout(): Promise<void>;
  saveProfile(patch: Partial<Profile>): Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

/** Customer-facing message for an auth failure (the API supplies the text; never raw errors or stack traces). */
export function authMessage(e: unknown): string {
  if (e instanceof ApiError && e.status !== 0 && e.status < 500) return e.message;
  return "Something went wrong. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isApiConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [ready, setReady] = useState(!configured);

  const apply = useCallback((s: Session) => {
    tokenStore.set(s.token);
    setUser(s.user);
    setProfile(s.profile ?? {});
  }, []);

  // Restore the session on first load: GET /auth/me -> { user, profile }
  useEffect(() => {
    if (!configured) return;
    let live = true;
    (async () => {
      if (tokenStore.get()) {
        try {
          const me = await apiJson<{ user: User; profile?: Profile }>("/auth/me", { method: "GET" });
          if (live) { setUser(me.user); setProfile(me.profile ?? {}); }
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) tokenStore.set(null);
          else console.error("[auth] session restore failed", e);
        }
      }
      if (live) setReady(true);
    })();
    return () => { live = false; };
  }, [configured]);

  const value = useMemo<AuthCtx>(() => ({
    user, profile, ready, configured,
    async register({ name, email, password }) {
      apply(await apiJson<Session>("/auth/register", { json: { name, email, password } }));
    },
    async login(email, password) {
      apply(await apiJson<Session>("/auth/login", { json: { email, password } }));
    },
    async resetPassword(email) {
      await apiJson("/auth/password-reset", { json: { email } });
    },
    async resendVerification() {
      await apiJson("/auth/resend-verification", { json: {} });
    },
    async logout() {
      await apiJson("/auth/logout", { json: {} }).catch(() => undefined); // best effort; local sign-out always happens
      tokenStore.set(null);
      setUser(null);
      setProfile({});
    },
    async saveProfile(patch) {
      if (!user) return;
      const saved = await apiJson<Profile>("/me/profile", { method: "PATCH", json: patch });
      setProfile((p) => ({ ...p, ...patch, ...saved }));
    },
  }), [user, profile, ready, configured, apply]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside <AuthProvider>");
  return c;
}
