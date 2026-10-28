// Security-rules tests. Run against the Firebase emulators (requires Java + firebase-tools):
//   cd firebase-tests && npm install && npm test
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";

let env;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-zebella",
    firestore: { rules: readFileSync("../firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
    storage: { rules: readFileSync("../storage.rules", "utf8"), host: "127.0.0.1", port: 9199 },
  });
});
afterAll(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "products/pub"), { status: "published", name: "P", variants: [] });
    await setDoc(doc(db, "products/draft"), { status: "draft", name: "D", variants: [] });
    await setDoc(doc(db, "categories/hidden"), { visible: false });
    await setDoc(doc(db, "orders/o1"), { userId: "alice", total: 1000, paymentStatus: "paid" });
    await setDoc(doc(db, "orders/o2"), { userId: "bob", total: 2000, paymentStatus: "paid" });
    await setDoc(doc(db, "payments/p1"), { orderId: "o1" });
    await setDoc(doc(db, "coupons/c1"), { code: "X", active: true });
    await setDoc(doc(db, "settings/store"), { shippingMethods: [] });
    await setDoc(doc(db, "settings/bootstrap"), { adminUid: "root" });
  });
});

const anon = () => env.unauthenticatedContext().firestore();
const user = (uid) => env.authenticatedContext(uid).firestore();
const staff = (role, uid = `${role}1`) => env.authenticatedContext(uid, { role }).firestore();

describe("public storefront data", () => {
  it("lets anyone read published products only", async () => {
    await assertSucceeds(getDoc(doc(anon(), "products/pub")));
    await assertFails(getDoc(doc(anon(), "products/draft")));
  });
  it("hides non-visible categories", async () => assertFails(getDoc(doc(anon(), "categories/hidden"))));
  it("exposes store settings but never the bootstrap marker", async () => {
    await assertSucceeds(getDoc(doc(anon(), "settings/store")));
    await assertFails(getDoc(doc(anon(), "settings/bootstrap")));
  });
  it("blocks anonymous and customer writes to the catalogue", async () => {
    await assertFails(setDoc(doc(anon(), "products/x"), { status: "published" }));
    await assertFails(updateDoc(doc(user("alice"), "products/pub"), { price: 1 }));
    await assertFails(deleteDoc(doc(user("alice"), "products/pub")));
  });
});

describe("customer data isolation", () => {
  it("customers read only their own orders", async () => {
    await assertSucceeds(getDoc(doc(user("alice"), "orders/o1")));
    await assertFails(getDoc(doc(user("alice"), "orders/o2")));
    await assertFails(getDoc(doc(anon(), "orders/o1")));
  });
  it("order listing is allowed only when scoped to the caller", async () => {
    await assertSucceeds(getDocs(query(collection(user("alice"), "orders"), where("userId", "==", "alice"))));
    await assertFails(getDocs(collection(user("alice"), "orders")));
  });
  it("customers can never create or modify orders or payments", async () => {
    const db = user("alice");
    await assertFails(setDoc(doc(db, "orders/new"), { userId: "alice", total: 1, paymentStatus: "paid" }));
    await assertFails(updateDoc(doc(db, "orders/o1"), { paymentStatus: "refunded", total: 1 }));
    await assertFails(getDoc(doc(db, "payments/p1")));
    await assertFails(setDoc(doc(db, "payments/p9"), { x: 1 }));
  });
  it("users own their profile, cannot write others', and cannot add role fields", async () => {
    await assertSucceeds(setDoc(doc(user("alice"), "users/alice"), { email: "a@x.com", wishlist: [], addresses: [] }));
    await assertFails(setDoc(doc(user("alice"), "users/bob"), { email: "a@x.com" }));
    await assertFails(setDoc(doc(user("alice"), "users/alice"), { email: "a@x.com", role: "admin" }));
    await assertFails(setDoc(doc(user("alice"), "users/alice"), { email: "a@x.com", isAdmin: true }));
  });
  it("carts are private to their owner", async () => {
    await assertSucceeds(setDoc(doc(user("alice"), "carts/alice"), { items: [], couponCode: "" }));
    await assertFails(getDoc(doc(user("bob"), "carts/alice")));
    await assertFails(setDoc(doc(user("bob"), "carts/alice"), { items: [] }));
  });
  it("customers cannot read coupons (codes are validated server-side)", async () => assertFails(getDoc(doc(user("alice"), "coupons/c1"))));
});

