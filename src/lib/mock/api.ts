/**
 * In-browser stand-in for the Python backend, used ONLY while NEXT_PUBLIC_API_URL is unset (demo mode).
 * Sign-in accepts any username/password; the cart, profile and wishlist persist in localStorage.
 * Checkout/payment is intentionally disabled. Remove by setting NEXT_PUBLIC_API_URL.
 */
import { buildQuote } from "../commerce/pricing";
import { DEFAULT_SETTINGS } from "../content";
import type { CartItemInput, Product } from "../types";
import { MOCK_BANNERS, MOCK_CATEGORIES, MOCK_COLLECTIONS, MOCK_COUPON, MOCK_HOMEPAGE, MOCK_ORDERS, MOCK_PRODUCTS, MOCK_SETTINGS, MOCK_TESTIMONIALS } from "./data";

const K = { user: "zebella.mock.user", profile: "zebella.mock.profile", cart: "zebella.mock.cart" };

const read = <T>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; } catch { return fallback; }
};
const write = (key: string, v: unknown) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* private mode */ } };

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
const fail = (error: string, status = 400) => json({ error }, status);

const titleCase = (s: string) => s.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();

/** Public read-only catalogue endpoints (also used server-side by lib/server/catalog.ts). */
export function mockCatalog(path: string): unknown | undefined {
  const p = path.split("?")[0];
  if (p === "/catalog/products") return MOCK_PRODUCTS;
  if (p === "/catalog/categories") return MOCK_CATEGORIES;
  if (p === "/catalog/collections") return MOCK_COLLECTIONS;
  if (p === "/content/settings") return MOCK_SETTINGS;
  if (p === "/content/homepage") return MOCK_HOMEPAGE;
  if (p === "/content/banners") return MOCK_BANNERS;
  if (p === "/content/testimonials") return MOCK_TESTIMONIALS;
  return undefined;
}

const session = () => {
  const user = read<{ id: string; username: string; displayName?: string; email?: string } | null>(K.user, null);
  return user ? { token: "demo-token", user, profile: read(K.profile, {}) } : null;
};

export async function mockFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const body = (() => { try { return init.body ? JSON.parse(String(init.body)) : {}; } catch { return {}; } })();
  const [route, qs = ""] = path.split("?");

  const catalog = mockCatalog(route);
  if (catalog !== undefined && method === "GET") return json(catalog);

  // ---- auth ----
  if (route === "/auth/login" && method === "POST") {
    const username = String(body.username ?? "").trim();
    if (!username || !body.password) return fail("Enter your username and password.", 400);
    const user = { id: "demo-user", username, displayName: titleCase(username), email: username.includes("@") ? username : `${username}@example.com` };
    write(K.user, user);
    return json({ token: "demo-token", user, profile: read(K.profile, { displayName: user.displayName }) });
  }
  if (route === "/auth/register" && method === "POST") {
    const user = { id: "demo-user", username: String(body.username), displayName: String(body.name), email: String(body.email) };
    write(K.user, user);
    write(K.profile, { displayName: user.displayName, email: user.email });
    return json({ token: "demo-token", user, profile: read(K.profile, {}), isNewUser: true });
  }
  if (route === "/auth/me") { const s = session(); return s ? json({ user: s.user, profile: s.profile }) : fail("Not signed in.", 401); }
  if (route === "/auth/logout") { try { localStorage.removeItem(K.user); } catch { /* ignore */ } return json({ ok: true }); }
  if (route === "/auth/password-reset" || route === "/auth/password-reset/confirm" || route === "/auth/resend-verification") return json({ ok: true });
  if (route === "/me/profile" && method === "PATCH") { const next = { ...read(K.profile, {}), ...body }; write(K.profile, next); return json(next); }

  // ---- cart ----
  if (route === "/cart" && method === "GET") return json(read(K.cart, { items: [] }));
  if (route === "/cart" && method === "PUT") { write(K.cart, body); return json({ ok: true }); }
  if (route === "/cart/quote" && method === "POST") {
    const items = (body.items ?? []) as CartItemInput[];
    const code = String(body.couponCode ?? "").trim().toUpperCase();
    const method_ = (MOCK_SETTINGS.shippingMethods.find((m) => m.id === body.shippingMethodId) ?? MOCK_SETTINGS.shippingMethods[0] ?? DEFAULT_SETTINGS.shippingMethods[0]);
    const quote = buildQuote({
      items, products: new Map<string, Product>(MOCK_PRODUCTS.map((p) => [p.id, p])),
      coupon: code === MOCK_COUPON.code ? MOCK_COUPON : undefined, couponCode: code || undefined,
      shippingMethod: method_, tax: { inclusiveRatePercent: MOCK_SETTINGS.taxInclusiveRatePercent }, allowDemo: true,
    });
    return json({ quote, configured: true });
  }

  // ---- checkout (disabled in demo) ----
  if (route.startsWith("/checkout")) return fail("Demo mode: online payment is switched off. Connect the backend API to enable checkout.", 503);

  // ---- orders ----
  if (route === "/orders" && method === "GET") return session() ? json({ orders: MOCK_ORDERS }) : fail("Not signed in.", 401);
  if (route === "/orders/track" && method === "POST") {
    const o = MOCK_ORDERS.find((x) => x.id.toLowerCase() === String(body.orderId ?? "").trim().toLowerCase());
    return o ? json({ orderId: o.id, status: o.fulfillmentStatus, placedAt: o.createdAt, items: o.items.map((i) => ({ name: i.name, size: i.size, color: i.color, quantity: i.quantity })), tracking: o.tracking ?? null }) : fail("We couldn't find that order. Try ZB-DEMO0001.", 404);
  }
  const m = route.match(/^\/orders\/([^/]+)$/);
  if (m && method === "GET") { const o = MOCK_ORDERS.find((x) => x.id === decodeURIComponent(m[1])); return o ? json(o) : fail("Order not found.", 404); }

  // ---- misc ----
  if (route === "/products/by-ids") {
    const ids = new Set(new URLSearchParams(qs).get("ids")?.split(",") ?? []);
    return json({ products: MOCK_PRODUCTS.filter((p) => ids.has(p.id)) });
  }
  if (route === "/contact" || route === "/newsletter") return json({ ok: true });

  return fail(`Demo mode: ${method} ${route} is not available.`, 404);
}
