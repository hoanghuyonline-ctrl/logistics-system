export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler, safeQuery } from "@/lib/utils";

const THRESHOLDS = {
  STUCK_DAYS: 5,
  NO_WEIGHT_DAYS: 2,
  NO_TRACKING_DAYS: 3,
  DEBT_THRESHOLD_VND: 500_000,
};

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

interface AlertItem {
  id: string;
  type: "stuck_order" | "missing_weight" | "missing_tracking" | "unpaid_debt" | "notif_failure";
  level: "red" | "yellow";
  title: string;
  detail: string;
  href: string;
  createdAt: string;
}

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "STAFF"])) {
    return errorResponse("Forbidden", 403);
  }

  const [
    stuckOrders,
    noWeightPackages,
    noTrackingOrders,
    debtCustomers,
    recentFailures,
  ] = await Promise.all([
    safeQuery(prisma.order.findMany({
      where: {
        status: { in: ["PENDING", "PURCHASED", "ARRIVED_CHINA_WH"] },
        updatedAt: { lt: daysAgo(THRESHOLDS.STUCK_DAYS) },
      },
      select: {
        id: true,
        orderCode: true,
        productName: true,
        status: true,
        updatedAt: true,
        user: { select: { fullName: true } },
      },
      orderBy: { updatedAt: "asc" },
      take: 20,
    }), []),

    safeQuery(prisma.package.findMany({
      where: {
        totalWeightKg: null,
        createdAt: { lt: daysAgo(THRESHOLDS.NO_WEIGHT_DAYS) },
      },
      select: {
        id: true,
        packageCode: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
      take: 20,
    }), []),

    safeQuery(prisma.order.findMany({
      where: {
        status: { in: ["PURCHASED", "SELLER_SHIPPED"] },
        trackingCodeChina: null,
        updatedAt: { lt: daysAgo(THRESHOLDS.NO_TRACKING_DAYS) },
      },
      select: {
        id: true,
        orderCode: true,
        productName: true,
        updatedAt: true,
        user: { select: { fullName: true } },
      },
      orderBy: { updatedAt: "asc" },
      take: 20,
    }), []),

    safeQuery(prisma.wallet.findMany({
      where: { debt: { gt: THRESHOLDS.DEBT_THRESHOLD_VND } },
      select: {
        userId: true,
        debt: true,
        user: { select: { fullName: true, email: true } },
      },
      orderBy: { debt: "desc" },
      take: 20,
    }), []),

    safeQuery(prisma.notificationFailure.findMany({
      where: { resolved: false, createdAt: { gt: daysAgo(7) } },
      select: {
        id: true,
        channel: true,
        orderCode: true,
        failureCategory: true,
        shortReason: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }), []),
  ]);

  const STATUS_LABELS: Record<string, string> = {
    PENDING: "Chờ mua",
    PURCHASED: "Đã mua",
    ARRIVED_CHINA_WH: "Kho TQ",
    SELLER_SHIPPED: "Đã gửi",
  };

  const alerts: AlertItem[] = [];

  for (const o of stuckOrders) {
    const daysDiff = Math.floor((Date.now() - new Date(o.updatedAt).getTime()) / 86_400_000);
    alerts.push({
      id: `stuck-${o.id}`,
      type: "stuck_order",
      level: daysDiff > 7 ? "red" : "yellow",
      title: `Đơn ${o.orderCode} bị kẹt ${daysDiff} ngày`,
      detail: `${o.user?.fullName ?? "N/A"} — ${STATUS_LABELS[o.status] || o.status} — ${o.productName}`,
      href: `/admin/orders/${o.id}`,
      createdAt: o.updatedAt.toISOString(),
    });
  }

  for (const p of noWeightPackages) {
    const daysDiff = Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 86_400_000);
    alerts.push({
      id: `weight-${p.id}`,
      type: "missing_weight",
      level: daysDiff > 4 ? "red" : "yellow",
      title: `Kiện ${p.packageCode} chưa cân`,
      detail: `Tạo ${daysDiff} ngày trước — trạng thái: ${p.status}`,
      href: `/admin/packages`,
      createdAt: p.createdAt.toISOString(),
    });
  }

  for (const o of noTrackingOrders) {
    const daysDiff = Math.floor((Date.now() - new Date(o.updatedAt).getTime()) / 86_400_000);
    alerts.push({
      id: `tracking-${o.id}`,
      type: "missing_tracking",
      level: daysDiff > 5 ? "red" : "yellow",
      title: `Đơn ${o.orderCode} chưa có tracking`,
      detail: `${o.user?.fullName ?? "N/A"} — ${daysDiff} ngày không tracking`,
      href: `/admin/orders/${o.id}`,
      createdAt: o.updatedAt.toISOString(),
    });
  }

  for (const w of debtCustomers) {
    const debtAmount = Number(w.debt);
    alerts.push({
      id: `debt-${w.userId}`,
      type: "unpaid_debt",
      level: debtAmount > 2_000_000 ? "red" : "yellow",
      title: `${w.user?.fullName ?? "N/A"} nợ ${debtAmount.toLocaleString("vi-VN")}đ`,
      detail: w.user?.email || "Không có email",
      href: `/admin/finance`,
      createdAt: new Date().toISOString(),
    });
  }

  for (const f of recentFailures) {
    alerts.push({
      id: `notif-${f.id}`,
      type: "notif_failure",
      level: "yellow",
      title: `Gửi ${f.channel} thất bại${f.orderCode ? ` (${f.orderCode})` : ""}`,
      detail: f.shortReason?.slice(0, 80) || f.failureCategory || "Lỗi không xác định",
      href: `/admin/notification-failures`,
      createdAt: f.createdAt.toISOString(),
    });
  }

  const summary = {
    stuckOrders: stuckOrders.length,
    missingWeight: noWeightPackages.length,
    missingTracking: noTrackingOrders.length,
    unpaidDebt: debtCustomers.length,
    notifFailures: recentFailures.length,
    total: alerts.length,
  };

  return jsonResponse({ alerts, summary, thresholds: THRESHOLDS });
});
