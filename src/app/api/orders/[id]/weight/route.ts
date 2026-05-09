import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import { calculateOrderCost } from "@/lib/cost-calculator";
import type { NextRequest } from "next/server";

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/orders/[id]/weight">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "WAREHOUSE_CN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const { weightKg } = body;

  if (!weightKg || weightKg <= 0) {
    return errorResponse("Valid weight is required");
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return errorResponse("Order not found", 404);

  const cost = calculateOrderCost({
    unitPriceCNY: parseFloat(order.unitPriceCNY.toString()),
    quantity: order.quantity,
    exchangeRate: parseFloat(order.exchangeRate.toString()),
    serviceFeePercent: parseFloat(order.serviceFeePercent.toString()),
    chinaShippingFee: parseFloat(order.chinaShippingFee.toString()),
    weightKg: parseFloat(weightKg),
    internationalShippingRate: parseFloat(order.internationalShippingRate.toString()),
    vietnamDeliveryFee: parseFloat(order.vietnamDeliveryFee.toString()),
  });

  const updated = await prisma.order.update({
    where: { id },
    data: {
      weightKg: parseFloat(weightKg),
      internationalShippingFee: cost.internationalShippingFee,
      totalCostVND: cost.totalCostVND,
    },
  });

  return jsonResponse(updated);
}
