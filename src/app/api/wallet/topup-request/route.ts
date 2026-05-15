import { prisma } from "@/lib/prisma";
import { getCurrentUser, jsonResponse, errorResponse } from "@/lib/utils";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  const { amount, transferReference, bankName, bankAccount, accountHolder } = body;

  if (!amount || amount <= 0) {
    return errorResponse("Số tiền phải lớn hơn 0");
  }
  if (!transferReference || !bankName || !bankAccount || !accountHolder) {
    return errorResponse("Thiếu thông tin chuyển khoản");
  }

  const existing = await prisma.walletTopUpRequest.findFirst({
    where: { transferReference, status: "PENDING" },
  });
  if (existing) {
    return errorResponse("Yêu cầu nạp tiền với mã này đã tồn tại", 409);
  }

  const record = await prisma.walletTopUpRequest.create({
    data: {
      customerId: user.id,
      amount: parseFloat(amount),
      transferReference,
      bankName,
      bankAccount,
      accountHolder,
      status: "PENDING",
    },
  });

  return jsonResponse(record, 201);
}
