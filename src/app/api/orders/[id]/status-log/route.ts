export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/orders/[id]/status-log">) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const { id } = await ctx.params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return errorResponse("Order not found", 404);

  if (hasRole(user.role, ["CUSTOMER"]) && order.userId !== user.id) {
    return errorResponse("Forbidden", 403);
  }

  const logs = await prisma.orderStatusLog.findMany({
    where: { orderId: id },
    orderBy: { createdAt: "asc" },
    include: { changer: { select: { fullName: true, role: true } } },
  });

  return jsonResponse(logs);
}
