import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { onWalletEvent } from "@/lib/notifications";

export const PATCH = withErrorHandler(async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "ACCOUNTANT"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await params;
  const body = await request.json();
  const { action } = body;

  const topUpRequest = await prisma.walletTopUpRequest.findUnique({
    where: { id },
  });

  if (!topUpRequest) {
    return errorResponse("Không tìm thấy yêu cầu nạp tiền", 404);
  }

  if (topUpRequest.status !== "PENDING") {
    return errorResponse("Yêu cầu này đã được xử lý", 409);
  }

  if (action === "confirm") {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: topUpRequest.customerId },
    });
    if (!wallet) return errorResponse("Không tìm thấy ví khách hàng", 404);

    const currentBalance = parseFloat(wallet.balance.toString());
    const depositAmount = parseFloat(topUpRequest.amount.toString());
    const currentDebt = parseFloat(wallet.debt.toString());

    let newBalance = currentBalance + depositAmount;
    let newDebt = currentDebt;

    if (currentDebt > 0) {
      if (depositAmount >= currentDebt) {
        newBalance = currentBalance + depositAmount - currentDebt;
        newDebt = 0;
      } else {
        newDebt = currentDebt - depositAmount;
        newBalance = currentBalance;
      }
    }

    await prisma.$transaction([
      prisma.wallet.update({
        where: { userId: topUpRequest.customerId },
        data: { balance: newBalance, debt: newDebt },
      }),
      prisma.transaction.create({
        data: {
          userId: topUpRequest.customerId,
          type: "DEPOSIT",
          amount: depositAmount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          description: `Nạp tiền qua QR — ${topUpRequest.transferReference}`,
          createdBy: user.id,
        },
      }),
      prisma.walletTopUpRequest.update({
        where: { id },
        data: {
          status: "CONFIRMED",
          confirmedBy: user.id,
          confirmedAt: new Date(),
        },
      }),
    ]);

    prisma.user
      .findUnique({
        where: { id: topUpRequest.customerId },
        select: { email: true, fullName: true },
      })
      .then((customer) =>
        onWalletEvent({
          userId: topUpRequest.customerId,
          userEmail: customer?.email,
          userName: customer?.fullName,
          title: "Nạp tiền thành công",
          message: `Chào ${customer?.fullName || "bạn"}, ví của bạn đã được nạp ${depositAmount.toLocaleString()} VND. Mã chuyển khoản: ${topUpRequest.transferReference}. Số dư hiện tại: ${newBalance.toLocaleString()} VND.`,
        })
      )
      .catch((err: unknown) => {
        console.error("[notify] topup confirm failed:", err);
      });

    return jsonResponse({ success: true, status: "CONFIRMED" });
  }

  if (action === "cancel") {
    await prisma.walletTopUpRequest.update({
      where: { id },
      data: { status: "CANCELLED", confirmedBy: user.id, confirmedAt: new Date() },
    });
    return jsonResponse({ success: true, status: "CANCELLED" });
  }

  return errorResponse("Hành động không hợp lệ (confirm hoặc cancel)");
});
