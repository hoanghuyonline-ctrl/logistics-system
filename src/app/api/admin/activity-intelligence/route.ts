export const dynamic = "force-dynamic";

import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xử lý",
  PURCHASED: "Đã mua hàng",
  SELLER_SHIPPED: "Người bán gửi",
  ARRIVED_CHINA_WH: "Đến kho TQ",
  PACKING: "Đóng gói",
  SHIPPING_TO_VIETNAM: "Đang vận chuyển",
  ARRIVED_VIETNAM_WH: "Đến kho VN",
  OUT_FOR_DELIVERY: "Đang giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

interface ActivityItem {
  id: string;
  type: "status_change" | "pricing_confirmed" | "topup_confirmed" | "issue_update" | "staff_note" | "anomaly";
  title: string;
  actor: string | null;
  target: string | null;
  targetLink: string | null;
  time: string;
  severity: "info" | "warning" | "danger" | null;
  detail: string | null;
}

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const activities: ActivityItem[] = [];

  // Run all queries in parallel
  const [statusLogs, pricingConfirmed, topupConfirmed, issueUpdates, staffNotes, failedNotifs, cancelledOrders, frequentUpdates] = await Promise.all([
    // 1. Recent order status changes today (top 20)
    prisma.orderStatusLog.findMany({
      where: { createdAt: { gte: todayStart } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        changer: { select: { fullName: true } },
        order: { select: { orderCode: true, totalCostVND: true } },
      },
    }),

    // 2. Recent pricing confirmations today
    prisma.order.findMany({
      where: { confirmedAt: { gte: todayStart }, confirmedById: { not: null } },
      orderBy: { confirmedAt: "desc" },
      take: 10,
      select: {
        id: true,
        orderCode: true,
        confirmedAt: true,
        confirmedTotalCost: true,
        user: { select: { fullName: true } },
      },
    }),

    // 3. Recent wallet/top-up confirmations today
    prisma.walletTopUpRequest.findMany({
      where: { confirmedAt: { gte: todayStart }, status: "CONFIRMED" },
      orderBy: { confirmedAt: "desc" },
      take: 10,
      include: {
        customer: { select: { fullName: true } },
        confirmer: { select: { fullName: true } },
      },
    }),

    // 4. Recent issue status updates today
    prisma.customerIssue.findMany({
      where: { updatedAt: { gte: todayStart } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: {
        customer: { select: { fullName: true } },
        assignee: { select: { fullName: true } },
      },
    }),

    // 5. Recent staff notes today
    prisma.staffNote.findMany({
      where: { createdAt: { gte: todayStart } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        author: { select: { fullName: true } },
      },
    }),

    // 6. Failed notifications today (for anomaly detection)
    prisma.notificationFailure.count({
      where: { createdAt: { gte: todayStart }, resolved: false },
    }),

    // 7. Cancelled orders today (anomaly)
    prisma.orderStatusLog.findMany({
      where: { createdAt: { gte: todayStart }, toStatus: "CANCELLED" },
      include: {
        changer: { select: { fullName: true } },
        order: { select: { orderCode: true, totalCostVND: true } },
      },
    }),

    // 8. Orders updated many times today (anomaly: >3 status changes)
    prisma.orderStatusLog.groupBy({
      by: ["orderId"],
      where: { createdAt: { gte: todayStart } },
      _count: { id: true },
      having: { id: { _count: { gt: 3 } } },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  // Process status changes
  for (const log of statusLogs) {
    const fromLabel = log.fromStatus ? (STATUS_LABELS[log.fromStatus] ?? log.fromStatus) : "—";
    const toLabel = STATUS_LABELS[log.toStatus] ?? log.toStatus;
    activities.push({
      id: `sl-${log.id}`,
      type: "status_change",
      title: `${log.order.orderCode}: ${fromLabel} → ${toLabel}`,
      actor: log.changer.fullName,
      target: log.order.orderCode,
      targetLink: `/admin/orders/${log.orderId}`,
      time: log.createdAt.toISOString(),
      severity: log.toStatus === "CANCELLED" ? "danger" : null,
      detail: log.note ?? null,
    });
  }

  // Process pricing confirmations
  for (const o of pricingConfirmed) {
    const cost = o.confirmedTotalCost ? Number(o.confirmedTotalCost).toLocaleString("vi-VN") : "?";
    activities.push({
      id: `pc-${o.id}`,
      type: "pricing_confirmed",
      title: `Xác nhận giá ${o.orderCode}: ${cost} VND`,
      actor: null,
      target: o.orderCode,
      targetLink: `/admin/orders/${o.id}`,
      time: (o.confirmedAt ?? new Date()).toISOString(),
      severity: null,
      detail: `Khách: ${o.user.fullName}`,
    });
  }

  // Process top-up confirmations
  for (const t of topupConfirmed) {
    const amount = Number(t.amount).toLocaleString("vi-VN");
    activities.push({
      id: `tu-${t.id}`,
      type: "topup_confirmed",
      title: `Duyệt nạp tiền: ${amount} VND`,
      actor: t.confirmer?.fullName ?? null,
      target: t.customer.fullName,
      targetLink: "/admin/finance",
      time: (t.confirmedAt ?? new Date()).toISOString(),
      severity: null,
      detail: `Ref: ${t.transferReference}`,
    });
  }

  // Process issue updates
  for (const issue of issueUpdates) {
    activities.push({
      id: `is-${issue.id}`,
      type: "issue_update",
      title: `Khiếu nại: ${issue.issueType} — ${issue.status}`,
      actor: issue.assignee?.fullName ?? null,
      target: issue.customer.fullName,
      targetLink: "/admin/customer-issues",
      time: issue.updatedAt.toISOString(),
      severity: issue.priority === "URGENT" ? "danger" : issue.priority === "HIGH" ? "warning" : null,
      detail: issue.orderCode ? `Đơn: ${issue.orderCode}` : null,
    });
  }

  // Process staff notes
  for (const note of staffNotes) {
    activities.push({
      id: `sn-${note.id}`,
      type: "staff_note",
      title: `Ghi chú: ${note.title}`,
      actor: note.author.fullName,
      target: note.orderCode ?? null,
      targetLink: "/admin/staff-notes",
      time: note.createdAt.toISOString(),
      severity: note.priority === "URGENT" ? "danger" : note.priority === "HIGH" ? "warning" : null,
      detail: null,
    });
  }

  // Anomalies
  const anomalies: ActivityItem[] = [];

  // Cancelled orders today
  if (cancelledOrders.length > 0) {
    for (const c of cancelledOrders) {
      const cost = Number(c.order.totalCostVND);
      anomalies.push({
        id: `an-cancel-${c.id}`,
        type: "anomaly",
        title: `Đơn bị hủy: ${c.order.orderCode}`,
        actor: c.changer.fullName,
        target: c.order.orderCode,
        targetLink: `/admin/orders/${c.orderId}`,
        time: c.createdAt.toISOString(),
        severity: cost > 5000000 ? "danger" : "warning",
        detail: `${cost.toLocaleString("vi-VN")} VND`,
      });
    }
  }

  // Orders with many updates today
  if (frequentUpdates.length > 0) {
    const orderIds = frequentUpdates.map((f) => f.orderId);
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, orderCode: true },
    });
    const orderMap = new Map(orders.map((o) => [o.id, o.orderCode]));
    for (const f of frequentUpdates) {
      anomalies.push({
        id: `an-freq-${f.orderId}`,
        type: "anomaly",
        title: `Cập nhật nhiều lần: ${orderMap.get(f.orderId) ?? "?"} (${f._count.id} lần)`,
        actor: null,
        target: orderMap.get(f.orderId) ?? null,
        targetLink: `/admin/orders/${f.orderId}`,
        time: new Date().toISOString(),
        severity: f._count.id > 5 ? "danger" : "warning",
        detail: `${f._count.id} thay đổi trạng thái hôm nay`,
      });
    }
  }

  // Many failed notifications today
  if (failedNotifs > 5) {
    anomalies.push({
      id: "an-notif-fail",
      type: "anomaly",
      title: `${failedNotifs} lỗi thông báo hôm nay`,
      actor: null,
      target: null,
      targetLink: "/admin/notification-failures",
      time: new Date().toISOString(),
      severity: failedNotifs > 20 ? "danger" : "warning",
      detail: "Kiểm tra hệ thống thông báo",
    });
  }

  // High-value status changes today (>5M VND)
  const highValueChanges = statusLogs.filter((s) => Number(s.order.totalCostVND) > 5000000);
  for (const hv of highValueChanges.slice(0, 5)) {
    const cost = Number(hv.order.totalCostVND).toLocaleString("vi-VN");
    // Only add if not already in anomalies as cancelled
    if (hv.toStatus !== "CANCELLED") {
      anomalies.push({
        id: `an-hv-${hv.id}`,
        type: "anomaly",
        title: `Đơn giá trị cao thay đổi: ${hv.order.orderCode}`,
        actor: hv.changer.fullName,
        target: hv.order.orderCode,
        targetLink: `/admin/orders/${hv.orderId}`,
        time: hv.createdAt.toISOString(),
        severity: "warning",
        detail: `${cost} VND — ${STATUS_LABELS[hv.toStatus] ?? hv.toStatus}`,
      });
    }
  }

  // Sort all activities by time descending
  activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  anomalies.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  // Limit to top 20 activities
  const limitedActivities = activities.slice(0, 20);

  return jsonResponse({
    activities: limitedActivities,
    anomalies,
    summary: {
      statusChanges: statusLogs.length,
      pricingConfirmed: pricingConfirmed.length,
      topupConfirmed: topupConfirmed.length,
      issueUpdates: issueUpdates.length,
      staffNotes: staffNotes.length,
      failedNotifications: failedNotifs,
      cancelledOrders: cancelledOrders.length,
      frequentlyUpdatedOrders: frequentUpdates.length,
    },
  });
});
