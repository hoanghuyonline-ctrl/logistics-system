import { prisma } from "@/lib/prisma";
import { getCurrentUser, jsonResponse, errorResponse } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const pending = await prisma.walletTopUpRequest.findFirst({
    where: { customerId: user.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  return jsonResponse(pending);
}

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
    where: { customerId: user.id, status: "PENDING" },
  });
  if (existing) {
    return jsonResponse(existing, 200);
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

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const pending = await prisma.walletTopUpRequest.findFirst({
    where: { customerId: user.id, status: "PENDING" },
  });

  if (!pending) {
    return errorResponse("Không có yêu cầu nạp tiền chờ xác nhận", 404);
  }

  await prisma.walletTopUpRequest.update({
    where: { id: pending.id },
    data: { status: "CANCELLED" },
  });

  return jsonResponse({ success: true });
}
