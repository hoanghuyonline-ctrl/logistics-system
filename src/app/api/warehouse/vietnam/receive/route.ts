import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import { notifyOrderStatusChange } from "@/lib/notifications";
import { toShipmentStatus, isValidTransition } from "@/lib/shipment-status";
import { ShipmentStatus } from "@prisma/client";

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

  const currentShipment = toShipmentStatus(order.status);
  if (!isValidTransition(currentShipment, ShipmentStatus.IN_VN_WAREHOUSE)) {
    return errorResponse(
      `Cannot receive order: current status ${order.status} does not allow transition to IN_VN_WAREHOUSE`,
    );
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
