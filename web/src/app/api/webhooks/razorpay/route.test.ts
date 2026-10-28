import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeDb, FakeFieldValue } from "@/test/fake-firestore";

let db = new FakeDb();
vi.mock("@/lib/server/admin", () => ({ adminDb: () => db, isAdminConfigured: () => true }));
vi.mock("firebase-admin/firestore", () => ({ FieldValue: FakeFieldValue }));
const finalizePayment = vi.fn();
const markPaymentFailed = vi.fn();
vi.mock("@/lib/server/payment-flow", () => ({ finalizePayment: (...a: unknown[]) => finalizePayment(...a) }));
vi.mock("@/lib/server/orders", () => ({ markPaymentFailed: (...a: unknown[]) => markPaymentFailed(...a) }));

import { POST } from "./route";

const SECRET = "whsec_test";
process.env.RAZORPAY_WEBHOOK_SECRET = SECRET;

const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1", order_id: "order_rzp1" } } } });
const sign = (b: string, s = SECRET) => createHmac("sha256", s).update(b).digest("hex");
const call = (b: string, headers: Record<string, string>) =>
  POST(new Request("http://x/api/webhooks/razorpay", { method: "POST", body: b, headers }));

beforeEach(() => {
  db = new FakeDb();
  finalizePayment.mockReset().mockResolvedValue({ state: "paid" });
  markPaymentFailed.mockReset();
  db.seed("orders/ZB-1", { providerOrderId: "order_rzp1", total: 1000, userId: "u1" });
});

describe("Razorpay webhook", () => {
  it("rejects a bad signature without touching any order", async () => {
    const res = await call(body, { "x-razorpay-signature": sign(body, "wrong"), "x-razorpay-event-id": "evt_1" });
    expect(res.status).toBe(400);
    expect(finalizePayment).not.toHaveBeenCalled();
  });

  it("rejects a missing signature", async () => {
    expect((await call(body, { "x-razorpay-event-id": "evt_1" })).status).toBe(400);
  });

  it("verifies against the raw body (whitespace changes break the signature)", async () => {
    const reformatted = JSON.stringify(JSON.parse(body), null, 2);
    const res = await call(reformatted, { "x-razorpay-signature": sign(body), "x-razorpay-event-id": "evt_1" });
    expect(res.status).toBe(400);
  });

  it("processes a valid event once and treats redelivery as a duplicate", async () => {
    const h = { "x-razorpay-signature": sign(body), "x-razorpay-event-id": "evt_1" };
    const first = await call(body, h);
    const second = await call(body, h);
    expect(first.status).toBe(200);
    expect(await second.json()).toMatchObject({ duplicate: true });
    expect(finalizePayment).toHaveBeenCalledTimes(1);
    expect(finalizePayment).toHaveBeenCalledWith("ZB-1", "pay_1");
  });

  it("releases the idempotency claim when processing fails so Razorpay's retry can succeed", async () => {
    finalizePayment.mockRejectedValueOnce(new Error("transient"));
    const h = { "x-razorpay-signature": sign(body), "x-razorpay-event-id": "evt_2" };
    expect((await call(body, h)).status).toBe(500);
    expect((await call(body, h)).status).toBe(200);
    expect(finalizePayment).toHaveBeenCalledTimes(2);
  });

  it("records payment.failed without confirming", async () => {
    const failed = JSON.stringify({ event: "payment.failed", payload: { payment: { entity: { id: "pay_2", order_id: "order_rzp1", error_description: "declined" } } } });
    const res = await call(failed, { "x-razorpay-signature": sign(failed), "x-razorpay-event-id": "evt_3" });
    expect(res.status).toBe(200);
    expect(markPaymentFailed).toHaveBeenCalledWith("ZB-1", "declined");
    expect(finalizePayment).not.toHaveBeenCalled();
  });
});
