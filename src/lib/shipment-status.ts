import { OrderStatus } from "@prisma/client";

export enum ShipmentStatus {
  PENDING = "PENDING",
  RECEIVED_CHINA = "RECEIVED_CHINA",
  IN_CHINA_WAREHOUSE = "IN_CHINA_WAREHOUSE",
  SHIPPED_TO_VN = "SHIPPED_TO_VN",
  IN_VN_WAREHOUSE = "IN_VN_WAREHOUSE",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

/**
 * Centralized shipment status workflow.
 *
 * ShipmentStatus is the canonical status enum. The helpers below
 * provide mapping to/from the legacy OrderStatus that is still
 * stored on the Order model, plus strict transition validation.
 */

// ── Allowed transitions ────────────────────────────────────────

export const SHIPMENT_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  PENDING:            ["RECEIVED_CHINA", "CANCELLED"],
  RECEIVED_CHINA:     ["IN_CHINA_WAREHOUSE", "CANCELLED"],
  IN_CHINA_WAREHOUSE: ["SHIPPED_TO_VN", "CANCELLED"],
  SHIPPED_TO_VN:      ["IN_VN_WAREHOUSE"],
  IN_VN_WAREHOUSE:    ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY:   ["DELIVERED"],
  DELIVERED:          [],
  CANCELLED:          [],
};

// ── Validation helpers ─────────────────────────────────────────

export function isValidTransition(
  from: ShipmentStatus,
  to: ShipmentStatus,
): boolean {
  const allowed = SHIPMENT_TRANSITIONS[from];
  return allowed !== undefined && allowed.includes(to);
}

export function getNextStatuses(current: ShipmentStatus): ShipmentStatus[] {
  return SHIPMENT_TRANSITIONS[current] ?? [];
}

export class InvalidTransitionError extends Error {
  constructor(from: ShipmentStatus | string, to: ShipmentStatus | string) {
    super(`Invalid transition: ${from} → ${to}`);
    this.name = "InvalidTransitionError";
  }
}

/**
 * Validate and return `to` if the transition is allowed.
 * Throws `InvalidTransitionError` otherwise.
 */
export function assertTransition(
  from: ShipmentStatus,
  to: ShipmentStatus,
): ShipmentStatus {
  if (!isValidTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
  return to;
}

// ── Bidirectional mapping: OrderStatus ↔ ShipmentStatus ────────

const ORDER_TO_SHIPMENT: Record<OrderStatus, ShipmentStatus> = {
  PENDING:              ShipmentStatus.PENDING,
  PURCHASED:            ShipmentStatus.PENDING,
  SELLER_SHIPPED:       ShipmentStatus.PENDING,
  ARRIVED_CHINA_WH:     ShipmentStatus.RECEIVED_CHINA,
  PACKING:              ShipmentStatus.IN_CHINA_WAREHOUSE,
  SHIPPING_TO_VIETNAM:  ShipmentStatus.SHIPPED_TO_VN,
  ARRIVED_VIETNAM_WH:   ShipmentStatus.IN_VN_WAREHOUSE,
  OUT_FOR_DELIVERY:     ShipmentStatus.OUT_FOR_DELIVERY,
  COMPLETED:            ShipmentStatus.DELIVERED,
  CANCELLED:            ShipmentStatus.CANCELLED,
};

const SHIPMENT_TO_ORDER: Record<ShipmentStatus, OrderStatus> = {
  PENDING:              OrderStatus.PENDING,
  RECEIVED_CHINA:       OrderStatus.ARRIVED_CHINA_WH,
  IN_CHINA_WAREHOUSE:   OrderStatus.PACKING,
  SHIPPED_TO_VN:        OrderStatus.SHIPPING_TO_VIETNAM,
  IN_VN_WAREHOUSE:      OrderStatus.ARRIVED_VIETNAM_WH,
  OUT_FOR_DELIVERY:     OrderStatus.OUT_FOR_DELIVERY,
  DELIVERED:            OrderStatus.COMPLETED,
  CANCELLED:            OrderStatus.CANCELLED,
};

export function toShipmentStatus(orderStatus: OrderStatus): ShipmentStatus {
  return ORDER_TO_SHIPMENT[orderStatus];
}

export function toOrderStatus(shipmentStatus: ShipmentStatus): OrderStatus {
  return SHIPMENT_TO_ORDER[shipmentStatus];
}

// ── High-level helper for API routes ───────────────────────────

export interface TransitionResult {
  newOrderStatus: OrderStatus;
  newShipmentStatus: ShipmentStatus;
}

/**
 * Given the current OrderStatus on the model and a target
 * ShipmentStatus, validate the transition and return both the
 * new ShipmentStatus and the corresponding OrderStatus to persist.
 *
 * Throws `InvalidTransitionError` on illegal transitions.
 */
export function transitionOrder(
  currentOrderStatus: OrderStatus,
  targetShipment: ShipmentStatus,
): TransitionResult {
  const currentShipment = toShipmentStatus(currentOrderStatus);
  assertTransition(currentShipment, targetShipment);
  return {
    newOrderStatus: toOrderStatus(targetShipment),
    newShipmentStatus: targetShipment,
  };
}

/**
 * Convenience: validate a transition expressed in legacy
 * OrderStatus values. Uses the ShipmentStatus layer under
 * the hood so the transition rules are centralized.
 */
export function validateOrderTransition(
  fromOrder: OrderStatus,
  toOrder: OrderStatus,
): boolean {
  const fromShipment = toShipmentStatus(fromOrder);
  const toShipment = toShipmentStatus(toOrder);
  return isValidTransition(fromShipment, toShipment);
}

// ── Labels for ShipmentStatus (UI-friendly) ────────────────────

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  PENDING:            "Pending",
  RECEIVED_CHINA:     "Received at China WH",
  IN_CHINA_WAREHOUSE: "In China Warehouse",
  SHIPPED_TO_VN:      "Shipped to Vietnam",
  IN_VN_WAREHOUSE:    "In Vietnam Warehouse",
  OUT_FOR_DELIVERY:   "Out for Delivery",
  DELIVERED:          "Delivered",
  CANCELLED:          "Cancelled",
};
