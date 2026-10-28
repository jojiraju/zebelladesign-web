// Grants a staff role, optionally creating the account first. Run from a trusted machine with service-account access.
//
//   node scripts/provision-admin.mjs you@example.com                 -> grant "admin" to an EXISTING user
//   node scripts/provision-admin.mjs you@example.com editor          -> grant another role
//   node scripts/provision-admin.mjs you@example.com admin --create  -> create the user if missing, then grant
//
// With --create no password is ever chosen or printed by this script: the account gets a random throw-away
// password and you receive a one-time "set your password" link (valid for a limited time).
import { randomBytes } from "node:crypto";
import { adminApp } from "./_admin.mjs";

const args = process.argv.slice(2);
const create = args.includes("--create");
const [email, role = "admin"] = args.filter((a) => !a.startsWith("--"));
if (!email || !email.includes("@") || !["admin", "editor", "fulfillment"].includes(role)) {
  console.error("Usage: node scripts/provision-admin.mjs <email> [admin|editor|fulfillment] [--create]");
  process.exit(1);
}

const { auth, db, projectId } = adminApp();
let user = await auth.getUserByEmail(email).catch(() => null);
let created = false;

if (!user) {
  if (!create) {
    console.error(`No Firebase user with email ${email} in project ${projectId}.\nRegister that account first, or re-run with --create.`);
    process.exit(1);
  }
  user = await auth.createUser({ email, emailVerified: true, password: randomBytes(24).toString("base64url") });
  created = true;
}

await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), role });
await auth.revokeRefreshTokens(user.uid); // forces a fresh token that carries the new claim
if (role === "admin") {
  // Marks bootstrap as done so the one-time web endpoint can never be used afterwards.
  await db.collection("settings").doc("bootstrap").set({ adminUid: user.uid, at: Date.now(), via: "script" }, { merge: true });
}
await db.collection("adminAuditLogs").add({ actor: "provision-script", action: "role.set", target: user.uid, detail: { role, email, created }, createdAt: Date.now() });

console.log(`${created ? "Created" : "Updated"} ${email} (${user.uid}) with role "${role}".`);
if (created) {
  const link = await auth.generatePasswordResetLink(email);
  console.log("\nOpen this one-time link to choose your password, then sign in to the CMS:\n\n" + link + "\n");
} else {
  console.log("They must sign out and back in for the new role to apply.");
}
