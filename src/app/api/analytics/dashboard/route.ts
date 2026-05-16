export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler, safeQuery, safeDecimal } from "@/lib/utils";

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "ACCOUNTANT"])) {
    return errorResponse("Forbidden", 403);
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalOrders,
    ordersToday,
    ordersThisWeek,
    ordersThisMonth,
    pendingOrders,
    inTransitOrders,
    totalCustomers,
    activeCustomers,
    allOrders,
    statusCounts,
  ] = await Promise.all([
    safeQuery(prisma.order.count(), 0),
    safeQuery(prisma.order.count({ where: { createdAt: { gte: todayStart } } }), 0),
    safeQuery(prisma.order.count({ where: { createdAt: { gte: weekStart } } }), 0),
    safeQuery(prisma.order.count({ where: { createdAt: { gte: monthStart } } }), 0),
    safeQuery(prisma.order.count({ where: { status: "PENDING" } }), 0),
    safeQuery(prisma.order.count({
      where: {
        status: { in: ["SHIPPING_TO_VIETNAM", "SELLER_SHIPPED", "ARRIVED_CHINA_WH", "PACKING"] },
      },
    }), 0),
    safeQuery(prisma.user.count({ where: { role: "CUSTOMER" } }), 0),
    safeQuery(prisma.user.count({
      where: {
        role: "CUSTOMER",
        orders: { some: { createdAt: { gte: monthStart } } },
      },
    }), 0),
    safeQuery(prisma.order.findMany({
      where: { status: "COMPLETED" },
      select: { totalCostVND: true, totalPriceVND: true },
    }), []),
    safeQuery(prisma.order.groupBy({
      by: ["status"],
      _count: { status: true },
    }), []),
  ]);

  const totalRevenue = allOrders.reduce(
    (sum, o) => sum + safeDecimal(o.totalCostVND),
    0
  );
  const totalProductCost = allOrders.reduce(
    (sum, o) => sum + safeDecimal(o.totalPriceVND),
    0
  );
  const estimatedProfit = totalRevenue - totalProductCost;

  return jsonResponse({
    totalOrders,
    ordersToday,
    ordersThisWeek,
    ordersThisMonth,
    pendingOrders,
    inTransitOrders,
    totalCustomers,
    activeCustomers,
    totalRevenue,
    estimatedProfit,
    statusDistribution: statusCounts.map((s) => ({
      status: s.status,
      count: s._count.status,
    })),
  });
});
