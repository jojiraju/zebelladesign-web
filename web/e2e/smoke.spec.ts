import { expect, test } from "@playwright/test";

/** Runs with NO Firebase/Razorpay credentials: verifies the app degrades gracefully and that privileged APIs refuse anonymous callers. */

const PUBLIC_ROUTES = ["/", "/shop", "/collections", "/about", "/contact", "/cart", "/login", "/register", "/forgot-password", "/order-tracking", "/shipping-policy", "/returns-policy", "/privacy-policy", "/terms", "/search?q=kurta", "/sitemap.xml", "/robots.txt"];

for (const path of PUBLIC_ROUTES) {
  test(`renders ${path} without server errors`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status(), path).toBeLessThan(400);
  });
}

test("homepage shows the brand, hero and an honest empty state", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Zebella Designs — home/ }).first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/designed to be remembered/i);
  await expect(page.getByText(/Your storefront is ready|New pieces arriving soon/)).toBeVisible();
  // No fabricated reviews or fake stock claims when there is no data.
  await expect(page.getByText(/Verified purchase/)).toHaveCount(0);
});

test("no horizontal overflow on any key page", async ({ page }) => {
  for (const path of ["/", "/shop", "/cart", "/login", "/contact"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${path} overflows horizontally`).toBeLessThanOrEqual(1);
  }
});

test("empty bag shows the empty state", async ({ page }) => {
  await page.goto("/cart");
  await expect(page.getByText("Your bag is empty")).toBeVisible();
});

test("unknown routes render the branded 404", async ({ page }) => {
  const res = await page.goto("/definitely-not-a-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByText(/slipped away/i)).toBeVisible();
});

test("unknown product and category return 404", async ({ page }) => {
  expect((await page.goto("/products/nope"))?.status()).toBe(404);
  expect((await page.goto("/categories/nope"))?.status()).toBe(404);
});

test("auth pages explain that accounts are unavailable when Firebase is not configured", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText(/Firebase has not been configured/)).toBeVisible();
});

test("the account area never exposes data without sign-in", async ({ page }) => {
  await page.goto("/account/orders");
  await expect(page.getByText(/aren.t available yet|Loading/i).or(page.getByRole("heading", { name: /sign in|welcome back/i }))).toBeVisible();
});

test("search overlay opens, is focusable and Escape closes it", async ({ page, isMobile }) => {
  test.skip(!!isMobile, "covered by desktop run");
  await page.goto("/");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("dialog", { name: "Search" })).toBeVisible();
  await expect(page.getByLabel("Search Zebella")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Search" })).toBeHidden();
});

test("mobile navigation drawer works", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
  await page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Shop" }).first().click();
  await expect(page).toHaveURL(/\/shop/);
});

test.describe("API authorization (no credentials needed)", () => {
  const adminCalls: [string, string][] = [
    ["PATCH", "/api/admin/orders/ZB-TEST"], ["POST", "/api/admin/orders/ZB-TEST/refund"], ["POST", "/api/admin/inventory"],
    ["POST", "/api/admin/upload-signature"], ["GET", "/api/admin/users"], ["POST", "/api/admin/users"], ["POST", "/api/admin/revalidate"], ["POST", "/api/admin/bootstrap"],
  ];
  for (const [method, path] of adminCalls) {
    test(`${method} ${path} refuses anonymous callers`, async ({ request }) => {
      const res = await request.fetch(path, { method, data: {}, headers: { "Content-Type": "application/json" } });
      expect([401, 403, 503]).toContain(res.status()); // 503 = backend not configured; never 200
    });
  }
  test("checkout and verify refuse anonymous callers", async ({ request }) => {
    for (const p of ["/api/checkout", "/api/checkout/verify", "/api/checkout/retry"]) {
      const res = await request.post(p, { data: {} });
      expect([401, 503]).toContain(res.status());
    }
  });
  test("the payment webhook rejects unsigned and mis-signed requests", async ({ request }) => {
    const body = JSON.stringify({ event: "payment.captured" });
    expect((await request.post("/api/webhooks/razorpay", { data: body, headers: { "Content-Type": "application/json" } })).status()).toBe(400);
    expect((await request.post("/api/webhooks/razorpay", { data: body, headers: { "Content-Type": "application/json", "x-razorpay-signature": "deadbeef", "x-razorpay-event-id": "e1" } })).status()).toBe(400);
  });
  test("the cron endpoint requires its secret", async ({ request }) => {
    expect((await request.get("/api/cron/release-reservations")).status()).toBe(401);
    expect((await request.get("/api/cron/release-reservations", { headers: { Authorization: "Bearer guess" } })).status()).toBe(401);
  });
  test("security headers are present", async ({ request }) => {
    const h = (await request.get("/")).headers();
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("SAMEORIGIN");
    expect(h["x-powered-by"]).toBeUndefined();
  });
});
