import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { userId, amount, description } = body;

  if (!userId || amount === undefined) {
    return errorResponse("userId and amount are required");
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) return errorResponse("Wallet not found", 404);

  const currentBalance = parseFloat(wallet.balance.toString());
  const adjustAmount = parseFloat(amount);
  const newBalance = currentBalance + adjustAmount;

  await prisma.wallet.update({
    where: { userId },
    data: { balance: newBalance < 0 ? 0 : newBalance },
  });

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      type: "ADJUSTMENT",
      amount: adjustAmount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance < 0 ? 0 : newBalance,
      description: description || "Manual adjustment",
      createdBy: user.id,
    },
  });

  return jsonResponse(transaction, 201);
}
