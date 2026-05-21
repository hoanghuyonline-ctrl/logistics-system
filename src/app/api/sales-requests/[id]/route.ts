import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, generateOrderCode, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { calculateOrderCost } from "@/lib/cost-calculator";
import { onSalesRequestStatusChanged } from "@/lib/notifications";
import type { NextRequest } from "next/server";

const VALID_TRANSITIONS: Record<string, string[]> = {
  NEW: ["CONTACTED", "PRICE_CONFIRMED", "CANCELLED"],
  CONTACTED: ["PRICE_CONFIRMED", "CANCELLED"],
  PRICE_CONFIRMED: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["COMPLETED", "CANCELLED"],
};

export const PATCH = withErrorHandler(async function PATCH(req: NextRequest, ctx: RouteContext<"/api/sales-requests/[id]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "ACCOUNTANT"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const { status, confirmedPrice, adminNote } = body;

  const existing = await prisma.salesRequest.findUnique({ where: { id } });
  if (!existing) return errorResponse("Yêu cầu không tồn tại", 404);

  const data: Record<string, unknown> = {};

  if (status) {
    const allowed = VALID_TRANSITIONS[existing.status];
    if (!allowed || !allowed.includes(status)) {
      return errorResponse(`Không thể chuyển từ ${existing.status} sang ${status}`);
    }
    data.status = status;

    if (status === "PRICE_CONFIRMED" && confirmedPrice != null) {
      data.confirmedPrice = parseFloat(confirmedPrice);
      data.confirmedById = user.id;
      data.confirmedAt = new Date();
    }
  }

  if (confirmedPrice != null && !status) {
    if (existing.status !== "NEW" && existing.status !== "CONTACTED" && existing.status !== "PRICE_CONFIRMED") {
      return errorResponse("Chỉ có thể xác nhận giá khi trạng thái phù hợp");
    }
    data.confirmedPrice = parseFloat(confirmedPrice);
    data.confirmedById = user.id;
    data.confirmedAt = new Date();
    if (existing.status === "NEW" || existing.status === "CONTACTED") {
      data.status = "PRICE_CONFIRMED";
    }
  }

  if (adminNote !== undefined) data.adminNote = adminNote;

  // If transitioning to PROCESSING, auto-create a procurement Order
  if (data.status === "PROCESSING") {
    const configs = await prisma.systemConfig.findMany();
    const configMap: Record<string, string> = {};
    for (const c of configs) configMap[c.key] = c.value;

    const exchangeRate = parseFloat(configMap.exchange_rate || "3500");
    const serviceFeePercent = parseFloat(configMap.service_fee_percent || "5");
    const chinaShippingDefault = parseFloat(configMap.china_domestic_shipping_default || "50000");
    const intlRate = parseFloat(configMap.international_shipping_rate || "35000");
    const vnDeliveryDefault = parseFloat(configMap.vietnam_delivery_fee_default || "30000");

    const confirmedTotal = existing.confirmedPrice ? Number(existing.confirmedPrice) : 0;
    const unitPriceCNY = confirmedTotal > 0 ? confirmedTotal / existing.quantity / exchangeRate : 0;

    const cost = calculateOrderCost({
      unitPriceCNY,
      quantity: existing.quantity,
      exchangeRate,
      serviceFeePercent,
      chinaShippingFee: chinaShippingDefault,
      internationalShippingRate: intlRate,
      vietnamDeliveryFee: vnDeliveryDefault,
    });

    const orderTotalCost = cost.totalCostVND;

    const order = await prisma.order.create({
      data: {
        orderCode: generateOrderCode(),
        userId: existing.customerId,
        productName: existing.productName,
        productLink: `sales-request://${existing.requestCode}`,
        quantity: existing.quantity,
        unitPriceCNY,
        totalPriceCNY: cost.totalPriceCNY,
        exchangeRate,
        totalPriceVND: cost.totalPriceVND,
        serviceFeePercent,
        serviceFeeVND: cost.serviceFeeVND,
        chinaShippingFee: cost.chinaShippingFee,
        internationalShippingRate: intlRate,
        internationalShippingFee: cost.internationalShippingFee,
        vietnamDeliveryFee: cost.vietnamDeliveryFee,
        totalCostVND: orderTotalCost,
        notes: `Tự động tạo từ yêu cầu mua hàng ${existing.requestCode}`,
        statusLogs: {
          create: {
            toStatus: "PENDING",
            changedBy: user.id,
            note: `Đơn hàng tạo tự động từ Sales Request ${existing.requestCode}`,
          },
        },
      },
    });

    // Track debt: if order total exceeds what the customer already paid (confirmedPrice)
    if (orderTotalCost > confirmedTotal && confirmedTotal > 0) {
      const debtIncrease = orderTotalCost - confirmedTotal;
      await prisma.wallet.upsert({
        where: { userId: existing.customerId },
        update: { debt: { increment: debtIncrease } },
        create: { userId: existing.customerId, balance: 0, debt: debtIncrease },
      });
    }

    data.orderId = order.id;
  }

  // PAID → CANCELLED: refund wallet if originally paid from wallet
  if (data.status === "CANCELLED" && existing.status === "PAID" && existing.paidFromWallet && existing.confirmedPrice) {
    const refundAmount = parseFloat(existing.confirmedPrice.toString());
    const wallet = await prisma.wallet.findUnique({ where: { userId: existing.customerId } });
    const currentBalance = wallet ? parseFloat(wallet.balance.toString()) : 0;
    const newBalance = currentBalance + refundAmount;

    await prisma.$transaction([
      prisma.wallet.upsert({
        where: { userId: existing.customerId },
        update: { balance: newBalance },
        create: { userId: existing.customerId, balance: newBalance, debt: 0 },
      }),
      prisma.transaction.create({
        data: {
          userId: existing.customerId,
          type: "REFUND",
          amount: refundAmount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          description: `Hoàn tiền hủy đơn mua hàng ${existing.requestCode} — "${existing.productName}"`,
          createdBy: user.id,
        },
      }),
      prisma.salesRequest.update({
        where: { id },
        data,
      }),
    ]);

    const updated = await prisma.salesRequest.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, fullName: true, email: true } },
        product: { select: { id: true, name: true } },
        confirmedBy: { select: { id: true, fullName: true } },
        order: { select: { id: true, orderCode: true } },
      },
    });

    onSalesRequestStatusChanged({
      userId: existing.customerId,
      userEmail: updated?.customer?.email || undefined,
      userName: updated?.customer?.fullName || undefined,
      requestCode: existing.requestCode,
      productName: existing.productName,
      newStatus: "CANCELLED",
      channels: ["SYSTEM", "TELEGRAM"],
    }).catch(() => {});

    return jsonResponse(updated);
  }

  const updated = await prisma.salesRequest.update({
    where: { id },
    data,
    include: {
      customer: { select: { id: true, fullName: true, email: true } },
      product: { select: { id: true, name: true } },
      confirmedBy: { select: { id: true, fullName: true } },
      order: { select: { id: true, orderCode: true } },
    },
  });

  // Notify customer on status changes via SYSTEM + TELEGRAM (fire-and-forget)
  if (data.status) {
    onSalesRequestStatusChanged({
      userId: existing.customerId,
      userEmail: updated.customer?.email || undefined,
      userName: updated.customer?.fullName || undefined,
      requestCode: existing.requestCode,
      productName: existing.productName,
      newStatus: data.status as string,
      confirmedPrice: data.confirmedPrice != null ? parseFloat(String(data.confirmedPrice)) : undefined,
      channels: ["SYSTEM", "TELEGRAM"],
    }).catch(() => {});
  }

  return jsonResponse(updated);
});

const DELETABLE_STATUSES = ["NEW", "CANCELLED"];

export const DELETE = withErrorHandler(async function DELETE(req: NextRequest, ctx: RouteContext<"/api/sales-requests/[id]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;

  const existing = await prisma.salesRequest.findUnique({ where: { id } });
  if (!existing) return errorResponse("Yêu cầu không tồn tại", 404);

  if (!DELETABLE_STATUSES.includes(existing.status)) {
    return errorResponse("Chỉ có thể xóa yêu cầu ở trạng thái Mới hoặc Đã hủy");
  }

  await prisma.salesRequest.delete({ where: { id } });

  return jsonResponse({ success: true });
});
