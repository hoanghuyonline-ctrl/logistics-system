export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, generateOrderCode, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { calculateOrderCost } from "@/lib/cost-calculator";
import { createNotification } from "@/lib/notifications";
import { onOrderCreated } from "@/lib/notifications/triggers";

export const GET = withErrorHandler(async function GET(request: Request) {
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
      case "urgent":
        where.priority = "URGENT";
        break;
    }
  }
  if (search) {
    const searchConditions: Record<string, unknown>[] = [
      { orderCode: { contains: search, mode: "insensitive" } },
      { productName: { contains: search, mode: "insensitive" } },
    ];
    searchConditions.push(
      { consignmentTrackingNumber: { contains: search, mode: "insensitive" } },
    );
    if (!hasRole(user.role, ["CUSTOMER"])) {
      searchConditions.push(
        { package: { packageCode: { contains: search, mode: "insensitive" } } },
        { package: { barcode: { contains: search, mode: "insensitive" } } },
        { user: { phone: { contains: search, mode: "insensitive" } } },
      );
    }
    where.OR = searchConditions;
  }

  const includeSummary = url.searchParams.get("summary") === "1" && !hasRole(user.role, ["CUSTOMER"]);

  const baseWhere: Record<string, unknown> = {};
  if (hasRole(user.role, ["CUSTOMER"])) baseWhere.userId = user.id;

  const isAdminOrAccountant = hasRole(user.role, ["ADMIN", "ACCOUNTANT"]);

  const [orders, total, ...extra] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        package: isAdminOrAccountant ? { select: { totalWeightKg: true, barcode: true } } : undefined,
        orderNotes: {
          orderBy: { createdAt: "desc" as const },
          take: 1,
          select: { content: true, createdAt: true, user: { select: { fullName: true, role: true } } },
        },
        statusLogs: {
          orderBy: { createdAt: "desc" as const },
          take: 1,
          select: { createdAt: true, toStatus: true, changer: { select: { fullName: true, role: true } } },
        },
      },
    }),
    prisma.order.count({ where }),
    ...(includeSummary
      ? [
          prisma.order.groupBy({ by: ["status"], where: baseWhere, _count: { status: true } }),
          prisma.order.count({ where: { ...baseWhere, priority: "URGENT" } }),
        ]
      : []),
  ]);

  const response: Record<string, unknown> = { orders, total, page, totalPages: Math.ceil(total / limit) };

  if (includeSummary && extra.length >= 2) {
    const statusCounts = (extra[0] as Array<{ status: string; _count: { status: number } }>)
      .reduce((acc, g) => { acc[g.status] = g._count.status; return acc; }, {} as Record<string, number>);
    response.summary = { statusCounts, urgentCount: extra[1] as number };
  }

  return jsonResponse(response);
});

