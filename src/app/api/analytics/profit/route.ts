export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "ACCOUNTANT"])) {
    return errorResponse("Forbidden", 403);
  }

  const completedOrders = await prisma.order.findMany({
    where: { status: "COMPLETED" },
    select: {
      orderCode: true,
      totalCostVND: true,
      totalPriceVND: true,
      serviceFeeVND: true,
      chinaShippingFee: true,
      internationalShippingFee: true,
      vietnamDeliveryFee: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const orders = completedOrders.map((o) => {
    const totalCharged = parseFloat(o.totalCostVND.toString());
    const productCost = parseFloat(o.totalPriceVND.toString());
    const profit = totalCharged - productCost;
    return {
      orderCode: o.orderCode,
      totalCharged,
      productCost,
      serviceFee: parseFloat(o.serviceFeeVND.toString()),
      shippingCosts:
        parseFloat(o.chinaShippingFee.toString()) +
        parseFloat(o.internationalShippingFee.toString()) +
        parseFloat(o.vietnamDeliveryFee.toString()),
      profit,
      date: o.createdAt,
    };
  });

  const totalProfit = orders.reduce((sum, o) => sum + o.profit, 0);
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalCharged, 0);

  return jsonResponse({ totalRevenue, totalProfit, orders });
}
