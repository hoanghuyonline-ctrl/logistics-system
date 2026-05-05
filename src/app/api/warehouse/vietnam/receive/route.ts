import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import { notifyOrderStatusChange } from "@/lib/notifications";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "WAREHOUSE_VN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { orderId, note } = body;

  if (!orderId) return errorResponse("Order ID is required");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return errorResponse("Order not found", 404);

  if (order.status !== "SHIPPING_TO_VIETNAM") {
    return errorResponse("Order must be in SHIPPING_TO_VIETNAM status");
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "ARRIVED_VIETNAM_WH",
      statusLogs: {
        create: {
          fromStatus: order.status,
          toStatus: "ARRIVED_VIETNAM_WH",
          changedBy: user.id,
          note: note || "Goods received at Vietnam warehouse",
        },
      },
    },
  });

  await notifyOrderStatusChange(order.userId, order.id, order.orderCode, "ARRIVED_VIETNAM_WH");

  return jsonResponse(updated);
}
