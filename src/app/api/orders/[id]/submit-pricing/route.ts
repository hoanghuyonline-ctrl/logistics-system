import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { onStaffPricingSubmitted } from "@/lib/notifications";
import { auditLog } from "@/lib/audit";
import type { NextRequest } from "next/server";

export const PATCH = withErrorHandler(async function PATCH(req: NextRequest, ctx: RouteContext<"/api/orders/[id]/submit-pricing">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["STAFF"])) {
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
    isPricingPendingApproval: true,
    staffSubmittedPricingAt: new Date(),
    pricingSubmittedByStaffId: user.id,
  };

  if (chinaShippingFee != null) data.chinaShippingFee = parseFloat(chinaShippingFee);
  if (internationalShippingFee != null) data.internationalShippingFee = parseFloat(internationalShippingFee);
  if (vietnamDeliveryFee != null) data.vietnamDeliveryFee = parseFloat(vietnamDeliveryFee);

  const updated = await prisma.order.update({ where: { id }, data });

  auditLog({
    action: "STAFF_PRICING_SUBMITTED",
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
    },
  });

  // Notify all admins about the pending pricing approval
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true, email: true, fullName: true },
  });

  for (const admin of admins) {
    onStaffPricingSubmitted({
      userId: admin.id,
      userEmail: admin.email ?? undefined,
      userName: admin.fullName ?? undefined,
      staffName: user.name || user.email || "Nhân viên",
      orderId: order.id,
      orderCode: order.orderCode,
      confirmedTotalCost: parseFloat(confirmedTotalCost),
      channels: ["SYSTEM", "EMAIL", "TELEGRAM"],
    }).catch((err) => {
      console.error("[submit-pricing] Failed to notify admin:", err);
    });
  }

  return jsonResponse(updated);
});
