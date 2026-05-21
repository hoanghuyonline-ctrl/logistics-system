export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

export const POST = withErrorHandler(async function POST(req: NextRequest, ctx: RouteContext<"/api/users/[id]/adjust-wallet">) {
  const admin = await getCurrentUser();
  if (!admin || !hasRole(admin.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const { action, amount, reason } = body as { action: string; amount: number; reason: string };

  if (!action || !["ADD", "DEDUCT"].includes(action)) {
    return errorResponse("Hành động không hợp lệ. Chỉ chấp nhận 'ADD' hoặc 'DEDUCT'.", 400);
  }
  if (!amount || amount <= 0) {
    return errorResponse("Số tiền phải lớn hơn 0.", 400);
  }
  if (!reason || !reason.trim()) {
    return errorResponse("Lý do điều chỉnh là bắt buộc.", 400);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: id } });
      if (!wallet) {
        throw new Error("NOT_FOUND");
      }

      const currentBalance = parseFloat(wallet.balance.toString());
      let newBalance: number;

      if (action === "ADD") {
        newBalance = currentBalance + amount;
      } else {
        if (currentBalance < amount) {
          throw new Error("INSUFFICIENT");
        }
        newBalance = currentBalance - amount;
      }

      const updatedWallet = await tx.wallet.update({
        where: { userId: id },
        data: { balance: newBalance },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId: id,
          type: action === "ADD" ? "MANUAL_ADD" : "MANUAL_DEDUCT",
          amount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          description: action === "ADD"
            ? `Admin cộng tiền tay: ${reason.trim()}`
            : `Admin trừ tiền tay: ${reason.trim()}`,
          createdBy: admin.id,
        },
      });

      return { wallet: updatedWallet, transaction };
    });

    return jsonResponse({
      success: true,
      balance: result.wallet.balance,
      transactionId: result.transaction.id,
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "NOT_FOUND") {
        return errorResponse("Không tìm thấy ví của người dùng này.", 404);
      }
      if (err.message === "INSUFFICIENT") {
        return errorResponse("Số dư ví không đủ để thực hiện lệnh trừ tiền này.", 400);
      }
    }
    throw err;
  }
});
