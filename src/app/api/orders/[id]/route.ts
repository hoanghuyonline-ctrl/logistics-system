export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

export const GET = withErrorHandler(async function GET(req: NextRequest, ctx: RouteContext<"/api/orders/[id]">) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const { id } = await ctx.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, fullName: true, email: true, phone: true, address: true, zaloRecipientId: true } },
      package: true,
      statusLogs: {
        orderBy: { createdAt: "asc" },
        include: { changer: { select: { fullName: true, role: true } } },
      },
      orderNotes: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { fullName: true, role: true } } },
      },
    },
  });

  if (!order) return errorResponse("Order not found", 404);

  if (hasRole(user.role, ["CUSTOMER"]) && order.userId !== user.id) {
    return errorResponse("Forbidden", 403);
  }

  return jsonResponse(order);
});

export const PUT = withErrorHandler(async function PUT(req: NextRequest, ctx: RouteContext<"/api/orders/[id]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();

  const existing = await prisma.order.findUnique({ where: { id }, select: { orderType: true } });
  if (!existing) return errorResponse("Order not found", 404);

  const orderType = existing.orderType;

  const data: Record<string, unknown> = {};

  if (body.notes !== undefined) {
    data.notes = body.notes;
  }
  if (body.shippingAddress !== undefined) {
    data.shippingAddress = body.shippingAddress || null;
  }

  if (orderType === "ECOMMERCE") {
    if (body.productName !== undefined) data.productName = body.productName;
    if (body.productLink !== undefined) data.productLink = body.productLink;
    if (body.productSpecs !== undefined) data.productSpecs = body.productSpecs || null;
  } else if (orderType === "ENTRUST") {
    if (body.productName !== undefined) data.productName = body.productName;
    if (body.weight !== undefined) data.weightKg = body.weight ? parseFloat(body.weight) : null;
    if (body.volume !== undefined) data.volume = body.volume ? parseFloat(body.volume) : null;
    if (body.requiresVat !== undefined) data.requiresVat = body.requiresVat === true;
    if (body.taxCode !== undefined) data.taxCode = body.taxCode || null;
    if (body.companyName !== undefined) data.companyName = body.companyName || null;
    if (body.companyAddress !== undefined) data.companyAddress = body.companyAddress || null;
    if (body.entrustShipmentType !== undefined) data.entrustShipmentType = body.entrustShipmentType || null;
    if (body.entrustServices !== undefined) data.entrustServices = body.entrustServices ? JSON.stringify(body.entrustServices) : null;
    if (body.cargoValueCurrency !== undefined) data.cargoValueCurrency = body.cargoValueCurrency || null;
    if (body.cargoValueAmount !== undefined) data.cargoValueAmount = body.cargoValueAmount ? parseFloat(body.cargoValueAmount) : null;
    if (body.cargoValueVND !== undefined) data.cargoValueVND = body.cargoValueVND ? parseFloat(body.cargoValueVND) : null;
    if (body.dimensionLength !== undefined) data.dimensionLength = body.dimensionLength ? parseFloat(body.dimensionLength) : null;
    if (body.dimensionWidth !== undefined) data.dimensionWidth = body.dimensionWidth ? parseFloat(body.dimensionWidth) : null;
    if (body.dimensionHeight !== undefined) data.dimensionHeight = body.dimensionHeight ? parseFloat(body.dimensionHeight) : null;
    if (body.cbm !== undefined) data.cbm = body.cbm ? parseFloat(body.cbm) : null;
    if (body.entrustQuantity !== undefined) data.entrustQuantity = body.entrustQuantity ? parseInt(body.entrustQuantity) : null;
    if (body.waybillCode !== undefined) data.waybillCode = body.waybillCode || null;
    if (body.waybillImages !== undefined) data.waybillImages = body.waybillImages ? JSON.stringify(body.waybillImages) : null;
    if (body.relatedDocuments !== undefined) data.relatedDocuments = body.relatedDocuments ? JSON.stringify(body.relatedDocuments) : null;
    if (body.cnTruckPlate !== undefined) data.cnTruckPlate = body.cnTruckPlate || null;
    if (body.cnDriverName !== undefined) data.cnDriverName = body.cnDriverName || null;
    if (body.cnDriverPhone !== undefined) data.cnDriverPhone = body.cnDriverPhone || null;
    if (body.cnTruckImages !== undefined) data.cnTruckImages = body.cnTruckImages ? JSON.stringify(body.cnTruckImages) : null;
  } else if (orderType === "CONSIGNMENT") {
    if (body.consignmentTrackingNumber !== undefined) data.consignmentTrackingNumber = body.consignmentTrackingNumber;
    if (body.consignmentNotes !== undefined) data.consignmentNotes = body.consignmentNotes || null;
    if (body.productName !== undefined) data.productName = body.productName;
  }

  const order = await prisma.order.update({ where: { id }, data });

  return jsonResponse(order);
});
