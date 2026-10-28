"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  GoogleAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification,
  sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile, type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase/client";
import type { Address } from "@/lib/types";

export interface Profile {
  displayName?: string;
  phone?: string;
  addresses?: (Address & { id: string; label?: string })[];
  wishlist?: string[];
}

interface AuthCtx {
  user: User | null;
  profile: Profile;
  ready: boolean;
  configured: boolean;
  register(a: { name: string; email: string; password: string }): Promise<void>;
  login(email: string, password: string): Promise<void>;
  google(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  resendVerification(): Promise<void>;
  logout(): Promise<void>;
  saveProfile(patch: Partial<Profile>): Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

/** Maps Firebase error codes to messages a customer can act on (never raw codes or stack traces). */
export function authMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/invalid-credential": "That email and password don't match.",
    "auth/wrong-password": "That email and password don't match.",
    "auth/user-not-found": "That email and password don't match.",
    "auth/email-already-in-use": "An account with this email already exists. Try signing in.",
    "auth/weak-password": "Please choose a stronger password (at least 8 characters).",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
    "auth/popup-closed-by-user": "Sign-in was cancelled.",
    "auth/network-request-failed": "Network problem. Check your connection and try again.",
  };
  return map[code] ?? "Something went wrong. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [ready, setReady] = useState(!configured);

  useEffect(() => {
    if (!configured) return;
    return onAuthStateChanged(auth(), async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db(), "users", u.uid));
          setProfile(snap.exists() ? (snap.data() as Profile) : {});
        } catch (e) {
          console.error("[auth] profile load failed", e);
        }
      } else setProfile({});
      setReady(true);
    });
  }, [configured]);

  const ensureProfile = useCallback(async (u: User, name?: string) => {
    const ref = doc(db(), "users", u.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { email: u.email, displayName: name ?? u.displayName ?? "", addresses: [], wishlist: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    const fresh = await getDoc(ref);
    setProfile(fresh.data() as Profile);
  }, []);

  const value = useMemo<AuthCtx>(() => ({
    user, profile, ready, configured,
    async register({ name, email, password }) {
      const cred = await createUserWithEmailAndPassword(auth(), email, password);
      await updateProfile(cred.user, { displayName: name });
      await ensureProfile(cred.user, name);
      await sendEmailVerification(cred.user).catch(() => undefined); // non-fatal
    },
    async login(email, password) {
      const cred = await signInWithEmailAndPassword(auth(), email, password);
      await ensureProfile(cred.user);
    },
    async google() {
      const cred = await signInWithPopup(auth(), new GoogleAuthProvider());
      await ensureProfile(cred.user);
    },
    resetPassword: (email) => sendPasswordResetEmail(auth(), email),
    async resendVerification() { if (auth().currentUser) await sendEmailVerification(auth().currentUser!); },
    logout: () => signOut(auth()),
    async saveProfile(patch) {
      if (!user) return;
      await setDoc(doc(db(), "users", user.uid), { ...patch, email: user.email, updatedAt: serverTimestamp() }, { merge: true });
      setProfile((p) => ({ ...p, ...patch }));
    },
  }), [user, profile, ready, configured, ensureProfile]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside <AuthProvider>");
  return c;
}
