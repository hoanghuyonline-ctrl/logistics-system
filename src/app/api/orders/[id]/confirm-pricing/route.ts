import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import { auditLog } from "@/lib/audit";
import type { NextRequest } from "next/server";

export const PATCH = withErrorHandler(async function PATCH(req: NextRequest, ctx: RouteContext<"/api/orders/[id]/confirm-pricing">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "ACCOUNTANT"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const {
    confirmedProductCost, confirmedShippingCost, confirmedServiceFee, confirmedTotalCost,
    chinaShippingFee, internationalShippingFee, vietnamDeliveryFee,
  } = body;

  if (confirmedTotalCost == null || confirmedTotalCost < 0) {
    return errorResponse("Vui lòng nhập chi phí cuối cùng hợp lệ");
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return errorResponse("Order not found", 404);

  const data: Record<string, unknown> = {
    confirmedProductCost: confirmedProductCost != null ? parseFloat(confirmedProductCost) : null,
    confirmedShippingCost: confirmedShippingCost != null ? parseFloat(confirmedShippingCost) : null,
    confirmedServiceFee: confirmedServiceFee != null ? parseFloat(confirmedServiceFee) : null,
    confirmedTotalCost: parseFloat(confirmedTotalCost),
    confirmedAt: new Date(),
    confirmedById: user.id,
  };

  if (chinaShippingFee != null) data.chinaShippingFee = parseFloat(chinaShippingFee);
  if (internationalShippingFee != null) data.internationalShippingFee = parseFloat(internationalShippingFee);
  if (vietnamDeliveryFee != null) data.vietnamDeliveryFee = parseFloat(vietnamDeliveryFee);

  const updated = await prisma.order.update({ where: { id }, data });

  auditLog({
    action: "ORDER_PRICING_CONFIRMED",
    actorId: user.id,
    actorEmail: user.email || "",
    actorRole: user.role,
    entityType: "order",
    entityId: order.id,
    entityCode: order.orderCode,
    details: {
      confirmedProductCost,
      confirmedShippingCost,
      confirmedServiceFee,
      confirmedTotalCost,
      chinaShippingFee,
      internationalShippingFee,
      vietnamDeliveryFee,
      previousEstimate: order.totalCostVND.toString(),
    },
  });

  // Notify customer about confirmed pricing (fire-and-forget)
  const totalFormatted = parseFloat(confirmedTotalCost).toLocaleString("vi-VN");
  createNotification({
    userId: order.userId,
    title: "Giá đơn hàng đã được xác nhận",
    message: `Đơn hàng ${order.orderCode} đã được công ty xác nhận giá: ${totalFormatted} VND.`,
    orderId: order.id,
  }).catch((err) => {
    console.error("[confirm-pricing] Failed to notify customer:", err);
  });

  return jsonResponse(updated);
});
