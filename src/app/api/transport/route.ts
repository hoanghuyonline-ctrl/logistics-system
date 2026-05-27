export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

const SERVICE_TYPES = ["TRUCK_NORTH_SOUTH", "INNER_CITY_DELIVERY", "TRANSIT_WAREHOUSE"] as const;

function generateRequestCode(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand = "";
  for (let i = 0; i < 4; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `VT${yy}${mm}${dd}-${rand}`;
}

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["CUSTOMER", "ADMIN", "STAFF"])) {
    return errorResponse("Forbidden", 403);
  }

  const requests = await prisma.transportRequest.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return jsonResponse(requests);
});

export const POST = withErrorHandler(async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["CUSTOMER", "ADMIN", "STAFF"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await req.json();
  const { serviceType } = body;

  if (!serviceType || !SERVICE_TYPES.includes(serviceType)) {
    return errorResponse("Loại dịch vụ không hợp lệ", 400);
  }

  const request = await prisma.transportRequest.create({
    data: {
      requestCode: generateRequestCode(),
      customerId: user.id,
      serviceType,
      pickupAddress: body.pickupAddress || null,
      pickupCity: body.pickupCity || null,
      pickupContactName: body.pickupContactName || null,
      pickupContactPhone: body.pickupContactPhone || null,
      pickupDate: body.pickupDate ? new Date(body.pickupDate) : null,
      deliveryAddress: body.deliveryAddress || null,
      deliveryCity: body.deliveryCity || null,
      deliveryContactName: body.deliveryContactName || null,
      deliveryContactPhone: body.deliveryContactPhone || null,
      cargoDescription: body.cargoDescription || null,
      cargoWeight: body.cargoWeight ? parseFloat(body.cargoWeight) : null,
      cargoVolume: body.cargoVolume ? parseFloat(body.cargoVolume) : null,
      cargoQuantity: body.cargoQuantity ? parseInt(body.cargoQuantity) : null,
      cargoType: body.cargoType || null,
      requiresRefrigeration: body.requiresRefrigeration || false,
      warehouseCity: body.warehouseCity || null,
      storageDuration: body.storageDuration ? parseInt(body.storageDuration) : null,
      storageNote: body.storageNote || null,
      customerNote: body.customerNote || null,
    },
  });

  return jsonResponse(request, 201);
});
