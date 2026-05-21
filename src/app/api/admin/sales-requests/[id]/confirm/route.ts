import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { onSalesRequestStatusChanged } from "@/lib/notifications";
import type { NextRequest } from "next/server";

export const POST = withErrorHandler(async function POST(req: NextRequest, ctx: RouteContext<"/api/admin/sales-requests/[id]/confirm">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "ACCOUNTANT"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const { confirmedPrice } = body;

  if (confirmedPrice == null || parseFloat(confirmedPrice) <= 0) {
    return errorResponse("Giá xác nhận không hợp lệ");
  }

  const existing = await prisma.salesRequest.findUnique({ where: { id } });
  if (!existing) return errorResponse("Yêu cầu không tồn tại", 404);

  if (existing.status !== "NEW" && existing.status !== "CONTACTED") {
    return errorResponse("Chỉ có thể xác nhận giá khi trạng thái là Mới hoặc Đã liên hệ");
  }

  const updated = await prisma.salesRequest.update({
    where: { id },
    data: {
      confirmedPrice: parseFloat(confirmedPrice),
      confirmedById: user.id,
      confirmedAt: new Date(),
      status: "PRICE_CONFIRMED",
    },
    include: {
      customer: { select: { id: true, fullName: true, email: true } },
      product: { select: { id: true, name: true } },
      confirmedBy: { select: { id: true, fullName: true } },
    },
  });

  onSalesRequestStatusChanged({
    userId: existing.customerId,
    userEmail: updated.customer?.email || undefined,
    userName: updated.customer?.fullName || undefined,
    requestCode: existing.requestCode,
    productName: existing.productName,
    newStatus: "PRICE_CONFIRMED",
    confirmedPrice: parseFloat(confirmedPrice),
    channels: ["SYSTEM", "TELEGRAM"],
  }).catch(() => {});

  return jsonResponse(updated);
});
