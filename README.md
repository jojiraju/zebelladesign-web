# Zebella Designs

Premium women's fashion e-commerce: a **Next.js storefront** (`web/`) and a separate **Vite + React CMS** (`admin/`), both on **Firebase** (Auth, Firestore, Storage) with **Razorpay** payments.

```
zebella-designs/
├─ web/            Next.js 16 (App Router) storefront + all trusted server APIs (/api/*)
├─ admin/          Vite + React CMS / admin dashboard
├─ scripts/        seed data, first-admin provisioning, placeholder-art generator
├─ firebase-tests/ Firestore + Storage security-rules tests (emulator)
├─ firestore.rules · storage.rules · firestore.indexes.json · firebase.json
```

**How the two apps split responsibility.** The CMS talks to Firestore/Storage directly for catalogue and content CRUD (allowed by security rules for staff roles). Anything privileged or money-related — order status changes, refunds, stock adjustments, role grants, cache refresh — goes to `web`'s `/api/admin/*` endpoints, which verify the caller's Firebase ID token and role **on the server**. The browser is never trusted for prices, totals or payment status.

---

## 1. Run locally (Windows)

Prerequisites: Node 20+ (tested on Node 24), npm. Java is only needed for the Firebase emulator tests.

```powershell
cd "D:\Joji Raju\Projects\zebella-designs"

# storefront
cd web
npm install
copy .env.example .env.local        # then fill it in (section 2)
npm run dev                          # http://localhost:3000

# CMS (second terminal)
cd ..\admin
npm install
copy .env.example .env.local
npm run dev                          # http://localhost:5174
```

With **no credentials at all** the storefront still builds and runs: it shows polished empty states, accounts/checkout explain they are unavailable, and every privileged API refuses requests.

---

## 2. Firebase setup

1. Create a project at <https://console.firebase.google.com> (Blaze plan is *not* required for the features used here).
2. **Authentication → Sign-in method:** enable **Email/Password** and **Google**. Under *Settings → Authorized domains* add your production domain(s).
3. **Firestore Database:** create in production mode, choose a region (e.g. `asia-south1`).
4. **Storage:** create the default bucket.
5. **Project settings → Your apps → Web app:** copy the config into `web/.env.local` (`NEXT_PUBLIC_FIREBASE_*`) and `admin/.env.local` (`VITE_FIREBASE_*`).
6. **Project settings → Service accounts → Generate new private key.** Put the three values into `web/.env.local` (`FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` — one line with literal `\n`). **Never commit this file or the JSON.**
7. Deploy rules and indexes:
   ```powershell
   npm i -g firebase-tools
   firebase login
   firebase use --add          # pick your project
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```
8. Optional but recommended: enable a **TTL policy** on `rateLimits.expiresAt` (Firestore → TTL) and **App Check** (`NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY`, reCAPTCHA v3), starting in *monitor* mode.

### Environment variables

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` (6) | public | Firebase web config (identifiers, not secrets) |
| `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` | public | Optional App Check |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical URL for SEO/sitemap |
| `FIREBASE_ADMIN_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY` | **server** | Admin SDK |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | **server** | Payments (`rzp_test_*` → test mode, `rzp_live_*` → live) |
| `RAZORPAY_WEBHOOK_SECRET` | **server** | Webhook signature verification |
| `EMAIL_PROVIDER_API_KEY` / `EMAIL_FROM_ADDRESS` | **server** | Transactional email (Resend REST) |
| `ADMIN_BOOTSTRAP_SECRET` | **server** | One-time first-admin claim (≥16 chars) |
| `ADMIN_APP_ORIGIN` | **server** | CORS allow-list for the CMS origin(s) |
| `CRON_SECRET` | **server** | Bearer token for `/api/cron/release-reservations` |
| `ALLOW_DEMO_PURCHASES` | **server** | Dev only: allow buying seeded demo products in test mode |
| `VITE_FIREBASE_*`, `VITE_STOREFRONT_URL` | CMS (public) | CMS Firebase config + storefront API origin |

---

## 3. First admin (secure provisioning)

There is **no public admin signup**, and roles are never read from editable fields — only from the Firebase **custom claim** `role` (`admin` · `editor` · `fulfillment`), settable only by the Admin SDK.

**Option A — script (recommended).** Register the account normally (storefront `/register`), verify the email, then on a trusted machine:
```powershell
node scripts/provision-admin.mjs you@example.com admin
```
**Option B — one-time web claim.** Set `ADMIN_BOOTSTRAP_SECRET` on the server, sign in to the CMS with a *verified* account, open "First-time setup", and paste the secret. It works exactly once (an atomic `settings/bootstrap` marker blocks any repeat) and is rate-limited. Remove the secret afterwards.

Later, admins grant/revoke roles in **CMS → Customers**. Role changes revoke refresh tokens, so the user must sign in again.

| Role | Can |
|---|---|
| admin | everything, incl. refunds, roles, audit log, newsletter list |
| editor | catalogue, content, coupons, analytics, read orders |
| fulfillment | orders (status/tracking/notes), inventory, customers |

---

## 4. Razorpay (test mode)

1. Razorpay Dashboard → toggle **Test Mode** → *Account & Settings → API keys* → generate. Put `rzp_test_…` and the secret in `web/.env.local`.
2. **Enable auto-capture** (Settings → Payment capture → *Automatic*). Orders are confirmed only for `captured` payments.
3. **Webhook:** Settings → Webhooks → add `https://<your-site>/api/webhooks/razorpay`, choose a secret (= `RAZORPAY_WEBHOOK_SECRET`) and enable `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`. For local testing expose port 3000 with a tunnel (e.g. `ngrok http 3000`).
4. Test card: `4111 1111 1111 1111`, any future expiry, any CVV. Checkout shows a **Test mode** banner and orders are tagged `paymentMode: "test"`.

