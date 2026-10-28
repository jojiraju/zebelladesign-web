import type { Order, Role } from "../types";

export type Permission =
  | "content:write"
  | "catalog:write"
  | "orders:read"
  | "orders:fulfil"
  | "orders:refund"
  | "inventory:write"
  | "coupons:write"
  | "customers:read"
  | "analytics:read"
  | "audit:read"
  | "roles:manage";

/** Role -> permissions. Roles come from VERIFIED custom claims only, never from client fields. */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "content:write", "catalog:write", "orders:read", "orders:fulfil", "orders:refund",
    "inventory:write", "coupons:write", "customers:read", "analytics:read", "audit:read", "roles:manage",
  ],
  editor: ["content:write", "catalog:write", "coupons:write", "analytics:read", "orders:read"],
  fulfillment: ["orders:read", "orders:fulfil", "inventory:write", "customers:read"],
};

export const ROLES = Object.keys(ROLE_PERMISSIONS) as Role[];

export const isRole = (v: unknown): v is Role => typeof v === "string" && (ROLES as string[]).includes(v);

export const hasPermission = (role: unknown, perm: Permission): boolean =>
  isRole(role) && ROLE_PERMISSIONS[role].includes(perm);

/** A customer may read an order only if they own it. */
export const canCustomerAccessOrder = (uid: string | undefined, order: Pick<Order, "userId">): boolean =>
  !!uid && order.userId === uid;
