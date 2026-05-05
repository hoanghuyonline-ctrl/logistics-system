import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import { notifyOrderStatusChange } from "@/lib/notifications";
import type { NextRequest } from "next/server";

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/warehouse/vietnam/delivery/[id]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "WAREHOUSE_VN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const { status, note } = body;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return errorResponse("Order not found", 404);

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status,
      statusLogs: {
        create: {
          fromStatus: order.status,
          toStatus: status,
          changedBy: user.id,
          note,
        },
      },
    },
  });

  await notifyOrderStatusChange(order.userId, order.id, order.orderCode, status);

  return jsonResponse(updated);
}
