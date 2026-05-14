import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import { onShipmentStatusChanged } from "@/lib/notifications";
import { toShipmentStatus, isValidTransition, ShipmentStatus } from "@/lib/shipment-status";
import { auditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user.role, ["ADMIN", "WAREHOUSE_CN"])) {
      return errorResponse("Bạn không có quyền thực hiện thao tác này", 403);
    }

    const body = await request.json();
    const { orderId, weightKg, note } = body;

    if (!orderId) return errorResponse("Mã đơn hàng là bắt buộc");

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return errorResponse("Không tìm thấy đơn hàng", 404);

    const currentShipment = toShipmentStatus(order.status);
    if (!isValidTransition(currentShipment, ShipmentStatus.RECEIVED_CHINA)) {
      return errorResponse("Không thể chuyển trạng thái đơn hàng hiện tại");
    }

    const updateData: Record<string, unknown> = {
      status: "ARRIVED_CHINA_WH",
      statusLogs: {
        create: {
          fromStatus: order.status,
          toStatus: "ARRIVED_CHINA_WH",
          changedBy: user.id,
          note: note || "Đã nhận hàng tại kho Trung Quốc",
        },
      },
    };

    if (weightKg) {
      updateData.weightKg = parseFloat(weightKg);
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    auditLog({
      action: "WAREHOUSE_RECEIVE_CN",
      actorId: user.id,
      actorEmail: user.email || "",
      actorRole: user.role,
      entityType: "order",
      entityId: order.id,
      entityCode: order.orderCode,
      details: { fromStatus: order.status, toStatus: "ARRIVED_CHINA_WH", weightKg },
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
          toStatus: "ARRIVED_CHINA_WH",
          channels: ["SYSTEM", "EMAIL", "TELEGRAM", "ZALO"],
        }),
      )
      .catch((err) => {
        console.error("[notify] warehouse china receive failed:", err);
      });

    return jsonResponse(updated);
  } catch (error) {
    console.error("[warehouse/china/receive] Error:", error);
    return errorResponse("Đã xảy ra lỗi hệ thống, vui lòng thử lại", 500);
  }
}