### How payment is secured
1. `POST /api/checkout` (signed-in user) re-prices every line from Firestore, validates variants/stock/coupon, **reserves stock in a transaction**, writes a pending order, then creates the Razorpay order for the **server-computed** amount. Keyed by an idempotency key → retries never duplicate orders.
2. The browser opens Razorpay Checkout. Its success callback is only a *hint*: `POST /api/checkout/verify` checks the HMAC signature **and re-fetches the payment from Razorpay** (order id, amount, `captured`) before confirming.
3. Confirmation is one idempotent transaction: stock committed, order → `paid/processing`, coupon usage and daily revenue stats recorded. Replays are no-ops.
4. Webhooks verify the signature against the **raw body**, claim each event id exactly once, and release the claim on failure so Razorpay's retry succeeds.
5. Late payment after a hold expired: fulfilled if stock remains; otherwise the order is flagged `refund_pending` (never oversold, never lost).
6. Refunds go through Razorpay (`/api/admin/orders/[id]/refund`), capped by the provider-reported refundable balance; the order is marked `refunded` only when the provider confirms the full amount.

Abandoned checkouts: holds last 30 minutes and are released lazily and by `GET /api/cron/release-reservations` (schedule it every 10–15 min with `Authorization: Bearer $CRON_SECRET`, e.g. Vercel Cron).

---

## 5. Data model (Firestore)

Money is **integer paise**. Timestamps are epoch ms (or server timestamps).

| Collection | Notes |
|---|---|
| `products` | `variants[]` carry `stock` (on hand) and `reserved` (held by checkouts); `status` draft/published/archived; `isDemo` for seed data |
| `categories`, `collections` | doc id = slug; `visible`, `order` |
| `orders` | snapshot of items/addresses/totals; **separate** `paymentStatus` and `fulfillmentStatus`; written only by the server |
| `payments` | provider payment records (admin-read only) |
| `inventoryReservations`, `inventoryMovements` | holds; immutable stock ledger |
| `coupons` (+ `redemptions/{uid}`) | percent/fixed, windows, limits, restrictions |
| `users/{uid}`, `carts/{uid}` | owner-only profile/addresses/wishlist and synced cart |
| `homepageContent/main`, `settings/store`, `banners`, `testimonials` | CMS content |
| `newsletterSubscribers`, `contactMessages` | written by rate-limited server endpoints |
| `statsDaily/{YYYY-MM-DD}` | server-written daily aggregates (orders, revenue, per-product/category) powering the dashboard — no collection scans |
| `adminAuditLogs` | append-only |
| `webhookEvents`, `checkoutKeys`, `rateLimits` | server bookkeeping, no client access |

**Revenue definition:** sum of order totals (incl. shipping, GST-inclusive) for payments verified server-side; refunds are tracked per order and not netted out of aggregates; unverified/failed payments are never counted.

---

## 6. Seed data (development only)

```powershell
node scripts/seed.mjs            # demo categories, collections, 6 DEMO products (isDemo: true)
node scripts/seed.mjs --remove   # delete all demo products
```
Demo products use locally generated placeholder art (`scripts/generate-art.mjs`), are labelled "DEMO", are excluded from the sitemap, and **cannot be bought** unless `ALLOW_DEMO_PURCHASES=true` *and* Razorpay is in test mode. The seed refuses to run against a live Razorpay key. Replace all placeholder imagery (hero, tiles, banners, product photos) from the CMS.

---

## 7. Tests

