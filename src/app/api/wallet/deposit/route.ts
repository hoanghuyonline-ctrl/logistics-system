import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "ACCOUNTANT"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { userId, amount, description } = body;

  if (!userId || !amount || amount <= 0) {
    return errorResponse("Valid userId and positive amount are required");
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) return errorResponse("Wallet not found", 404);

  const currentBalance = parseFloat(wallet.balance.toString());
  const depositAmount = parseFloat(amount);
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

  await prisma.wallet.update({
    where: { userId },
    data: { balance: newBalance, debt: newDebt },
  });

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      type: "DEPOSIT",
      amount: depositAmount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      description: description || "Nạp tiền vào ví",
      createdBy: user.id,
    },
  });

  await createNotification({
    userId,
    title: "Nạp tiền thành công",
    message: `Ví của bạn đã được nạp ${depositAmount.toLocaleString()} VND.`,
  });

  return jsonResponse(transaction, 201);
}
