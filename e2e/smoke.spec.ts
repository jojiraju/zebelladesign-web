import { expect, test } from "@playwright/test";

/** Runs with NO backend configured (NEXT_PUBLIC_API_URL unset): verifies the app degrades gracefully. */

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

test("auth pages explain that accounts are unavailable when the backend is not configured", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText(/Customer accounts are not available yet|backend has not been configured/)).toBeVisible();
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

test.describe("Headers", () => {
  test("security headers are present", async ({ request }) => {
    const h = (await request.get("/")).headers();
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("SAMEORIGIN");
    expect(h["x-powered-by"]).toBeUndefined();
  });
});
