import { prisma } from "@/lib/prisma";
import { getCurrentUser, jsonResponse, errorResponse } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

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

  // Notify all admins and accountants about new deposit request (fire-and-forget)
  prisma.user
    .findMany({ where: { role: { in: ["ADMIN", "ACCOUNTANT"] }, isActive: true } })
    .then((staff) => {
      const amountFormatted = parseFloat(amount).toLocaleString("vi-VN");
      for (const s of staff) {
        createNotification({
          userId: s.id,
          title: "Yêu cầu nạp tiền mới",
          message: `Khách hàng ${user.fullName || user.email} yêu cầu nạp ${amountFormatted} VND. Mã tham chiếu: ${transferReference}.`,
        }).catch((err) => {
          console.error("[topup-request] Failed to notify staff:", err);
        });
      }
    })
    .catch((err) => {
      console.error("[topup-request] Failed to fetch staff for notification:", err);
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