describe("staff roles", () => {
  it("editors manage catalogue and content but cannot see payments", async () => {
    await assertSucceeds(setDoc(doc(staff("editor"), "products/new"), { status: "draft" }));
    await assertSucceeds(getDoc(doc(staff("editor"), "products/draft")));
    await assertFails(getDoc(doc(staff("editor"), "payments/p1")));
  });
  it("fulfilment staff read orders but cannot edit orders, products or coupons", async () => {
    const db = staff("fulfillment");
    await assertSucceeds(getDoc(doc(db, "orders/o2")));
    await assertFails(updateDoc(doc(db, "orders/o2"), { fulfillmentStatus: "shipped" })); // must go through the server API
    await assertFails(setDoc(doc(db, "products/z"), { status: "published" }));
    await assertFails(getDoc(doc(db, "coupons/c1")));
  });
  it("only admins read payments", async () => {
    await assertSucceeds(getDoc(doc(staff("admin"), "payments/p1")));
  });
  it("an unknown role value grants nothing", async () => {
    const db = env.authenticatedContext("eve", { role: "superuser" }).firestore();
    await assertFails(setDoc(doc(db, "products/x"), { status: "published" }));
    await assertFails(getDoc(doc(db, "orders/o1")));
  });
  it("an `admin: true` claim without the role claim grants nothing", async () => {
    const db = env.authenticatedContext("eve", { admin: true }).firestore();
    await assertFails(getDoc(doc(db, "orders/o1")));
  });
});

describe("audit log integrity", () => {
  it("lets staff append entries signed with their own uid only", async () => {
    const db = staff("editor", "ed1");
    await assertSucceeds(addDoc(collection(db, "adminAuditLogs"), { actor: "ed1", action: "x" }));
    await assertFails(addDoc(collection(db, "adminAuditLogs"), { actor: "someone-else", action: "x" }));
  });
  it("is append-only and admin-readable", async () => {
    let id;
    await env.withSecurityRulesDisabled(async (ctx) => { id = (await addDoc(collection(ctx.firestore(), "adminAuditLogs"), { actor: "a", action: "x" })).id; });
    await assertFails(updateDoc(doc(staff("admin"), `adminAuditLogs/${id}`), { action: "y" }));
    await assertFails(deleteDoc(doc(staff("admin"), `adminAuditLogs/${id}`)));
    await assertSucceeds(getDoc(doc(staff("admin"), `adminAuditLogs/${id}`)));
    await assertFails(getDoc(doc(staff("editor"), `adminAuditLogs/${id}`)));
  });
});

describe("server-only collections", () => {
  it("are inaccessible to every client, including admins", async () => {
    for (const c of ["webhookEvents/e1", "checkoutKeys/k1", "rateLimits/r1", "inventoryReservations/o1"]) {
      await assertFails(setDoc(doc(staff("admin"), c), { x: 1 }));
      await assertFails(getDoc(doc(user("alice"), c)));
    }
  });
  it("newsletter subscribers cannot be written from the client", async () => {
    await assertFails(setDoc(doc(anon(), "newsletterSubscribers/s1"), { email: "x@y.z" }));
  });
});

describe("storage rules", () => {
  const png = new Uint8Array([137, 80, 78, 71]);
  it("allows editors to upload small images and blocks others", async () => {
    const ed = env.authenticatedContext("ed1", { role: "editor" }).storage();
    await assertSucceeds(uploadBytes(ref(ed, "products/p1/a.png"), png, { contentType: "image/png" }));
    const cust = env.authenticatedContext("alice").storage();
    await assertFails(uploadBytes(ref(cust, "products/p1/b.png"), png, { contentType: "image/png" }));
    await assertFails(uploadBytes(ref(env.unauthenticatedContext().storage(), "products/p1/c.png"), png, { contentType: "image/png" }));
  });
  it("rejects non-image uploads and oversized files", async () => {
    const ed = env.authenticatedContext("ed1", { role: "editor" }).storage();
    await assertFails(uploadBytes(ref(ed, "products/p1/x.html"), new Uint8Array([60]), { contentType: "text/html" }));
    await assertFails(uploadBytes(ref(ed, "products/p1/big.png"), new Uint8Array(9 * 1024 * 1024), { contentType: "image/png" }));
  });
  it("rejects writes outside the allowed folders", async () => {
    const ad = env.authenticatedContext("ad1", { role: "admin" }).storage();
    await assertFails(uploadBytes(ref(ad, "private/secret.png"), png, { contentType: "image/png" }));
  });
});
