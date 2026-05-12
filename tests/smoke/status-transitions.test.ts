import { describe, it, expect } from "vitest";
import {
  isValidTransition,
  toShipmentStatus,
  toOrderStatus,
  transitionOrder,
  validateOrderTransition,
  InvalidTransitionError,
  ShipmentStatus,
  SHIPMENT_TRANSITIONS,
  type OrderStatus,
} from "@/lib/shipment-status";
import { ORDER_STATUS_TRANSITIONS } from "@/types";

describe("ShipmentStatus transitions", () => {
  it("allows valid forward transitions", () => {
    expect(isValidTransition("PENDING", "RECEIVED_CHINA")).toBe(true);
    expect(isValidTransition("RECEIVED_CHINA", "IN_CHINA_WAREHOUSE")).toBe(true);
    expect(isValidTransition("IN_CHINA_WAREHOUSE", "SHIPPED_TO_VN")).toBe(true);
    expect(isValidTransition("SHIPPED_TO_VN", "IN_VN_WAREHOUSE")).toBe(true);
    expect(isValidTransition("IN_VN_WAREHOUSE", "OUT_FOR_DELIVERY")).toBe(true);
    expect(isValidTransition("OUT_FOR_DELIVERY", "DELIVERED")).toBe(true);
  });

  it("allows cancellation from early states", () => {
    expect(isValidTransition("PENDING", "CANCELLED")).toBe(true);
    expect(isValidTransition("RECEIVED_CHINA", "CANCELLED")).toBe(true);
    expect(isValidTransition("IN_CHINA_WAREHOUSE", "CANCELLED")).toBe(true);
  });

  it("rejects backward transitions", () => {
    expect(isValidTransition("DELIVERED", "OUT_FOR_DELIVERY")).toBe(false);
    expect(isValidTransition("IN_VN_WAREHOUSE", "SHIPPED_TO_VN")).toBe(false);
  });

  it("rejects transitions from terminal states", () => {
    expect(isValidTransition("DELIVERED", "PENDING")).toBe(false);
    expect(isValidTransition("CANCELLED", "PENDING")).toBe(false);
  });

  it("rejects skipping states", () => {
    expect(isValidTransition("PENDING", "SHIPPED_TO_VN")).toBe(false);
    expect(isValidTransition("PENDING", "DELIVERED")).toBe(false);
  });
});

describe("OrderStatus ↔ ShipmentStatus mapping", () => {
  it("maps all OrderStatus values to ShipmentStatus", () => {
    const orderStatuses = Object.keys(ORDER_STATUS_TRANSITIONS);
    for (const os of orderStatuses) {
      const ss = toShipmentStatus(os as OrderStatus);
      expect(ss).toBeDefined();
    }
  });

  it("maps collapsed statuses correctly", () => {
    expect(toShipmentStatus("PENDING")).toBe("PENDING");
    expect(toShipmentStatus("PURCHASED")).toBe("PENDING");
    expect(toShipmentStatus("SELLER_SHIPPED")).toBe("PENDING");
  });

  it("maps all ShipmentStatus values back to OrderStatus", () => {
    for (const ss of Object.values(ShipmentStatus)) {
      const os = toOrderStatus(ss);
      expect(os).toBeDefined();
    }
  });

  it("round-trips canonical statuses", () => {
    expect(toOrderStatus(toShipmentStatus("ARRIVED_CHINA_WH"))).toBe("ARRIVED_CHINA_WH");
    expect(toOrderStatus(toShipmentStatus("PACKING"))).toBe("PACKING");
    expect(toOrderStatus(toShipmentStatus("COMPLETED"))).toBe("COMPLETED");
    expect(toOrderStatus(toShipmentStatus("CANCELLED"))).toBe("CANCELLED");
  });
});

describe("transitionOrder", () => {
  it("returns correct statuses for valid transition", () => {
    const result = transitionOrder("PENDING", "RECEIVED_CHINA");
    expect(result.newShipmentStatus).toBe("RECEIVED_CHINA");
    expect(result.newOrderStatus).toBe("ARRIVED_CHINA_WH");
  });

  it("throws InvalidTransitionError for invalid transition", () => {
    expect(() => transitionOrder("PENDING", "DELIVERED")).toThrow(InvalidTransitionError);
  });
});

describe("validateOrderTransition (legacy)", () => {
  it("validates legit forward flow via shipment layer", () => {
    expect(validateOrderTransition("ARRIVED_CHINA_WH", "PACKING")).toBe(true);
    expect(validateOrderTransition("PACKING", "SHIPPING_TO_VIETNAM")).toBe(true);
  });

  it("rejects illegal jumps", () => {
    expect(validateOrderTransition("PENDING", "COMPLETED")).toBe(false);
  });
});

describe("ORDER_STATUS_TRANSITIONS map", () => {
  it("every status has an entry", () => {
    const statuses = [
      "PENDING", "PURCHASED", "SELLER_SHIPPED", "ARRIVED_CHINA_WH",
      "PACKING", "SHIPPING_TO_VIETNAM", "ARRIVED_VIETNAM_WH",
      "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED",
    ];
    for (const s of statuses) {
      expect(ORDER_STATUS_TRANSITIONS).toHaveProperty(s);
      expect(Array.isArray(ORDER_STATUS_TRANSITIONS[s as keyof typeof ORDER_STATUS_TRANSITIONS])).toBe(true);
    }
  });

  it("terminal states have no transitions", () => {
    expect(ORDER_STATUS_TRANSITIONS.COMPLETED).toEqual([]);
    expect(ORDER_STATUS_TRANSITIONS.CANCELLED).toEqual([]);
  });

  it("PENDING can move to PURCHASED or CANCELLED", () => {
    expect(ORDER_STATUS_TRANSITIONS.PENDING).toContain("PURCHASED");
    expect(ORDER_STATUS_TRANSITIONS.PENDING).toContain("CANCELLED");
  });
});

describe("SHIPMENT_TRANSITIONS completeness", () => {
  it("every ShipmentStatus has an entry", () => {
    for (const ss of Object.values(ShipmentStatus)) {
      expect(SHIPMENT_TRANSITIONS).toHaveProperty(ss);
    }
  });
});
