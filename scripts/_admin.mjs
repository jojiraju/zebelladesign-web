// Shared bootstrap for operator scripts: loads web/.env.local and returns a Firebase Admin app.
// firebase-admin is resolved from web/node_modules so scripts need no install of their own.
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "web", "package.json"));

export function loadEnv() {
  const file = join(root, "web", ".env.local");
  if (!existsSync(file)) {
    console.error(`Missing ${file}. Copy web/.env.example to web/.env.local and fill in the FIREBASE_ADMIN_* values.`);
    process.exit(1);
  }
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!m || line.trim().startsWith("#")) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}

export function adminApp() {
  loadEnv();
  const { initializeApp, cert, getApps } = require("firebase-admin/app");
  const { getAuth } = require("firebase-admin/auth");
  const { getFirestore } = require("firebase-admin/firestore");
  const { FIREBASE_ADMIN_PROJECT_ID: projectId, FIREBASE_ADMIN_CLIENT_EMAIL: clientEmail, FIREBASE_ADMIN_PRIVATE_KEY: key } = process.env;
  if (!projectId || !clientEmail || !key) {
    console.error("FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY must be set in web/.env.local");
    process.exit(1);
  }
  const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey: key.replace(/\\n/g, "\n") }) });
  return { projectId, auth: getAuth(app), db: getFirestore(app) };
}