export const POST = withErrorHandler(async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["CUSTOMER", "ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const orderType = body.orderType || "ECOMMERCE";

  if (!["ECOMMERCE", "ENTRUST", "CONSIGNMENT"].includes(orderType)) {
    return errorResponse("Invalid order type");
  }

  // Type-specific validation
  if (orderType === "ECOMMERCE") {
    const { productName, quantity, unitPriceCNY } = body;
    if (!productName || !quantity || !unitPriceCNY) {
      return errorResponse("Missing required fields");
    }
  } else if (orderType === "ENTRUST") {
    const { itemName, weight } = body;
    if (!itemName || !weight) {
      return errorResponse("Missing required fields for entrust order");
    }
  } else if (orderType === "CONSIGNMENT") {
    const { consignmentTrackingNumber, consignmentItems } = body;
    if (!consignmentTrackingNumber) {
      return errorResponse("Missing required fields for consignment order");
    }
    if (Array.isArray(consignmentItems) && consignmentItems.length > 0) {
      for (const item of consignmentItems) {
        if (!item.productName || !item.quantity || !item.unitPriceCNY) {
          return errorResponse("Mỗi sản phẩm ký gửi phải có tên, số lượng và đơn giá");
        }
      }
    }
  }

  const configs = await prisma.systemConfig.findMany();
  const configMap: Record<string, string> = {};
  for (const c of configs) configMap[c.key] = c.value;

  const exchangeRate = parseFloat(configMap.exchange_rate || "3500");
  const serviceFeePercent = parseFloat(configMap.service_fee_percent || "5");
  const chinaShippingDefault = parseFloat(configMap.china_domestic_shipping_default || "50000");
  const intlRate = parseFloat(configMap.international_shipping_rate || "35000");
  const vnDeliveryDefault = parseFloat(configMap.vietnam_delivery_fee_default || "30000");

  // For non-ecommerce orders, use zero pricing (admin confirms costs later)
  let unitPrice = orderType === "ECOMMERCE" ? parseFloat(body.unitPriceCNY) : 0;
  let qty = orderType === "ECOMMERCE" ? parseInt(body.quantity) : 1;

  // Consignment items: compute totals from items array
  if (orderType === "CONSIGNMENT" && Array.isArray(body.consignmentItems) && body.consignmentItems.length > 0) {
    qty = body.consignmentItems.reduce((sum: number, item: { quantity?: string }) => sum + parseInt(item.quantity || "1"), 0);
    const totalCNY = body.consignmentItems.reduce((sum: number, item: { unitPriceCNY?: string; quantity?: string }) =>
      sum + parseFloat(item.unitPriceCNY || "0") * parseInt(item.quantity || "1"), 0);
    unitPrice = qty > 0 ? totalCNY / qty : 0;
  }

  const cost = calculateOrderCost({
    unitPriceCNY: unitPrice,
    quantity: qty,
    exchangeRate,
    serviceFeePercent,
    chinaShippingFee: orderType === "ECOMMERCE" ? chinaShippingDefault : 0,
    internationalShippingRate: intlRate,
    vietnamDeliveryFee: orderType === "ECOMMERCE" ? vnDeliveryDefault : 0,
  });

  const customerId = hasRole(user.role, ["ADMIN"]) && body.userId ? body.userId : user.id;

  const wallet = await prisma.wallet.findUnique({ where: { userId: customerId } });
  if (!wallet) return errorResponse("Wallet not found", 404);

  // Build product name based on order type
  let productName: string;
  if (orderType === "ECOMMERCE") {
    productName = body.productName;
  } else if (orderType === "ENTRUST") {
    productName = body.itemName;
  } else {
    productName = body.productName || body.consignmentTrackingNumber;
  }

  const order = await prisma.order.create({
    data: {
      orderCode: generateOrderCode(),
      userId: customerId,
      orderType,
      productName,
      productLink: body.productLink || "",
      productImage: body.productImage,
      productSpecs: orderType === "CONSIGNMENT" && Array.isArray(body.consignmentItems)
        ? JSON.stringify(body.consignmentItems)
        : (body.productSpecs || null),
      quantity: qty,
      unitPriceCNY: unitPrice,
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
      notes: body.notes,
      // Entrust-specific fields
      weightKg: body.weight ? parseFloat(body.weight) : null,
      volume: body.volume ? parseFloat(body.volume) : null,
      requiresVat: body.requiresVat === true,
      taxCode: body.taxCode || null,
      companyName: body.companyName || null,
      companyAddress: body.companyAddress || null,
      // Enhanced entrust fields
      entrustShipmentType: body.entrustShipmentType || null,
      entrustServices: body.entrustServices ? JSON.stringify(body.entrustServices) : null,
      cargoValueCurrency: body.cargoValueCurrency || null,
      cargoValueAmount: body.cargoValueAmount ? parseFloat(body.cargoValueAmount) : null,
      cargoValueVND: body.cargoValueVND ? parseFloat(body.cargoValueVND) : null,
      dimensionLength: body.dimensionLength ? parseFloat(body.dimensionLength) : null,
      dimensionWidth: body.dimensionWidth ? parseFloat(body.dimensionWidth) : null,
      dimensionHeight: body.dimensionHeight ? parseFloat(body.dimensionHeight) : null,
      cbm: body.cbm ? parseFloat(body.cbm) : null,
      entrustQuantity: body.entrustQuantity ? parseInt(body.entrustQuantity) : null,
      waybillCode: body.waybillCode || null,
      waybillImages: body.waybillImages ? JSON.stringify(body.waybillImages) : null,
      relatedDocuments: body.relatedDocuments ? JSON.stringify(body.relatedDocuments) : null,
      cnTruckPlate: body.cnTruckPlate || null,
      cnDriverName: body.cnDriverName || null,
      cnDriverPhone: body.cnDriverPhone || null,
      cnTruckImages: body.cnTruckImages ? JSON.stringify(body.cnTruckImages) : null,
      // China warehouse selection
      chinaWarehouseId: body.chinaWarehouseId || null,
      // Consignment-specific fields
      consignmentTrackingNumber: body.consignmentTrackingNumber || null,
      consignmentNotes: body.consignmentNotes || null,
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

  // Await all notifications so PM2/Windows doesn't kill the process before email finishes
  await Promise.allSettled([
    // Notify admins
    (async () => {
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          title: "Đơn hàng mới",
          message: `Đơn hàng ${order.orderCode} được tạo bởi ${order.user.fullName}.`,
          orderId: order.id,
        });
      }
    })(),
    // Notify customer via all channels including EMAIL
    onOrderCreated({
      userId: order.userId,
      userEmail: order.user.email || undefined,
      userName: order.user.fullName || "bạn",
      orderId: order.id,
      orderCode: order.orderCode,
      productName: order.productName || "Sản phẩm",
      quantity: order.quantity || 1,
      unitPriceCNY: parseFloat(String(order.unitPriceCNY)) || 0,
      exchangeRate: parseFloat(String(order.exchangeRate)) || 3500,
      totalCostVND: parseFloat(String(order.totalCostVND)) || 0,
      channels: ["SYSTEM", "EMAIL", "TELEGRAM", "ZALO"],
    }),
  ]).catch((err) => {
    console.error("[notifications] order creation notifications failed:", err);
  });

  return jsonResponse(order, 201);
});
