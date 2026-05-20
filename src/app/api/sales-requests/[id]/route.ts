import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { onSalesRequestStatusChanged } from "@/lib/notifications";
import type { NextRequest } from "next/server";

const VALID_TRANSITIONS: Record<string, string[]> = {
  NEW: ["CONTACTED", "PRICE_CONFIRMED", "CANCELLED"],
  CONTACTED: ["PRICE_CONFIRMED", "CANCELLED"],
  PRICE_CONFIRMED: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["COMPLETED", "CANCELLED"],
};

export const PATCH = withErrorHandler(async function PATCH(req: NextRequest, ctx: RouteContext<"/api/sales-requests/[id]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "ACCOUNTANT"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const { status, confirmedPrice, adminNote } = body;

  const existing = await prisma.salesRequest.findUnique({ where: { id } });
  if (!existing) return errorResponse("Yêu cầu không tồn tại", 404);

  const data: Record<string, unknown> = {};

  if (status) {
    const allowed = VALID_TRANSITIONS[existing.status];
    if (!allowed || !allowed.includes(status)) {
      return errorResponse(`Không thể chuyển từ ${existing.status} sang ${status}`);
    }
    data.status = status;

    if (status === "PRICE_CONFIRMED" && confirmedPrice != null) {
      data.confirmedPrice = parseFloat(confirmedPrice);
      data.confirmedById = user.id;
      data.confirmedAt = new Date();
    }
  }

  if (confirmedPrice != null && !status) {
    if (existing.status !== "NEW" && existing.status !== "CONTACTED" && existing.status !== "PRICE_CONFIRMED") {
      return errorResponse("Chỉ có thể xác nhận giá khi trạng thái phù hợp");
    }
    data.confirmedPrice = parseFloat(confirmedPrice);
    data.confirmedById = user.id;
    data.confirmedAt = new Date();
    if (existing.status === "NEW" || existing.status === "CONTACTED") {
      data.status = "PRICE_CONFIRMED";
    }
  }

  if (adminNote !== undefined) data.adminNote = adminNote;

  const updated = await prisma.salesRequest.update({
    where: { id },
    data,
    include: {
      customer: { select: { id: true, fullName: true, email: true } },
      product: { select: { id: true, name: true } },
      confirmedBy: { select: { id: true, fullName: true } },
    },
  });

  // Notify customer on status changes via SYSTEM + TELEGRAM (fire-and-forget)
  if (data.status) {
    onSalesRequestStatusChanged({
      userId: existing.customerId,
      userEmail: updated.customer?.email || undefined,
      userName: updated.customer?.fullName || undefined,
      requestCode: existing.requestCode,
      productName: existing.productName,
      newStatus: data.status as string,
      confirmedPrice: data.confirmedPrice != null ? parseFloat(String(data.confirmedPrice)) : undefined,
      channels: ["SYSTEM", "TELEGRAM"],
    }).catch(() => {});
  }

  return jsonResponse(updated);
});
