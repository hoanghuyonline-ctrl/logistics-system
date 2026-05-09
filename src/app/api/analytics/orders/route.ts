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
    where: { createdAt: { gte: startDate } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const dailyOrders: Record<string, number> = {};
  for (const order of orders) {
    const date = order.createdAt.toISOString().slice(0, 10);
    dailyOrders[date] = (dailyOrders[date] || 0) + 1;
  }

  return jsonResponse({
    period: `${days} days`,
    data: Object.entries(dailyOrders).map(([date, count]) => ({ date, count })),
  });
}
