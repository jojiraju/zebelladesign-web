import { expect, test } from "@playwright/test";

/**
 * Full purchase journey against a REAL Firebase TEST project + Razorpay TEST keys.
 * Skipped unless E2E_FULL=1. NEVER run with live credentials: the spec refuses if the key is not rzp_test_*.
 *
 * Prerequisites (see README "End-to-end purchase test"):
 *   - web/.env.local with a throw-away Firebase project and RAZORPAY_KEY_ID=rzp_test_..., ALLOW_DEMO_PURCHASES=true
 *   - `node scripts/seed.mjs` so demo products exist
 *   - E2E_FULL=1  E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (an account provisioned with scripts/provision-admin.mjs)
 *   - the CMS running (npm run dev in /admin) for step 11
 */
const enabled = process.env.E2E_FULL === "1";
test.skip(!enabled, "Set E2E_FULL=1 with Firebase + Razorpay TEST credentials to run the purchase journey");

test("customer registers, buys a product with a test payment, and the order appears for customer and admin", async ({ page, browser }) => {
  test.setTimeout(240_000);
  expect(process.env.RAZORPAY_KEY_ID ?? "rzp_test_", "live keys must never be used in tests").toMatch(/^rzp_test_/);

  const email = `e2e+${Date.now()}@example.com`;
  const password = "Test-Passw0rd!";

  // 1-2. register (also signs in)
  await page.goto("/register");
  await page.getByLabel("Full name").fill("E2E Customer");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account/);

  // 3-5. choose product + variant, add to bag
  await page.goto("/shop");
  await page.getByRole("link", { name: /Ivory Chanderi Kurta Set/ }).first().click();
  await page.getByRole("button", { name: /^M$/ }).click();
  await page.getByRole("button", { name: "Add to bag" }).click();
  await expect(page.getByRole("dialog", { name: "Shopping bag" })).toBeVisible();
  await page.getByRole("link", { name: /Checkout/ }).click();

  // 6. checkout steps
  await page.getByRole("button", { name: /Continue/ }).click(); // contact (prefilled)
  await page.getByLabel("Full name").fill("E2E Customer");
  await page.getByLabel("Mobile number").fill("9876543210");
  await page.getByLabel("Address line 1").fill("1 Test Road");
  await page.getByLabel("City").fill("Kochi");
  await page.getByLabel("State").fill("Kerala");
  await page.getByLabel("PIN code").fill("682001");
  await page.getByRole("button", { name: /Continue/ }).click(); // shipping
  await page.getByRole("button", { name: /Continue/ }).click(); // billing same
  await page.getByRole("button", { name: /Review order/ }).click();

  // 7. Razorpay test payment inside its iframe
  await page.getByRole("button", { name: /Pay .* securely/ }).click();
  const frame = page.frameLocator("iframe.razorpay-checkout-frame");
  await frame.getByText(/Card/i).first().click();
  await frame.getByPlaceholder(/Card Number/i).fill("4111 1111 1111 1111");
  await frame.getByPlaceholder(/MM/).fill("12 / 34");
  await frame.getByPlaceholder(/CVV/i).fill("123");
  await frame.getByRole("button", { name: /Pay/i }).click();

  // 8-9. server verifies; success page shows only after the order is paid in Firestore
  await expect(page).toHaveURL(/\/checkout\/success/, { timeout: 90_000 });
  await expect(page.getByText(/Thank you/)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/TEST payment/)).toBeVisible();
  const orderId = new URL(page.url()).searchParams.get("order")!;

  // 10. visible in the customer's account
  await page.goto("/account/orders");
  await expect(page.getByText(orderId)).toBeVisible();

  // 11. visible in the admin CMS
  const adminUrl = process.env.E2E_ADMIN_URL ?? "http://localhost:5174";
  const admin = await (await browser.newContext()).newPage();
  await admin.goto(adminUrl);
  await admin.getByLabel("Email").fill(process.env.E2E_ADMIN_EMAIL!);
  await admin.getByLabel("Password").fill(process.env.E2E_ADMIN_PASSWORD!);
  await admin.getByRole("button", { name: "Sign in", exact: true }).click();
  await admin.goto(`${adminUrl}/orders/${orderId}`);
  await expect(admin.getByText(/payment: paid/)).toBeVisible();
});
