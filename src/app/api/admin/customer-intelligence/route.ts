export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { OrderStatus } from "@prisma/client";

type Severity = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface CustomerSignal {
  customerId: string;
  customerName: string;
  phone: string | null;
  reason: string;
  severity: Severity;
  type: string;
  debt: number | null;
  orderCount: number | null;
  issueCount: number | null;
  href: string;
}

const SEV_ORDER: Record<Severity, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const LIMIT = 10;

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const now = new Date();
  const signals: CustomerSignal[] = [];

  // 1. Customers with large unpaid debt (>500k VND)
  const debtCustomers = await prisma.wallet.findMany({
    where: { debt: { gt: 500000 } },
    select: {
      debt: true,
      user: { select: { id: true, fullName: true, phone: true, role: true, _count: { select: { orders: true } } } },
    },
    orderBy: { debt: "desc" },
    take: LIMIT,
  });
  for (const w of debtCustomers) {
    if (w.user.role !== "CUSTOMER") continue;
    const debt = Number(w.debt);
    const sev: Severity = debt >= 5000000 ? "URGENT" : debt >= 2000000 ? "HIGH" : "MEDIUM";
    signals.push({
      customerId: w.user.id,
      customerName: w.user.fullName,
      phone: w.user.phone,
      reason: `Nợ ${debt.toLocaleString("vi-VN")} VND chưa thanh toán`,
      severity: sev,
      type: "debt",
      debt,
      orderCount: w.user._count.orders,
      issueCount: null,
      href: `/admin/users`,
    });
  }

  // 2. Customers with repeated delayed orders (>2 orders stuck >5 days)
  const staleThreshold = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const delayedCustomers = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      orders: {
        some: {
          status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
          updatedAt: { lt: staleThreshold },
        },
      },
    },
    select: {
      id: true,
      fullName: true,
      phone: true,
      _count: {
        select: {
          orders: {
            where: {
              status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
              updatedAt: { lt: staleThreshold },
            },
          },
        },
      },
    },
    take: 20,
  });
  for (const u of delayedCustomers) {
    const count = u._count.orders;
    if (count < 2) continue;
    const sev: Severity = count >= 5 ? "URGENT" : count >= 3 ? "HIGH" : "MEDIUM";
    signals.push({
      customerId: u.id,
      customerName: u.fullName,
      phone: u.phone,
      reason: `${count} đơn chậm cập nhật >5 ngày`,
      severity: sev,
      type: "delayed_orders",
      debt: null,
      orderCount: count,
      issueCount: null,
      href: `/admin/orders`,
    });
  }

  // 3. Customers with many unresolved issues (>=2)
  const issueCustomers = await prisma.user.findMany({
    where: {
      customerIssues: {
        some: { status: { in: ["NEW", "IN_PROGRESS"] } },
      },
    },
    select: {
      id: true,
      fullName: true,
      phone: true,
      _count: {
        select: {
          customerIssues: {
            where: { status: { in: ["NEW", "IN_PROGRESS"] } },
          },
        },
      },
    },
    take: 20,
  });
  for (const u of issueCustomers) {
    const count = u._count.customerIssues;
    if (count < 2) continue;
    const sev: Severity = count >= 5 ? "URGENT" : count >= 3 ? "HIGH" : "MEDIUM";
    signals.push({
      customerId: u.id,
      customerName: u.fullName,
      phone: u.phone,
      reason: `${count} khiếu nại chưa giải quyết`,
      severity: sev,
      type: "unresolved_issues",
      debt: null,
      orderCount: null,
      issueCount: count,
      href: `/admin/customer-issues`,
    });
  }

  // 4. VIP/high-value customers with active SLA alerts (high total cost + delayed orders)
  const vipThreshold = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const vipDelayed = await prisma.order.findMany({
    where: {
      status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.PENDING] },
      updatedAt: { lt: vipThreshold },
      totalCostVND: { gte: 5000000 },
    },
    select: {
      totalCostVND: true,
      userId: true,
      user: { select: { id: true, fullName: true, phone: true } },
    },
    orderBy: { totalCostVND: "desc" },
    take: 20,
  });
  const vipSeen = new Set<string>();
  for (const o of vipDelayed) {
    if (vipSeen.has(o.userId)) continue;
    vipSeen.add(o.userId);
    const cost = Number(o.totalCostVND);
    const sev: Severity = cost >= 20000000 ? "URGENT" : cost >= 10000000 ? "HIGH" : "MEDIUM";
    signals.push({
      customerId: o.user.id,
      customerName: o.user.fullName,
      phone: o.user.phone,
      reason: `Đơn giá trị cao (${(cost / 1000000).toFixed(1)}M VND) bị chậm`,
      severity: sev,
      type: "vip_sla",
      debt: null,
      orderCount: null,
      issueCount: null,
      href: `/admin/orders`,
    });
  }

  // 5. Customers with recent failed notifications (last 7 days, >=2 failures)
  const notifCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const notifFailCustomers = await prisma.notificationFailure.findMany({
    where: {
      resolved: false,
      customerId: { not: null },
      createdAt: { gte: notifCutoff },
    },
    select: { customerId: true },
  });
  const notifCountMap = new Map<string, number>();
  for (const f of notifFailCustomers) {
    if (!f.customerId) continue;
    notifCountMap.set(f.customerId, (notifCountMap.get(f.customerId) || 0) + 1);
  }
  const notifUserIds = Array.from(notifCountMap.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, LIMIT)
    .map(([id]) => id);
  if (notifUserIds.length > 0) {
    const notifUsers = await prisma.user.findMany({
      where: { id: { in: notifUserIds } },
      select: { id: true, fullName: true, phone: true },
    });
    const notifUserMap = new Map(notifUsers.map((u) => [u.id, u]));
    for (const userId of notifUserIds) {
      const u = notifUserMap.get(userId);
      if (!u) continue;
      const count = notifCountMap.get(userId) || 0;
      signals.push({
        customerId: u.id,
        customerName: u.fullName,
        phone: u.phone,
        reason: `${count} thông báo gửi thất bại (7 ngày qua)`,
        severity: count >= 5 ? "HIGH" : "MEDIUM",
        type: "notif_failures",
        debt: null,
        orderCount: null,
        issueCount: null,
        href: `/admin/notification-failures`,
      });
    }
  }

  // 6. Inactive high-value customers (had orders >5M but no order activity in 30+ days)
  const inactiveCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const inactiveVips = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      isActive: true,
      orders: {
        some: { totalCostVND: { gte: 5000000 } },
        none: { updatedAt: { gte: inactiveCutoff } },
      },
    },
    select: {
      id: true,
      fullName: true,
      phone: true,
      _count: { select: { orders: true } },
    },
    take: LIMIT,
  });
  for (const u of inactiveVips) {
    const sev: Severity = u._count.orders >= 10 ? "HIGH" : "MEDIUM";
    signals.push({
      customerId: u.id,
      customerName: u.fullName,
      phone: u.phone,
      reason: `Khách VIP không hoạt động >30 ngày (${u._count.orders} đơn)`,
      severity: sev,
      type: "inactive_vip",
      debt: null,
      orderCount: u._count.orders,
      issueCount: null,
      href: `/admin/users`,
    });
  }

  // Deduplicate by customerId — keep highest severity
  const deduped = new Map<string, CustomerSignal>();
  for (const s of signals) {
    const existing = deduped.get(s.customerId);
    if (!existing || SEV_ORDER[s.severity] < SEV_ORDER[existing.severity]) {
      deduped.set(s.customerId, s);
    }
  }

  // Sort by severity first, then by name
  const sorted = Array.from(deduped.values()).sort((a, b) => {
    const sevDiff = SEV_ORDER[a.severity] - SEV_ORDER[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return a.customerName.localeCompare(b.customerName, "vi");
  });

  return jsonResponse({
    customers: sorted.slice(0, LIMIT),
    total: sorted.length,
  });
});
