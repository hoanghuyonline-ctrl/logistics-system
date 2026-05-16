export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler, safeQuery, safeDecimal } from "@/lib/utils";

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ACCOUNTANT", "ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const emptyAggregate = { _sum: { debt: null, amount: null }, _count: 0 } as never;

  const [
    completedOrders,
    pendingPayments,
    totalDebt,
    totalDeposits,
    monthDeposits,
    recentTransactions,
    ordersByStatus,
    customersWithDebt,
    negativeBalanceCount,
    todayRefunds,
    highValueOrdersToday,
  ] = await Promise.all([
    safeQuery(prisma.order.findMany({
      where: { status: "COMPLETED" },
      select: { totalCostVND: true, totalPriceVND: true, serviceFeeVND: true },
    }), []),
    safeQuery(prisma.order.count({
      where: { status: { in: ["PENDING", "PURCHASED", "SELLER_SHIPPED"] } },
    }), 0),
    safeQuery(prisma.wallet.aggregate({ _sum: { debt: true } }), emptyAggregate),
    safeQuery(prisma.transaction.aggregate({
      where: { type: "DEPOSIT" },
      _sum: { amount: true },
      _count: true,
    }), emptyAggregate),
    safeQuery(prisma.transaction.aggregate({
      where: { type: "DEPOSIT", createdAt: { gte: monthStart } },
      _sum: { amount: true },
      _count: true,
    }), emptyAggregate),
    safeQuery(prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        createdAt: true,
        user: { select: { fullName: true, email: true } },
        order: { select: { orderCode: true } },
      },
    }), []),
    safeQuery(prisma.order.groupBy({
      by: ["status"],
      _count: { status: true },
    }), []),
    safeQuery(prisma.wallet.count({ where: { debt: { gt: 0 } } }), 0),
    safeQuery(prisma.wallet.count({ where: { balance: { lt: 0 } } }), 0),
    safeQuery(prisma.transaction.count({ where: { type: "REFUND", createdAt: { gte: todayStart } } }), 0),
    safeQuery(prisma.order.count({ where: { createdAt: { gte: todayStart }, totalCostVND: { gte: 5000000 } } }), 0),
  ]);

  const totalRevenue = completedOrders.reduce(
    (sum, o) => sum + safeDecimal(o.totalCostVND), 0
  );
  const totalProductCost = completedOrders.reduce(
    (sum, o) => sum + safeDecimal(o.totalPriceVND), 0
  );
  const totalServiceFees = completedOrders.reduce(
    (sum, o) => sum + safeDecimal(o.serviceFeeVND), 0
  );
  const estimatedProfit = totalRevenue - totalProductCost;

  const todayTransactions = recentTransactions.filter(
    (t) => new Date(t.createdAt) >= todayStart
  ).length;

  return jsonResponse({
    totalRevenue,
    estimatedProfit,
    totalServiceFees,
    completedOrderCount: completedOrders.length,
    pendingPayments,
    totalDebt: safeDecimal(totalDebt._sum.debt),
    totalDeposits: safeDecimal(totalDeposits._sum.amount),
    totalDepositCount: totalDeposits._count,
    monthDeposits: safeDecimal(monthDeposits._sum.amount),
    monthDepositCount: monthDeposits._count,
    todayTransactions,
    recentTransactions: recentTransactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: safeDecimal(t.amount),
      description: t.description,
      createdAt: t.createdAt,
      userName: t.user?.fullName ?? "N/A",
      userEmail: t.user?.email ?? "",
      orderCode: t.order?.orderCode || null,
    })),
    ordersByStatus: ordersByStatus.map((s) => ({
      status: s.status,
      count: s._count.status,
    })),
    customersWithDebt,
    negativeBalanceCount,
    todayRefunds,
    highValueOrdersToday,
  });
});
