export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { OrderStatus } from "@prisma/client";

type Severity = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface FinanceAlert {
  id: string;
  title: string;
  reason: string;
  severity: Severity;
  amount: number | null;
  type: string;
  href: string;
}

const SEV_ORDER: Record<Severity, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "STAFF"])) {
    return errorResponse("Forbidden", 403);
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const alerts: FinanceAlert[] = [];

  // 1. Customers with high debt (>500k VND)
  const highDebt = await prisma.wallet.findMany({
    where: { debt: { gt: 500000 } },
    select: {
      debt: true,
      user: { select: { id: true, fullName: true, role: true } },
    },
    orderBy: { debt: "desc" },
    take: 10,
  });
  for (const w of highDebt) {
    if (w.user.role !== "CUSTOMER") continue;
    const debt = Number(w.debt);
    const sev: Severity = debt >= 5000000 ? "URGENT" : debt >= 2000000 ? "HIGH" : "MEDIUM";
    alerts.push({
      id: `debt-${w.user.id}`,
      title: w.user.fullName,
      reason: `Nợ ${debt.toLocaleString("vi-VN")} VND`,
      severity: sev,
      amount: debt,
      type: "debt",
      href: "/admin/users",
    });
  }

  // 2. Negative wallet balances
  const negativeBalances = await prisma.wallet.findMany({
    where: { balance: { lt: 0 } },
    select: {
      balance: true,
      user: { select: { id: true, fullName: true } },
    },
    orderBy: { balance: "asc" },
    take: 10,
  });
  for (const w of negativeBalances) {
    const bal = Number(w.balance);
    alerts.push({
      id: `neg-${w.user.id}`,
      title: w.user.fullName,
      reason: `Số dư âm: ${bal.toLocaleString("vi-VN")} VND`,
      severity: "URGENT",
      amount: bal,
      type: "negative_balance",
      href: "/admin/users",
    });
  }

  // 3. Pending top-up requests older than 24 hours
  const staleTopUpCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const staleTopUps = await prisma.walletTopUpRequest.findMany({
    where: {
      status: "PENDING",
      createdAt: { lt: staleTopUpCutoff },
    },
    select: {
      id: true,
      amount: true,
      createdAt: true,
      customer: { select: { fullName: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 10,
  });
  for (const t of staleTopUps) {
    const amount = Number(t.amount);
    const hoursOld = Math.floor((now.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60));
    const sev: Severity = hoursOld >= 72 ? "URGENT" : hoursOld >= 48 ? "HIGH" : "MEDIUM";
    alerts.push({
      id: `topup-${t.id}`,
      title: t.customer.fullName,
      reason: `Nạp ${amount.toLocaleString("vi-VN")} VND chờ ${hoursOld}h`,
      severity: sev,
      amount,
      type: "stale_topup",
      href: "/admin/finance",
    });
  }

  // 4. High-value orders without confirmed pricing (>2M VND, status past PENDING)
  const unconfirmedOrders = await prisma.order.findMany({
    where: {
      confirmedTotalCost: null,
      totalCostVND: { gte: 2000000 },
      status: { notIn: [OrderStatus.PENDING, OrderStatus.CANCELLED] },
    },
    select: {
      id: true,
      orderCode: true,
      totalCostVND: true,
      user: { select: { fullName: true } },
    },
    orderBy: { totalCostVND: "desc" },
    take: 10,
  });
  for (const o of unconfirmedOrders) {
    const cost = Number(o.totalCostVND);
    const sev: Severity = cost >= 10000000 ? "URGENT" : cost >= 5000000 ? "HIGH" : "MEDIUM";
    alerts.push({
      id: `unconfirmed-${o.id}`,
      title: `${o.orderCode} — ${o.user.fullName}`,
      reason: `${(cost / 1000000).toFixed(1)}M VND chưa xác nhận giá`,
      severity: sev,
      amount: cost,
      type: "unconfirmed_pricing",
      href: `/admin/orders/${o.id}`,
    });
  }

  // 5. Orders completed but customer still has debt (payment not reconciled)
  const completedWithDebt = await prisma.order.findMany({
    where: {
      status: OrderStatus.COMPLETED,
      user: { wallet: { debt: { gt: 0 } } },
    },
    select: {
      id: true,
      orderCode: true,
      totalCostVND: true,
      user: {
        select: {
          fullName: true,
          wallet: { select: { debt: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });
  const seenDebtUsers = new Set<string>();
  for (const o of completedWithDebt) {
    const userName = o.user.fullName;
    if (seenDebtUsers.has(userName)) continue;
    seenDebtUsers.add(userName);
    const debt = Number(o.user.wallet?.debt || 0);
    if (debt <= 0) continue;
    const sev: Severity = debt >= 5000000 ? "HIGH" : "MEDIUM";
    alerts.push({
      id: `reconcile-${o.id}`,
      title: `${o.orderCode} — ${userName}`,
      reason: `Đơn hoàn thành, còn nợ ${debt.toLocaleString("vi-VN")} VND`,
      severity: sev,
      amount: debt,
      type: "unreconciled",
      href: `/admin/orders/${o.id}`,
    });
  }

  // 6. Today's refunds
  const todayRefunds = await prisma.transaction.findMany({
    where: {
      type: "REFUND",
      createdAt: { gte: todayStart },
    },
    select: {
      id: true,
      amount: true,
      description: true,
      user: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  for (const r of todayRefunds) {
    const amount = Number(r.amount);
    const sev: Severity = amount >= 5000000 ? "HIGH" : amount >= 1000000 ? "MEDIUM" : "LOW";
    alerts.push({
      id: `refund-${r.id}`,
      title: r.user.fullName,
      reason: `Hoàn ${amount.toLocaleString("vi-VN")} VND — ${r.description || "Hoàn tiền"}`,
      severity: sev,
      amount,
      type: "refund",
      href: "/admin/finance",
    });
  }

  // Sort by severity, then amount descending
  alerts.sort((a, b) => {
    const sevDiff = SEV_ORDER[a.severity] - SEV_ORDER[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return (Math.abs(b.amount || 0)) - (Math.abs(a.amount || 0));
  });

  // Summary counts
  const summary = {
    totalDebt: highDebt.reduce((s, w) => s + Number(w.debt), 0),
    negativeCount: negativeBalances.length,
    staleTopUpCount: staleTopUps.length,
    unconfirmedCount: unconfirmedOrders.length,
    refundCount: todayRefunds.length,
  };

  return jsonResponse({
    alerts: alerts.slice(0, 20),
    total: alerts.length,
    summary,
  });
});