```powershell
cd web
npm test                 # 77 unit/integration tests (pricing, variants, coupons, inventory, order status,
                         # refund safeguards, signatures, webhook idempotency, transactional order service, authz)
npm run typecheck ; npx eslint .
npm run build ; npm run e2e      # Playwright smoke suite against the production build (no credentials needed)

cd ..\firebase-tests
npm install ; npm test           # security rules + storage rules (needs Java + firebase-tools)
```

**End-to-end purchase test** (`web/e2e/purchase.spec.ts`): registration → product/variant → bag → checkout → Razorpay **test** card → server verification → account order → admin order. Needs a throw-away Firebase project, `rzp_test_*` keys, `ALLOW_DEMO_PURCHASES=true`, seeded data, the CMS running, and `E2E_FULL=1 E2E_ADMIN_EMAIL=… E2E_ADMIN_PASSWORD=…`. It refuses non-test keys.

---

## 8. Deployment

* **Storefront:** Vercel (or any Next.js host). Set every server variable as a secret; set `NEXT_PUBLIC_SITE_URL` to the real origin; add the Razorpay webhook URL; schedule the cron endpoint; add the domain to Firebase *Authorized domains*.
* **CMS:** static build (`npm run build` in `admin/` → `dist/`) on any static host/Firebase Hosting, ideally on a separate origin (e.g. `admin.yourdomain.com`). Set `VITE_STOREFRONT_URL` and add the CMS origin to the storefront's `ADMIN_APP_ORIGIN`. If you want it under `/admin` on the same domain, set Vite `base: '/admin/'` and proxy/rewrite accordingly.
* Go-live checklist: switch to `rzp_live_*` + live webhook, remove `ALLOW_DEMO_PURCHASES`, run `seed --remove`, rotate/remove `ADMIN_BOOTSTRAP_SECRET`, publish real policies (the site ships **no** invented legal text), enable App Check enforcement, verify the rules deployed.

---

## 9. Security checklist & known limitations

* Secrets only in server env; `.gitignore` excludes `.env*` (except `.env.example`) and service-account JSON.
* Every `/api/admin/*` route authenticates **first**, verifies the ID token with revocation checks, and checks the custom-claim role. CORS is an allow-list. Public forms are rate-limited with honeypots.
* Firestore: customers read only their own orders/cart/profile; nobody but the server writes orders/payments; client profile writes cannot include role fields; audit log is append-only.
* **Limitation:** Firestore rules cannot restrict *which fields* of a product an editor changes, so an editor (via direct SDK access) could alter variant stock outside the audited Inventory flow. Mitigation if needed: route product writes through an API endpoint.
* **Limitation:** catalogue filtering/sorting runs in memory over a cached set of ≤500 published products (fine for a boutique; move to indexed/Algolia-style search beyond that).
* **Limitation:** guest checkout is not offered — customers sign in (or register) to buy. Guests can track an order with order id + email.
* **Limitation:** PIN-code check is a format check plus a fixed CMS message; no courier API is connected.
* Email uses Resend's REST API; with no key configured emails are skipped and logged, never reported as sent.

## 10. Verification status (what was and was not actually exercised)

Verified in this repo: storefront `tsc`, ESLint, 77 unit tests, production build; admin `tsc` + production build; 72 Playwright smoke checks (routes, 404s, mobile/desktop layout & no horizontal overflow, mobile drawer, search overlay, anonymous refusal on every admin/checkout/webhook/cron endpoint, security headers).

**Not verified (needs your credentials/tools):** live Firebase calls (auth, Firestore, Storage uploads), the Firestore/Storage **rules tests** (written; Java/emulator unavailable here), the real Razorpay checkout + webhook round-trip, the purchase E2E, email delivery, and the CMS UI against a live project. The transactional order logic is tested against an in-memory Firestore fake, not the real emulator. Placeholder artwork stands in for real photography; no accessibility audit with assistive technology has been done.

## 11. Brand assets

The supplied logo (`Logo .pdf`) was converted into transparent PNGs in `web/public/brand/` (and copied to `admin/public/brand/`): `logo-full`, `logo-mark` (ZB monogram), `logo-wordmark`, each with a `-light` variant for dark/photographic backgrounds, plus favicons (`web/src/app/icon.png`, `apple-icon.png`). The palette is derived from the logo's rose (`#B96E7C`; text-safe deep rose `#8F4A5B`) on a warm blush/near-black neutral scale — see the tokens at the top of `web/src/app/globals.css` and `admin/src/index.css`. (The token is still *named* `gold` in the CSS for historical reasons; its value is the brand rose.) For crisper scaling, ask the designer for an SVG/vector master and swap the files in `public/brand/`.

## 12. Image hosting

The CMS uploads images and videos to **Firebase Storage** (publish `storage.rules` to your bucket). Only the resulting URLs are stored in Firestore. Removing an image in the CMS un-links it from the product but does not delete the file from Storage.

