export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, generateOrderCode, jsonResponse, errorResponse } from "@/lib/utils";
import { calculateOrderCost } from "@/lib/cost-calculator";
import { createNotification } from "@/lib/notifications";
import { onOrderCreated } from "@/lib/notifications/triggers";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");
  const filter = url.searchParams.get("filter");

  const where: Record<string, unknown> = {};

  if (hasRole(user.role, ["CUSTOMER"])) {
    where.userId = user.id;
  }

  if (status) where.status = status;

  if (filter && !hasRole(user.role, ["CUSTOMER"])) {
    switch (filter) {
      case "hasNotes":
        where.orderNotes = { some: {} };
        break;
      case "hasCustomNote":
        where.customStatusNote = { not: null };
        break;
      case "longPending":
        where.status = "PENDING";
        where.createdAt = { lte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) };
        break;
      case "cancelled":
        where.status = "CANCELLED";
        break;
      case "today":
        where.createdAt = { gte: new Date(new Date().setHours(0, 0, 0, 0)) };
        break;
      case "notCompleted":
        where.status = { notIn: ["COMPLETED", "CANCELLED"] };
        break;
    }
  }
  if (search) {
    const searchConditions: Record<string, unknown>[] = [
      { orderCode: { contains: search, mode: "insensitive" } },
      { productName: { contains: search, mode: "insensitive" } },
    ];
    if (!hasRole(user.role, ["CUSTOMER"])) {
      searchConditions.push(
        { package: { packageCode: { contains: search, mode: "insensitive" } } },
        { package: { barcode: { contains: search, mode: "insensitive" } } },
        { user: { phone: { contains: search, mode: "insensitive" } } },
      );
    }
    where.OR = searchConditions;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        orderNotes: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return jsonResponse({ orders, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["CUSTOMER", "ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { productName, productLink, quantity, unitPriceCNY, notes, productImage } = body;

  if (!productName || !productLink || !quantity || !unitPriceCNY) {
    return errorResponse("Missing required fields");
  }

  const configs = await prisma.systemConfig.findMany();
  const configMap: Record<string, string> = {};
  for (const c of configs) configMap[c.key] = c.value;

  const exchangeRate = parseFloat(configMap.exchange_rate || "3500");
  const serviceFeePercent = parseFloat(configMap.service_fee_percent || "5");
  const chinaShippingDefault = parseFloat(configMap.china_domestic_shipping_default || "50000");
  const intlRate = parseFloat(configMap.international_shipping_rate || "35000");
  const vnDeliveryDefault = parseFloat(configMap.vietnam_delivery_fee_default || "30000");

  const cost = calculateOrderCost({
    unitPriceCNY: parseFloat(unitPriceCNY),
    quantity: parseInt(quantity),
    exchangeRate,
    serviceFeePercent,
    chinaShippingFee: chinaShippingDefault,
    internationalShippingRate: intlRate,
    vietnamDeliveryFee: vnDeliveryDefault,
  });

  const customerId = hasRole(user.role, ["ADMIN"]) && body.userId ? body.userId : user.id;

  const wallet = await prisma.wallet.findUnique({ where: { userId: customerId } });
  if (!wallet) return errorResponse("Wallet not found", 404);

  const estimatedCost = parseFloat(cost.totalCostVND.toString());
  if (parseFloat(wallet.balance.toString()) < estimatedCost) {
    return errorResponse("Số dư ví không đủ. Vui lòng nạp thêm tiền trước khi đặt hàng.");
  }

  const order = await prisma.order.create({
    data: {
      orderCode: generateOrderCode(),
      userId: customerId,
      productName,
      productLink,
      productImage,
      quantity: parseInt(quantity),
      unitPriceCNY: parseFloat(unitPriceCNY),
      totalPriceCNY: cost.totalPriceCNY,
      exchangeRate,
      totalPriceVND: cost.totalPriceVND,
      serviceFeePercent,
      serviceFeeVND: cost.serviceFeeVND,
      chinaShippingFee: cost.chinaShippingFee,
      internationalShippingRate: intlRate,
      internationalShippingFee: cost.internationalShippingFee,
      vietnamDeliveryFee: cost.vietnamDeliveryFee,
      totalCostVND: cost.totalCostVND,
      notes,
      statusLogs: {
        create: {
          toStatus: "PENDING",
          changedBy: user.id,
          note: "Đơn hàng đã được tạo",
        },
      },
    },
    include: { user: { select: { id: true, fullName: true, email: true } } },
  });

  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      title: "Đơn hàng mới",
      message: `Đơn hàng ${order.orderCode} được tạo bởi ${order.user.fullName}.`,
      orderId: order.id,
    });
  }

  onOrderCreated({
    userId: order.userId,
    userEmail: order.user.email,
    userName: order.user.fullName,
    orderId: order.id,
    orderCode: order.orderCode,
    channels: ["SYSTEM", "TELEGRAM"],
  }).catch((err) => {
    console.error("[notifications] onOrderCreated failed:", err);
  });

  return jsonResponse(order, 201);
}
