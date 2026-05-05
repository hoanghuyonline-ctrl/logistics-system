export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "ACCOUNTANT"])) {
    return errorResponse("Forbidden", 403);
  }

  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get("days") || "30");
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const orders = await prisma.order.findMany({
    where: {
      status: "COMPLETED",
      createdAt: { gte: startDate },
    },
    select: { totalCostVND: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const dailyRevenue: Record<string, number> = {};
  for (const order of orders) {
    const date = order.createdAt.toISOString().slice(0, 10);
    dailyRevenue[date] = (dailyRevenue[date] || 0) + parseFloat(order.totalCostVND.toString());
  }

  return jsonResponse({
    period: `${days} days`,
    data: Object.entries(dailyRevenue).map(([date, revenue]) => ({ date, revenue })),
  });
}
