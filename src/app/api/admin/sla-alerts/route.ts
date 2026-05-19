export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";

type Severity = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface SlaAlert {
  key: string;
  title: string;
  description: string;
  severity: Severity;
  count: number;
  orders: Array<{
    id: string;
    orderCode: string;
    productName: string;
    customer: string;
    status: string;
    daysSince: number;
    totalCostVND: number;
  }>;
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function severityForDays(days: number, thresholds: [number, number, number]): Severity {
  if (days >= thresholds[2]) return "URGENT";
  if (days >= thresholds[1]) return "HIGH";
  if (days >= thresholds[0]) return "MEDIUM";
  return "LOW";
}

function maxSeverity(items: Array<{ severity: Severity }>): Severity {
  const order: Severity[] = ["URGENT", "HIGH", "MEDIUM", "LOW"];
  for (const s of order) {
    if (items.some((i) => i.severity === s)) return s;
  }
  return "LOW";
}

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const now = new Date();
  const alerts: SlaAlert[] = [];

  // 1. Orders at Vietnam warehouse > X days (SLA: 2d medium, 4d high, 7d urgent)
  const vnWhOrders = await prisma.order.findMany({
    where: {
      status: "ARRIVED_VIETNAM_WH",
      updatedAt: { lt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
    },
    select: {
      id: true, orderCode: true, productName: true, status: true,
      totalCostVND: true, updatedAt: true,
      user: { select: { fullName: true } },
    },
    orderBy: { updatedAt: "asc" },
    take: 20,
  });
  if (vnWhOrders.length > 0) {
    const items = vnWhOrders.map((o) => {
      const days = daysSince(o.updatedAt);
      return {
        id: o.id, orderCode: o.orderCode, productName: o.productName,
        customer: o.user.fullName, status: o.status, daysSince: days,
        totalCostVND: Number(o.totalCostVND),
        severity: severityForDays(days, [2, 4, 7]),
      };
    });
    alerts.push({
      key: "vietnam_wh_stuck",
      title: "Kho VN chờ giao quá lâu",
      description: "Đơn đã về kho Việt Nam nhưng chưa giao khách",
      severity: maxSeverity(items),
      count: items.length,
      orders: items,
    });
  }

  // 2. International shipping > X days (SLA: 7d medium, 14d high, 21d urgent)
  const intlShipOrders = await prisma.order.findMany({
    where: {
      status: "SHIPPING_TO_VIETNAM",
      updatedAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
    },
    select: {
      id: true, orderCode: true, productName: true, status: true,
      totalCostVND: true, updatedAt: true,
      user: { select: { fullName: true } },
    },
    orderBy: { updatedAt: "asc" },
    take: 20,
  });
  if (intlShipOrders.length > 0) {
    const items = intlShipOrders.map((o) => {
      const days = daysSince(o.updatedAt);
      return {
        id: o.id, orderCode: o.orderCode, productName: o.productName,
        customer: o.user.fullName, status: o.status, daysSince: days,
        totalCostVND: Number(o.totalCostVND),
        severity: severityForDays(days, [7, 14, 21]),
      };
    });
    alerts.push({
      key: "intl_shipping_slow",
      title: "Vận chuyển quốc tế quá chậm",
      description: "Đơn đang vận chuyển quốc tế >7 ngày",
      severity: maxSeverity(items),
      count: items.length,
      orders: items,
    });
  }

  // 3. Missing tracking after seller shipped (SELLER_SHIPPED or PURCHASED > 3 days without tracking)
  const missingTrackingOrders = await prisma.order.findMany({
    where: {
      status: { in: ["PURCHASED", "SELLER_SHIPPED"] },
      trackingCodeChina: null,
      updatedAt: { lt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
    },
    select: {
      id: true, orderCode: true, productName: true, status: true,
      totalCostVND: true, updatedAt: true,
      user: { select: { fullName: true } },
    },
    orderBy: { updatedAt: "asc" },
    take: 20,
  });
  if (missingTrackingOrders.length > 0) {
    const items = missingTrackingOrders.map((o) => {
      const days = daysSince(o.updatedAt);
      return {
        id: o.id, orderCode: o.orderCode, productName: o.productName,
        customer: o.user.fullName, status: o.status, daysSince: days,
        totalCostVND: Number(o.totalCostVND),
        severity: severityForDays(days, [3, 5, 10]),
      };
    });
    alerts.push({
      key: "missing_tracking",
      title: "Thiếu mã vận đơn Trung Quốc",
      description: "Đã mua/seller đã gửi nhưng chưa có tracking TQ",
      severity: maxSeverity(items),
      count: items.length,
      orders: items,
    });
  }

  // 4. Missing weight after warehouse receive (ARRIVED_CHINA_WH or later, no weight)
  const missingWeightOrders = await prisma.order.findMany({
    where: {
      status: { in: ["ARRIVED_CHINA_WH", "PACKING", "SHIPPING_TO_VIETNAM", "ARRIVED_VIETNAM_WH"] },
      weightKg: null,
      updatedAt: { lt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
    },
    select: {
      id: true, orderCode: true, productName: true, status: true,
      totalCostVND: true, updatedAt: true,
      user: { select: { fullName: true } },
    },
    orderBy: { updatedAt: "asc" },
    take: 20,
  });
  if (missingWeightOrders.length > 0) {
    const items = missingWeightOrders.map((o) => {
      const days = daysSince(o.updatedAt);
      return {
        id: o.id, orderCode: o.orderCode, productName: o.productName,
        customer: o.user.fullName, status: o.status, daysSince: days,
        totalCostVND: Number(o.totalCostVND),
        severity: severityForDays(days, [1, 3, 7]),
      };
    });
    alerts.push({
      key: "missing_weight",
      title: "Thiếu cân nặng sau nhận kho",
      description: "Đơn đã qua kho TQ nhưng chưa nhập cân nặng",
      severity: maxSeverity(items),
      count: items.length,
      orders: items,
    });
  }

  // 5. High-value delayed orders (totalCostVND > 5M AND not completed/cancelled AND > 5 days no update)
  const highValueThreshold = 5000000;
  const highValueOrders = await prisma.order.findMany({
    where: {
      status: { notIn: ["COMPLETED", "CANCELLED", "PENDING"] },
      totalCostVND: { gte: highValueThreshold },
      updatedAt: { lt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
    },
    select: {
      id: true, orderCode: true, productName: true, status: true,
      totalCostVND: true, updatedAt: true,
      user: { select: { fullName: true } },
    },
    orderBy: { totalCostVND: "desc" },
    take: 20,
  });
  if (highValueOrders.length > 0) {
    const items = highValueOrders.map((o) => {
      const days = daysSince(o.updatedAt);
      return {
        id: o.id, orderCode: o.orderCode, productName: o.productName,
        customer: o.user.fullName, status: o.status, daysSince: days,
        totalCostVND: Number(o.totalCostVND),
        severity: severityForDays(days, [5, 10, 15]),
      };
    });
    alerts.push({
      key: "high_value_delayed",
      title: "Đơn giá trị cao bị chậm",
      description: `Đơn >5 triệu VND không cập nhật >5 ngày`,
      severity: maxSeverity(items),
      count: items.length,
      orders: items,
    });
  }

  // 6. Repeatedly updated but not progressing (same status > 7 days with recent notes/logs)
  const staleProgressOrders = await prisma.order.findMany({
    where: {
      status: { notIn: ["COMPLETED", "CANCELLED", "PENDING"] },
      updatedAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      orderNotes: { some: { createdAt: { gt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } } },
    },
    select: {
      id: true, orderCode: true, productName: true, status: true,
      totalCostVND: true, updatedAt: true,
      user: { select: { fullName: true } },
      _count: { select: { orderNotes: true } },
    },
    orderBy: { updatedAt: "asc" },
    take: 20,
  });
  if (staleProgressOrders.length > 0) {
    const items = staleProgressOrders.map((o) => {
      const days = daysSince(o.updatedAt);
      return {
        id: o.id, orderCode: o.orderCode, productName: o.productName,
        customer: o.user.fullName, status: o.status, daysSince: days,
        totalCostVND: Number(o.totalCostVND),
        severity: severityForDays(days, [7, 14, 21]),
      };
    });
    alerts.push({
      key: "stale_with_activity",
      title: "Đơn có ghi chú nhưng không tiến triển",
      description: "Trạng thái không đổi >7 ngày dù có ghi chú mới",
      severity: maxSeverity(items),
      count: items.length,
      orders: items,
    });
  }

  // Sort alerts by severity
  const severityOrder: Record<Severity, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const totalAlerts = alerts.reduce((s, a) => s + a.count, 0);

  return jsonResponse({ alerts, totalAlerts });
});
