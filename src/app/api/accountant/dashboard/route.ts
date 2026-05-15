export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ACCOUNTANT", "ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

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
    prisma.order.findMany({
      where: { status: "COMPLETED" },
      select: { totalCostVND: true, totalPriceVND: true, serviceFeeVND: true },
    }),
    prisma.order.count({
      where: { status: { in: ["PENDING", "PURCHASED", "SELLER_SHIPPED"] } },
    }),
    prisma.wallet.aggregate({ _sum: { debt: true } }),
    prisma.transaction.aggregate({
      where: { type: "DEPOSIT" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: { type: "DEPOSIT", createdAt: { gte: monthStart } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.findMany({
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
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.wallet.count({ where: { debt: { gt: 0 } } }),
    prisma.wallet.count({ where: { balance: { lt: 0 } } }),
    prisma.transaction.count({ where: { type: "REFUND", createdAt: { gte: todayStart } } }),
    prisma.order.count({ where: { createdAt: { gte: todayStart }, totalCostVND: { gte: 5000000 } } }),
  ]);

  const totalRevenue = completedOrders.reduce(
    (sum, o) => sum + parseFloat(o.totalCostVND.toString()), 0
  );
  const totalProductCost = completedOrders.reduce(
    (sum, o) => sum + parseFloat(o.totalPriceVND.toString()), 0
  );
  const totalServiceFees = completedOrders.reduce(
    (sum, o) => sum + parseFloat(o.serviceFeeVND.toString()), 0
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
    totalDebt: parseFloat(totalDebt._sum.debt?.toString() || "0"),
    totalDeposits: parseFloat(totalDeposits._sum.amount?.toString() || "0"),
    totalDepositCount: totalDeposits._count,
    monthDeposits: parseFloat(monthDeposits._sum.amount?.toString() || "0"),
    monthDepositCount: monthDeposits._count,
    todayTransactions,
    recentTransactions: recentTransactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: parseFloat(t.amount.toString()),
      description: t.description,
      createdAt: t.createdAt,
      userName: t.user.fullName,
      userEmail: t.user.email,
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
}
