import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { createNotification, onSalesRequestStatusChanged } from "@/lib/notifications";
import type { NextRequest } from "next/server";

export const POST = withErrorHandler(async function POST(req: NextRequest, ctx: RouteContext<"/api/sales-requests/[id]/cod">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["CUSTOMER"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;

  const salesRequest = await prisma.salesRequest.findUnique({ where: { id } });
  if (!salesRequest) return errorResponse("Yêu cầu không tồn tại", 404);
  if (salesRequest.customerId !== user.id) return errorResponse("Forbidden", 403);
  if (salesRequest.status !== "PRICE_CONFIRMED") {
    return errorResponse("Chỉ có thể chọn phương thức thanh toán khi giá đã được xác nhận");
  }
  if (!salesRequest.confirmedPrice) {
    return errorResponse("Giá chưa được xác nhận");
  }

  // Verify shipping address exists
  const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: { address: true } });
  if (!fullUser?.address || !fullUser.address.trim()) {
    return errorResponse("Vui lòng cập nhật địa chỉ giao hàng tại Việt Nam trong trang hồ sơ trước khi chọn thanh toán COD.", 400);
  }

  // Update sales request: mark as PAID with COD method, no wallet deduction
  await prisma.salesRequest.update({
    where: { id },
    data: {
      status: "PAID",
      paidAt: new Date(),
      paidFromWallet: false,
      paymentMethod: "COD",
    },
  });

  // Notify admins (fire-and-forget)
  const payAmount = parseFloat(salesRequest.confirmedPrice.toString());
  prisma.user.findMany({ where: { role: "ADMIN" } }).then((admins) => {
    const amountFormatted = payAmount.toLocaleString("vi-VN");
    for (const admin of admins) {
      createNotification({
        userId: admin.id,
        title: "Khách hàng chọn thanh toán COD",
        message: `${salesRequest.requestCode} — "${salesRequest.productName}" sẽ thanh toán ${amountFormatted} VND tiền mặt khi nhận hàng.`,
      }).catch(() => {});
    }
  }).catch(() => {});

  // Notify customer (fire-and-forget)
  onSalesRequestStatusChanged({
    userId: user.id,
    userEmail: user.email || undefined,
    userName: user.name || undefined,
    requestCode: salesRequest.requestCode,
    productName: salesRequest.productName,
    newStatus: "PAID",
    amountPaid: payAmount,
    channels: ["SYSTEM", "TELEGRAM"],
  }).catch(() => {});

  return jsonResponse({
    success: true,
    requestCode: salesRequest.requestCode,
    paymentMethod: "COD",
  });
});
