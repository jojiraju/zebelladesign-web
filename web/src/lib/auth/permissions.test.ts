import { describe, expect, it } from "vitest";
import { canCustomerAccessOrder, hasPermission, isRole } from "./permissions";

describe("role permissions", () => {
  it("gives admins everything and fulfilment staff only operations", () => {
    expect(hasPermission("admin", "orders:refund")).toBe(true);
    expect(hasPermission("admin", "roles:manage")).toBe(true);
    expect(hasPermission("fulfillment", "orders:fulfil")).toBe(true);
    expect(hasPermission("fulfillment", "orders:refund")).toBe(false);
    expect(hasPermission("fulfillment", "catalog:write")).toBe(false);
    expect(hasPermission("editor", "catalog:write")).toBe(true);
    expect(hasPermission("editor", "orders:refund")).toBe(false);
    expect(hasPermission("editor", "roles:manage")).toBe(false);
  });
  it("denies customers and junk role values", () => {
    for (const r of [undefined, null, "", "customer", "ADMIN", "root", 1, true, {}]) {
      expect(isRole(r)).toBe(false);
      expect(hasPermission(r, "content:write")).toBe(false);
    }
  });
});

describe("customer order access", () => {
  it("allows only the owner", () => {
    expect(canCustomerAccessOrder("u1", { userId: "u1" })).toBe(true);
    expect(canCustomerAccessOrder("u2", { userId: "u1" })).toBe(false);
    expect(canCustomerAccessOrder(undefined, { userId: "u1" })).toBe(false);
    expect(canCustomerAccessOrder("", { userId: "" })).toBe(false);
  });
});
