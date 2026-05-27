import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { onPricingConfirmed } from "@/lib/notifications";
import { auditLog } from "@/lib/audit";
import type { NextRequest } from "next/server";

export const PATCH = withErrorHandler(async function PATCH(req: NextRequest, ctx: RouteContext<"/api/orders/[id]/approve-pricing">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const { action } = body; // "approve" or "reject"

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return errorResponse("Order not found", 404);

  if (!order.isPricingPendingApproval) {
    return errorResponse("No pending pricing approval for this order", 400);
  }

  if (action === "approve") {
    const updated = await prisma.order.update({
      where: { id },
      data: {
        isPricingPendingApproval: false,
        confirmedAt: new Date(),
        confirmedById: user.id,
      },
    });

    auditLog({
      action: "ADMIN_PRICING_APPROVED",
      actorId: user.id,
      actorEmail: user.email || "",
      actorRole: user.role,
      entityType: "order",
      entityId: order.id,
      entityCode: order.orderCode,
      details: {
        confirmedTotalCost: order.confirmedTotalCost?.toString(),
        staffSubmitterId: order.pricingSubmittedByStaffId,
      },
    });

    // Notify customer about confirmed pricing via all channels
    const orderUser = await prisma.user.findUnique({
      where: { id: order.userId },
      select: { email: true, fullName: true },
    });
    onPricingConfirmed({
      userId: order.userId,
      userEmail: orderUser?.email ?? undefined,
      userName: orderUser?.fullName ?? undefined,
      orderId: order.id,
      orderCode: order.orderCode,
      productName: order.productName || undefined,
      confirmedProductCost: order.confirmedProductCost ? Number(order.confirmedProductCost) : undefined,
      confirmedShippingCost: order.confirmedShippingCost ? Number(order.confirmedShippingCost) : undefined,
      confirmedServiceFee: order.confirmedServiceFee ? Number(order.confirmedServiceFee) : undefined,
      confirmedTotalCost: Number(order.confirmedTotalCost),
      channels: ["SYSTEM", "EMAIL", "TELEGRAM", "ZALO"],
    }).catch((err) => {
      console.error("[approve-pricing] Failed to notify customer:", err);
    });

    return jsonResponse(updated);
  } else if (action === "reject") {
    const updated = await prisma.order.update({
      where: { id },
      data: {
        isPricingPendingApproval: false,
        confirmedProductCost: null,
        confirmedShippingCost: null,
        confirmedServiceFee: null,
        confirmedTotalCost: null,
        confirmedAt: null,
        confirmedById: null,
        staffSubmittedPricingAt: null,
        pricingSubmittedByStaffId: null,
      },
    });

    auditLog({
      action: "ADMIN_PRICING_REJECTED",
      actorId: user.id,
      actorEmail: user.email || "",
      actorRole: user.role,
      entityType: "order",
      entityId: order.id,
      entityCode: order.orderCode,
      details: {
        rejectedTotal: order.confirmedTotalCost?.toString(),
        staffSubmitterId: order.pricingSubmittedByStaffId,
      },
    });

    return jsonResponse(updated);
  }

  return errorResponse("Invalid action. Use 'approve' or 'reject'.", 400);
});
