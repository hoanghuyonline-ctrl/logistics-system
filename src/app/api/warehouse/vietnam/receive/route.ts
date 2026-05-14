import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import { onShipmentStatusChanged } from "@/lib/notifications";
import { toShipmentStatus, isValidTransition, ShipmentStatus } from "@/lib/shipment-status";
import { auditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user.role, ["ADMIN", "WAREHOUSE_VN"])) {
      return errorResponse("Bạn không có quyền thực hiện thao tác này", 403);
    }

    const body = await request.json();
    const { orderId, note } = body;

    if (!orderId) return errorResponse("Mã đơn hàng là bắt buộc");

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return errorResponse("Không tìm thấy đơn hàng", 404);

    const currentShipment = toShipmentStatus(order.status);
    if (!isValidTransition(currentShipment, ShipmentStatus.IN_VN_WAREHOUSE)) {
      return errorResponse("Không thể chuyển trạng thái đơn hàng hiện tại");
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
            note: note || "Đã nhận hàng tại kho Việt Nam",
          },
        },
      },
    });

    auditLog({
      action: "WAREHOUSE_RECEIVE_VN",
      actorId: user.id,
      actorEmail: user.email || "",
      actorRole: user.role,
      entityType: "order",
      entityId: order.id,
      entityCode: order.orderCode,
      details: { fromStatus: order.status, toStatus: "ARRIVED_VIETNAM_WH" },
    });

    prisma.user
      .findUnique({ where: { id: order.userId }, select: { email: true, fullName: true } })
      .then((customer) =>
        onShipmentStatusChanged({
          userId: order.userId,
          userEmail: customer?.email,
          userName: customer?.fullName,
          orderId: order.id,
          orderCode: order.orderCode,
          fromStatus: order.status,
          toStatus: "ARRIVED_VIETNAM_WH",
          channels: ["SYSTEM", "EMAIL", "TELEGRAM", "ZALO"],
        }),
      )
      .catch((err) => {
        console.error("[notify] warehouse vietnam receive failed:", err);
      });

    return jsonResponse(updated);
  } catch (error) {
    console.error("[warehouse/vietnam/receive] Error:", error);
    return errorResponse("Đã xảy ra lỗi hệ thống, vui lòng thử lại", 500);
  }
}
