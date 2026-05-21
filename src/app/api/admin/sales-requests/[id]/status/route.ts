import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { onSalesRequestStatusChanged } from "@/lib/notifications";
import type { NextRequest } from "next/server";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PAID: ["PROCESSING"],
  PROCESSING: ["COMPLETED"],
};

export const PATCH = withErrorHandler(async function PATCH(req: NextRequest, ctx: RouteContext<"/api/admin/sales-requests/[id]/status">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "ACCOUNTANT"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const { status } = body;

  if (!status) return errorResponse("Trạng thái mới là bắt buộc");

  const existing = await prisma.salesRequest.findUnique({ where: { id } });
  if (!existing) return errorResponse("Yêu cầu không tồn tại", 404);

  const allowed = VALID_TRANSITIONS[existing.status];
  if (!allowed || !allowed.includes(status)) {
    return errorResponse(`Không thể chuyển từ ${existing.status} sang ${status}`);
  }

  const updated = await prisma.salesRequest.update({
    where: { id },
    data: { status },
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
    newStatus: status,
    channels: ["SYSTEM", "TELEGRAM"],
  }).catch(() => {});

  return jsonResponse(updated);
});
