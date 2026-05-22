import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { createNotification, onSalesRequestStatusChanged } from "@/lib/notifications";
import type { NextRequest } from "next/server";

export const POST = withErrorHandler(async function POST(req: NextRequest, ctx: RouteContext<"/api/sales-requests/[id]/pay">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["CUSTOMER"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;

  const salesRequest = await prisma.salesRequest.findUnique({ where: { id } });
  if (!salesRequest) return errorResponse("Yêu cầu không tồn tại", 404);
  if (salesRequest.customerId !== user.id) return errorResponse("Forbidden", 403);
  if (salesRequest.status !== "PRICE_CONFIRMED") {
    return errorResponse("Chỉ có thể thanh toán khi giá đã được xác nhận");
  }
  if (!salesRequest.confirmedPrice) {
    return errorResponse("Giá chưa được xác nhận");
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
  if (!wallet) return errorResponse("Ví không tồn tại", 404);

  const payAmount = parseFloat(salesRequest.confirmedPrice.toString());
  const currentBalance = parseFloat(wallet.balance.toString());
  const currentDebt = parseFloat(wallet.debt.toString());

  if (currentBalance < payAmount) {
    return errorResponse("Số dư tài khoản không đủ. Vui lòng nạp thêm tiền vào ví.", 400);
  }

  const newBalance = currentBalance - payAmount;
  const newDebt = currentDebt;

  // Update wallet, create transaction, update sales request — all in one transaction
  await prisma.$transaction([
    prisma.wallet.update({
      where: { userId: user.id },
      data: { balance: newBalance, debt: newDebt },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        type: "SALES_PAYMENT",
        amount: payAmount,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: `Thanh toán mua hàng ${salesRequest.requestCode} — "${salesRequest.productName}"`,
        createdBy: user.id,
      },
    }),
    prisma.salesRequest.update({
      where: { id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paidFromWallet: true,
      },
    }),
  ]);

  // Await all notifications so PM2/Windows doesn't kill the process before email finishes
  await Promise.allSettled([
    // Notify admins
    prisma.user.findMany({ where: { role: "ADMIN" } }).then(async (admins) => {
      const amountFormatted = payAmount.toLocaleString("vi-VN");
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          title: "Khách hàng đã thanh toán",
          message: `${salesRequest.requestCode} — "${salesRequest.productName}" đã được thanh toán ${amountFormatted} VND từ ví.`,
        }).catch(() => {});
      }
    }),
    // Notify customer via all channels including EMAIL
    onSalesRequestStatusChanged({
      userId: user.id,
      userEmail: user.email || undefined,
      userName: user.name || "bạn",
      requestCode: salesRequest.requestCode,
      productName: salesRequest.productName || "Sản phẩm",
      newStatus: "PAID",
      amountPaid: payAmount || 0,
      walletBalance: newBalance,
      walletDebt: newDebt,
      channels: ["SYSTEM", "EMAIL", "TELEGRAM", "ZALO"],
    }),
  ]).catch(() => {});

  return jsonResponse({
    success: true,
    requestCode: salesRequest.requestCode,
    amountPaid: payAmount,
    walletBalance: newBalance,
    walletDebt: newDebt,
    usedDebt: newDebt > currentDebt,
  });
});
