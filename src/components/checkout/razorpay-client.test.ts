import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiJson } from "@/lib/api/client";
import { pay, type PaymentSession } from "./razorpay-client";

vi.mock("@/lib/api/client", async (original) => ({
  ...(await original<typeof import("@/lib/api/client")>()),
  apiJson: vi.fn(),
}));

const session: PaymentSession = { orderId: "ZB-1", providerOrderId: "order_1", amount: 100, currency: "INR", publicKey: "rzp_test_x", mode: "test", email: "a@b.co" };
const success = { razorpay_payment_id: "pay_1", razorpay_order_id: "order_1", razorpay_signature: "sig" };

/** A stand-in for the Razorpay window, driven by the test. */
function fakeWindow() {
  const w = {
    dismiss: () => {},
    fail: (() => {}) as (description?: string) => void,
    succeed: async () => {},
  };
  vi.stubGlobal("window", {
    Razorpay: class {
      constructor(opts: { modal: { ondismiss(): void }; handler(r: typeof success): Promise<void> }) {
        w.dismiss = opts.modal.ondismiss;
        w.succeed = () => opts.handler(success);
      }
      on(_event: string, cb: (r: { error?: { description?: string } }) => void) {
        w.fail = (description) => cb({ error: { description } });
      }
      open() {}
    },
  });
  return w;
}

/** pay() loads the script asynchronously, so wait for it to reach the window before driving it. */
const opened = () => new Promise((r) => setTimeout(r));

beforeEach(() => { vi.mocked(apiJson).mockReset(); });
afterEach(() => vi.unstubAllGlobals());

describe("pay", () => {
  it("lets a retry in the open window succeed after a failed attempt", async () => {
    const w = fakeWindow();
    vi.mocked(apiJson).mockResolvedValue({ state: "paid" });
    const result = pay(session, {});
    await opened();
    w.fail("Card declined");
    await w.succeed();
    await expect(result).resolves.toEqual({ state: "paid", orderId: "ZB-1" });
  });
  it("does not report a failure while the window is still open", async () => {
    const w = fakeWindow();
    const settled = vi.fn();
    void pay(session, {}).then(settled);
    await opened();
    w.fail("Card declined");
    await opened();
    expect(settled).not.toHaveBeenCalled();
  });
  it("reports the last failure once the window is closed", async () => {
    const w = fakeWindow();
    const result = pay(session, {});
    await opened();
    w.fail("Card declined");
    w.fail("UPI timed out");
    w.dismiss();
    await expect(result).resolves.toEqual({ state: "failed", message: "UPI timed out" });
  });
  it("treats closing without any attempt as dismissed", async () => {
    const w = fakeWindow();
    const result = pay(session, {});
    await opened();
    w.dismiss();
    await expect(result).resolves.toEqual({ state: "dismissed" });
  });
  it("reports a rejected verification as failed", async () => {
    const w = fakeWindow();
    vi.mocked(apiJson).mockRejectedValue(new ApiError("Signature mismatch", 400));
    const result = pay(session, {});
    await opened();
    await w.succeed();
    await expect(result).resolves.toEqual({ state: "failed", message: "Signature mismatch" });
  });
  it.each([["a server error", new ApiError("Bad gateway", 502)], ["a network error", new TypeError("Failed to fetch")]])(
    "stays pending after %s, because the payment may have gone through",
    async (_label, error) => {
      const w = fakeWindow();
      vi.mocked(apiJson).mockRejectedValue(error);
      const result = pay(session, {});
      await opened();
      await w.succeed();
      await expect(result).resolves.toEqual({ state: "pending", orderId: "ZB-1" });
    },
  );
});
