import type { Role } from "@prisma/client";
import type { OrderStatus } from "@/lib/shipment-status";
import { ShipmentStatus } from "@/lib/shipment-status";

export type { Role };
export type { OrderStatus };
export { ShipmentStatus };

// Re-export centralized shipment status helpers for convenience
export {
  SHIPMENT_TRANSITIONS,
  isValidTransition,
  getNextStatuses,
  assertTransition,
  InvalidTransitionError,
  toShipmentStatus,
  toOrderStatus,
  transitionOrder,
  validateOrderTransition,
  SHIPMENT_STATUS_LABELS,
} from "@/lib/shipment-status";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PURCHASED", "CANCELLED"],
  PURCHASED: ["SELLER_SHIPPED", "CANCELLED"],
  SELLER_SHIPPED: ["ARRIVED_CHINA_WH"],
  ARRIVED_CHINA_WH: ["PACKING"],
  PACKING: ["SHIPPING_TO_VIETNAM"],
  SHIPPING_TO_VIETNAM: ["ARRIVED_VIETNAM_WH"],
  ARRIVED_VIETNAM_WH: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  AT_GUANGZHOU_WAREHOUSE: ["AT_NANNING_TRANSIT"],
  AT_NANNING_TRANSIT: ["AT_PINGXIANG_BORDER"],
  AT_PINGXIANG_BORDER: ["CUSTOMS_CLEARED_AT"],
  CUSTOMS_CLEARED_AT: ["AT_VIETNAM_DISTRIBUTION"],
  AT_VIETNAM_DISTRIBUTION: ["COMPLETED"],
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PURCHASED: "Purchased",
  SELLER_SHIPPED: "Seller Shipped",
  ARRIVED_CHINA_WH: "Arrived China WH",
  PACKING: "Packing",
  SHIPPING_TO_VIETNAM: "Shipping to Vietnam",
  ARRIVED_VIETNAM_WH: "Arrived Vietnam WH",
  OUT_FOR_DELIVERY: "Out for Delivery",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  AT_GUANGZHOU_WAREHOUSE: "At Guangzhou Warehouse",
  AT_NANNING_TRANSIT: "At Nanning Transit",
  AT_PINGXIANG_BORDER: "At Pingxiang Border",
  CUSTOMS_CLEARED_AT: "Customs Cleared",
  AT_VIETNAM_DISTRIBUTION: "At Vietnam Distribution",
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PURCHASED: "bg-blue-100 text-blue-800",
  SELLER_SHIPPED: "bg-indigo-100 text-indigo-800",
  ARRIVED_CHINA_WH: "bg-purple-100 text-purple-800",
  PACKING: "bg-orange-100 text-orange-800",
  SHIPPING_TO_VIETNAM: "bg-cyan-100 text-cyan-800",
  ARRIVED_VIETNAM_WH: "bg-teal-100 text-teal-800",
  OUT_FOR_DELIVERY: "bg-lime-100 text-lime-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  AT_GUANGZHOU_WAREHOUSE: "bg-violet-100 text-violet-800",
  AT_NANNING_TRANSIT: "bg-indigo-100 text-indigo-800",
  AT_PINGXIANG_BORDER: "bg-amber-100 text-amber-800",
  CUSTOMS_CLEARED_AT: "bg-cyan-100 text-cyan-800",
  AT_VIETNAM_DISTRIBUTION: "bg-emerald-100 text-emerald-800",
};
