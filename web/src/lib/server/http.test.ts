import { beforeEach, describe, expect, it, vi } from "vitest";

// A plain delegate (not vi.fn) so a deliberately-throwing verifier isn't flagged by the mock tracker.
let verify: (token: string, checkRevoked: boolean) => Promise<Record<string, unknown>> = async () => ({});
const calls: [string, boolean][] = [];
vi.mock("./admin", () => ({
  isAdminConfigured: () => true,
  adminAuth: () => ({
    verifyIdToken: (t: string, r: boolean) => {
      calls.push([t, r]);
      return verify(t, r);
    },
  }),
}));

import { HttpError, requirePermission, requireUser } from "./http";

const req = (token?: string) => new Request("http://x/api", { headers: token ? { authorization: `Bearer ${token}` } : {} });
const status = async (p: Promise<unknown>) => ((await p.catch((e) => e)) as HttpError).status;

describe("server-side authentication & authorization", () => {
  beforeEach(() => {
    calls.length = 0;
    verify = async () => ({});
  });

  it("rejects requests with no token (401) without calling Firebase", async () => {
    expect(await status(requireUser(req()))).toBe(401);
    expect(calls).toHaveLength(0);
  });
  it("rejects invalid or revoked tokens (401)", async () => {
    verify = async () => {
      throw new Error("revoked");
    };
    expect(await status(requireUser(req("bad")))).toBe(401);
  });
  it("checks token revocation on every call", async () => {
    verify = async () => ({ uid: "u1" });
    await requireUser(req("t"));
    expect(calls).toEqual([["t", true]]);
  });
  it("forbids a signed-in customer from admin actions (403)", async () => {
    verify = async () => ({ uid: "u1", email: "c@x.com" });
    expect(await status(requirePermission(req("t"), "orders:fulfil"))).toBe(403);
  });
  it("ignores role-like fields that are not the verified custom claim", async () => {
    verify = async () => ({ uid: "u1", isAdmin: true, admin: true, role: "superuser" });
    expect(await status(requirePermission(req("t"), "orders:fulfil"))).toBe(403);
  });
  it("allows the right role and denies a role lacking the permission", async () => {
    verify = async () => ({ uid: "a1", role: "fulfillment" });
    expect((await requirePermission(req("t"), "orders:fulfil")).uid).toBe("a1");
    expect(await status(requirePermission(req("t"), "orders:refund"))).toBe(403);
  });
});
