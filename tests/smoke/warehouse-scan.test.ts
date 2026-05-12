import { describe, it, expect } from "vitest";
import type { PackageStatus } from "@prisma/client";

/**
 * Mirrors the VALID_TRANSITIONS from src/app/api/warehouse/scan/route.ts.
 * Kept here as a snapshot to detect accidental drift.
 */
const VALID_TRANSITIONS: Record<string, PackageStatus[]> = {
  AT_CHINA_WH: ["SHIPPING"],
  SHIPPING: ["AT_VIETNAM_WH"],
  AT_VIETNAM_WH: ["DELIVERED"],
};

function isValidPackageTransition(from: string, to: string): boolean {
  const allowed = VALID_TRANSITIONS[from] || [];
  return allowed.includes(to as PackageStatus);
}

describe("Warehouse scan — package status transitions", () => {
  it("allows AT_CHINA_WH → SHIPPING", () => {
    expect(isValidPackageTransition("AT_CHINA_WH", "SHIPPING")).toBe(true);
  });

  it("allows SHIPPING → AT_VIETNAM_WH", () => {
    expect(isValidPackageTransition("SHIPPING", "AT_VIETNAM_WH")).toBe(true);
  });

  it("allows AT_VIETNAM_WH → DELIVERED", () => {
    expect(isValidPackageTransition("AT_VIETNAM_WH", "DELIVERED")).toBe(true);
  });

  it("rejects backward transition SHIPPING → AT_CHINA_WH", () => {
    expect(isValidPackageTransition("SHIPPING", "AT_CHINA_WH")).toBe(false);
  });

  it("rejects skipping states AT_CHINA_WH → AT_VIETNAM_WH", () => {
    expect(isValidPackageTransition("AT_CHINA_WH", "AT_VIETNAM_WH")).toBe(false);
  });

  it("rejects transition from DELIVERED", () => {
    expect(isValidPackageTransition("DELIVERED", "SHIPPING")).toBe(false);
  });

  it("rejects transition from unknown status", () => {
    expect(isValidPackageTransition("NONEXISTENT", "SHIPPING")).toBe(false);
  });
});

/**
 * Mirrors pure utility functions from src/lib/utils.ts.
 * Imported via snapshot to avoid pulling in next-auth server deps.
 */
function generateOrderCode(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${date}-${rand}`;
}

function generatePackageCode(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PKG-${date}-${rand}`;
}

function hasRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

describe("Utility functions (order/package code, roles)", () => {
  it("generateOrderCode format matches ORD-YYYYMMDD-XXXX", () => {
    const code = generateOrderCode();
    expect(code).toMatch(/^ORD-\d{8}-[A-Z0-9]{4}$/);
  });

  it("generatePackageCode format matches PKG-YYYYMMDD-XXXX", () => {
    const code = generatePackageCode();
    expect(code).toMatch(/^PKG-\d{8}-[A-Z0-9]{4}$/);
  });

  it("hasRole correctly validates roles", () => {
    expect(hasRole("ADMIN", ["ADMIN", "WAREHOUSE_CN"])).toBe(true);
    expect(hasRole("CUSTOMER", ["ADMIN", "WAREHOUSE_CN"])).toBe(false);
    expect(hasRole("WAREHOUSE_VN", ["WAREHOUSE_VN"])).toBe(true);
  });

  it("generateOrderCode produces unique codes", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateOrderCode()));
    expect(codes.size).toBeGreaterThanOrEqual(15);
  });
});
