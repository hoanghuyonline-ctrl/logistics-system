export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";

type Severity = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type ItemType = "topup" | "issue" | "sla" | "notif_failure" | "missing_tracking" | "missing_weight";

interface InboxItem {
  type: ItemType;
  title: string;
  reason: string;
  severity: Severity;
  time: string;
  href: string;
}

const SEV_ORDER: Record<Severity, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const INBOX_LIMIT = 20;

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const now = new Date();
  const items: InboxItem[] = [];

  // 1. Pending top-up requests (URGENT — money waiting)
  const topups = await prisma.walletTopUpRequest.findMany({
    where: { status: "PENDING" },
    select: { id: true, amount: true, createdAt: true, customer: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  for (const t of topups) {
    items.push({
      type: "topup",
      title: `Nạp tiền: ${t.customer.fullName}`,
      reason: `${Number(t.amount).toLocaleString("vi-VN")} VND chờ duyệt`,
      severity: "URGENT",
      time: t.createdAt.toISOString(),
      href: "/admin/finance",
    });
  }

  // 2. Urgent/new customer issues
  const issues = await prisma.customerIssue.findMany({
    where: { status: "NEW", priority: { in: ["URGENT", "HIGH", "NORMAL"] } },
    select: {
      id: true, issueType: true, description: true, priority: true,
      createdAt: true, orderCode: true,
      customer: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  for (const i of issues) {
    const sev: Severity = i.priority === "URGENT" ? "URGENT" : i.priority === "HIGH" ? "HIGH" : "MEDIUM";
    items.push({
      type: "issue",
      title: `Khiếu nại: ${i.customer.fullName}`,
      reason: i.orderCode ? `Đơn ${i.orderCode} — ${i.description.slice(0, 60)}` : i.description.slice(0, 80),
      severity: sev,
      time: i.createdAt.toISOString(),
      href: "/admin/customer-issues",
    });
  }

  // 3. High/urgent SLA alerts (VN warehouse stuck, intl shipping slow)
  const vnWhStuck = await prisma.order.findMany({
    where: {
      status: "ARRIVED_VIETNAM_WH",
      updatedAt: { lt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) },
    },
    select: { id: true, orderCode: true, updatedAt: true, user: { select: { fullName: true } } },
    orderBy: { updatedAt: "asc" },
    take: 5,
  });
  for (const o of vnWhStuck) {
    const d = daysSince(o.updatedAt);
    items.push({
      type: "sla",
      title: `Kho VN chờ giao: ${o.orderCode}`,
      reason: `${o.user.fullName} — ${d} ngày tại kho VN`,
      severity: d >= 7 ? "URGENT" : "HIGH",
      time: o.updatedAt.toISOString(),
      href: `/admin/orders/${o.id}`,
    });
  }

  const intlSlow = await prisma.order.findMany({
    where: {
      status: "SHIPPING_TO_VIETNAM",
      updatedAt: { lt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
    },
    select: { id: true, orderCode: true, updatedAt: true, user: { select: { fullName: true } } },
    orderBy: { updatedAt: "asc" },
    take: 5,
  });
  for (const o of intlSlow) {
    const d = daysSince(o.updatedAt);
    items.push({
      type: "sla",
      title: `Vận chuyển chậm: ${o.orderCode}`,
      reason: `${o.user.fullName} — ${d} ngày vận chuyển quốc tế`,
      severity: d >= 21 ? "URGENT" : "HIGH",
      time: o.updatedAt.toISOString(),
      href: `/admin/orders/${o.id}`,
    });
  }

  // 4. Recent unresolved notification failures
  const notifFails = await prisma.notificationFailure.findMany({
    where: { resolved: false },
    select: { id: true, channel: true, shortReason: true, createdAt: true, recipient: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });
  for (const n of notifFails) {
    items.push({
      type: "notif_failure",
      title: `Gửi ${n.channel} lỗi`,
      reason: n.shortReason?.slice(0, 80) || "Không rõ lỗi",
      severity: "MEDIUM",
      time: n.createdAt.toISOString(),
      href: "/admin/notification-failures",
    });
  }

  // 5. Orders missing tracking (PURCHASED/SELLER_SHIPPED > 3 days, no China tracking)
  const missingTracking = await prisma.order.findMany({
    where: {
      status: { in: ["PURCHASED", "SELLER_SHIPPED"] },
      trackingCodeChina: null,
      updatedAt: { lt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
    },
    select: { id: true, orderCode: true, updatedAt: true, user: { select: { fullName: true } } },
    orderBy: { updatedAt: "asc" },
    take: 5,
  });
  for (const o of missingTracking) {
    const d = daysSince(o.updatedAt);
    items.push({
      type: "missing_tracking",
      title: `Thiếu tracking: ${o.orderCode}`,
      reason: `${o.user.fullName} — ${d} ngày chưa có mã vận đơn TQ`,
      severity: d >= 10 ? "URGENT" : d >= 5 ? "HIGH" : "MEDIUM",
      time: o.updatedAt.toISOString(),
      href: `/admin/orders/${o.id}`,
    });
  }

  // 6. Orders missing weight (post-China WH, no weightKg)
  const missingWeight = await prisma.order.findMany({
    where: {
      status: { in: ["ARRIVED_CHINA_WH", "PACKING", "SHIPPING_TO_VIETNAM", "ARRIVED_VIETNAM_WH"] },
      weightKg: null,
      updatedAt: { lt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
    },
    select: { id: true, orderCode: true, updatedAt: true, status: true, user: { select: { fullName: true } } },
    orderBy: { updatedAt: "asc" },
    take: 5,
  });
  for (const o of missingWeight) {
    const d = daysSince(o.updatedAt);
    items.push({
      type: "missing_weight",
      title: `Thiếu cân nặng: ${o.orderCode}`,
      reason: `${o.user.fullName} — ${d} ngày chưa nhập cân`,
      severity: d >= 7 ? "HIGH" : d >= 3 ? "MEDIUM" : "LOW",
      time: o.updatedAt.toISOString(),
      href: `/admin/orders/${o.id}`,
    });
  }

  // Sort by severity first, then newest
  items.sort((a, b) => {
    const sevDiff = SEV_ORDER[a.severity] - SEV_ORDER[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  });

  return jsonResponse({ items: items.slice(0, INBOX_LIMIT), total: items.length });
});
