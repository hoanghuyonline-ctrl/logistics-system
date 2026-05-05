import { Role, OrderStatus } from "@prisma/client";

export type { Role, OrderStatus };

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
};
