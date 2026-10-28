"use client";
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * Firebase Web SDK config comes from NEXT_PUBLIC_* env vars. These values are PUBLIC identifiers
 * (not secrets); access control is enforced by Firestore/Storage rules and App Check.
 * Each variable is referenced literally so Next can inline it at build time.
 */
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = (): boolean => !!(config.apiKey && config.projectId && config.appId);

let appCheckStarted = false;

export function firebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) throw new Error("FIREBASE_NOT_CONFIGURED");
  const app = getApps().length ? getApp() : initializeApp(config);
  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY;
  if (siteKey && !appCheckStarted && typeof window !== "undefined") {
    appCheckStarted = true;
    // Loaded lazily so App Check never blocks first paint.
    void import("firebase/app-check").then(({ initializeAppCheck, ReCaptchaV3Provider }) =>
      initializeAppCheck(app, { provider: new ReCaptchaV3Provider(siteKey), isTokenAutoRefreshEnabled: true }),
    );
  }
  return app;
}

export const auth = (): Auth => getAuth(firebaseApp());
export const db = (): Firestore => getFirestore(firebaseApp());

/** fetch() to our own API with the signed-in user's Firebase ID token attached. */
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const user = isFirebaseConfigured() ? auth().currentUser : null;
  const token = user ? await user.getIdToken() : null;
  return fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
