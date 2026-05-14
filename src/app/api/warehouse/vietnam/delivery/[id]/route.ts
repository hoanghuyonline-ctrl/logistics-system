import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import { onShipmentStatusChanged } from "@/lib/notifications";
import { toShipmentStatus, isValidTransition } from "@/lib/shipment-status";
import { OrderStatus } from "@prisma/client";
import { auditLog } from "@/lib/audit";
import type { NextRequest } from "next/server";

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/warehouse/vietnam/delivery/[id]">) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasRole(user.role, ["ADMIN", "WAREHOUSE_VN"])) {
      return errorResponse("Bạn không có quyền thực hiện thao tác này", 403);
    }

    const { id } = await ctx.params;
    const body = await req.json();
    const { status, note } = body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return errorResponse("Không tìm thấy đơn hàng", 404);

    const fromShipment = toShipmentStatus(order.status);
    const toShipment = toShipmentStatus(status as OrderStatus);
    if (!isValidTransition(fromShipment, toShipment)) {
      return errorResponse("Không thể chuyển trạng thái đơn hàng hiện tại");
    }

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

    auditLog({
      action: "WAREHOUSE_DELIVERY",
      actorId: user.id,
      actorEmail: user.email || "",
      actorRole: user.role,
      entityType: "order",
      entityId: order.id,
      entityCode: order.orderCode,
      details: { fromStatus: order.status, toStatus: status },
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
          toStatus: status,
          channels: ["SYSTEM", "EMAIL", "TELEGRAM", "ZALO"],
        }),
      )
      .catch((err) => {
        console.error("[notify] warehouse delivery failed:", err);
      });

    return jsonResponse(updated);
  } catch (error) {
    console.error("[warehouse/vietnam/delivery] Error:", error);
    return errorResponse("Đã xảy ra lỗi hệ thống, vui lòng thử lại", 500);
  }
}
