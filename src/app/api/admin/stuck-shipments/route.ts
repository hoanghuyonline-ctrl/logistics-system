export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";

// Configurable thresholds (days)
const THRESHOLDS = {
  PENDING_DAYS: 3,
  PURCHASED_DAYS: 5,
  CHINA_WH_DAYS: 5,
  SHIPPING_DAYS: 10,
  VIETNAM_WH_DAYS: 3,
  DELIVERY_DAYS: 2,
  NO_WEIGHT_DAYS: 2,
};

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const [
    stuckPending,
    stuckPurchased,
    stuckChinaWh,
    stuckShipping,
    stuckVietnamWh,
    stuckDelivery,
    noWeightPackages,
    noTrackingOrders,
  ] = await Promise.all([
    // PENDING > 3 days
    prisma.order.findMany({
      where: { status: "PENDING", updatedAt: { lt: daysAgo(THRESHOLDS.PENDING_DAYS) } },
      select: { id: true, orderCode: true, productName: true, updatedAt: true, priority: true, user: { select: { fullName: true } } },
      orderBy: { updatedAt: "asc" },
      take: 50,
    }),
    // PURCHASED > 5 days (seller hasn't shipped)
    prisma.order.findMany({
      where: { status: "PURCHASED", updatedAt: { lt: daysAgo(THRESHOLDS.PURCHASED_DAYS) } },
      select: { id: true, orderCode: true, productName: true, updatedAt: true, priority: true, user: { select: { fullName: true } } },
      orderBy: { updatedAt: "asc" },
      take: 50,
    }),
    // Stuck at China warehouse > 5 days
    prisma.order.findMany({
      where: { status: "ARRIVED_CHINA_WH", updatedAt: { lt: daysAgo(THRESHOLDS.CHINA_WH_DAYS) } },
      select: { id: true, orderCode: true, productName: true, updatedAt: true, priority: true, user: { select: { fullName: true } } },
      orderBy: { updatedAt: "asc" },
      take: 50,
    }),
    // Shipping to VN > 10 days
    prisma.order.findMany({
      where: { status: "SHIPPING_TO_VIETNAM", updatedAt: { lt: daysAgo(THRESHOLDS.SHIPPING_DAYS) } },
      select: { id: true, orderCode: true, productName: true, updatedAt: true, priority: true, user: { select: { fullName: true } } },
      orderBy: { updatedAt: "asc" },
      take: 50,
    }),
    // At VN warehouse > 3 days (not dispatched)
    prisma.order.findMany({
      where: { status: "ARRIVED_VIETNAM_WH", updatedAt: { lt: daysAgo(THRESHOLDS.VIETNAM_WH_DAYS) } },
      select: { id: true, orderCode: true, productName: true, updatedAt: true, priority: true, user: { select: { fullName: true } } },
      orderBy: { updatedAt: "asc" },
      take: 50,
    }),
    // Out for delivery > 2 days
    prisma.order.findMany({
      where: { status: "OUT_FOR_DELIVERY", updatedAt: { lt: daysAgo(THRESHOLDS.DELIVERY_DAYS) } },
      select: { id: true, orderCode: true, productName: true, updatedAt: true, priority: true, user: { select: { fullName: true } } },
      orderBy: { updatedAt: "asc" },
      take: 50,
    }),
    // Packages without weight > 2 days old
    prisma.package.findMany({
      where: { totalWeightKg: null, createdAt: { lt: daysAgo(THRESHOLDS.NO_WEIGHT_DAYS) } },
      select: { id: true, packageCode: true, status: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),
    // Orders without tracking codes (purchased but no tracking)
    prisma.order.findMany({
      where: {
        status: { in: ["PURCHASED", "SELLER_SHIPPED"] },
        trackingCodeChina: null,
        updatedAt: { lt: daysAgo(3) },
      },
      select: { id: true, orderCode: true, productName: true, updatedAt: true, user: { select: { fullName: true } } },
      orderBy: { updatedAt: "asc" },
      take: 50,
    }),
  ]);

  return jsonResponse({
    thresholds: THRESHOLDS,
    categories: [
      { key: "pending", label: "Chờ mua > 3 ngày", level: "red", items: stuckPending },
      { key: "purchased", label: "Đã mua > 5 ngày chưa ship", level: stuckPurchased.length > 0 ? "yellow" : "green", items: stuckPurchased },
      { key: "chinaWh", label: "Kho TQ > 5 ngày", level: stuckChinaWh.length > 0 ? "yellow" : "green", items: stuckChinaWh },
      { key: "shipping", label: "Vận chuyển > 10 ngày", level: stuckShipping.length > 0 ? "red" : "green", items: stuckShipping },
      { key: "vietnamWh", label: "Kho VN > 3 ngày chưa giao", level: stuckVietnamWh.length > 0 ? "yellow" : "green", items: stuckVietnamWh },
      { key: "delivery", label: "Đang giao > 2 ngày", level: stuckDelivery.length > 0 ? "red" : "green", items: stuckDelivery },
      { key: "noWeight", label: "Kiện chưa cân", level: noWeightPackages.length > 0 ? "yellow" : "green", items: noWeightPackages },
      { key: "noTracking", label: "Đơn chưa có tracking", level: noTrackingOrders.length > 0 ? "yellow" : "green", items: noTrackingOrders },
    ],
  });
}
