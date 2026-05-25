export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

const SERVICE_TYPES = ["IMPORT_EXPORT", "CUSTOMS_CLEARANCE", "DOMESTIC_TRANSPORT", "WAREHOUSE_STORAGE", "INTERNATIONAL_TRADE", "OTHER"] as const;

function generateRequestCode(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let rand = "";
  for (let i = 0; i < 4; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `BG${yy}${mm}${dd}-${rand}`;
}

export const POST = withErrorHandler(async function POST(req: NextRequest) {
  const body = await req.json();
  const { serviceType, contactName, contactEmail, contactPhone } = body;

  if (!serviceType || !SERVICE_TYPES.includes(serviceType)) {
    return errorResponse("Loại dịch vụ không hợp lệ", 400);
  }
  if (!contactName || !contactEmail || !contactPhone) {
    return errorResponse("Vui lòng điền đầy đủ thông tin liên hệ", 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(contactEmail)) {
    return errorResponse("Email không hợp lệ", 400);
  }

  const request = await prisma.quotationRequest.create({
    data: {
      requestCode: generateRequestCode(),
      serviceType,
      serviceDetail: body.serviceDetail || null,
      cargoDescription: body.cargoDescription || null,
      cargoWeight: body.cargoWeight ? parseFloat(body.cargoWeight) : null,
      cargoVolume: body.cargoVolume ? parseFloat(body.cargoVolume) : null,
      originCity: body.originCity || null,
      destinationCity: body.destinationCity || null,
      contactName,
      contactEmail,
      contactPhone,
      companyName: body.companyName || null,
    },
  });

  return jsonResponse({ requestCode: request.requestCode, message: "Yêu cầu báo giá đã được gửi thành công" }, 201);
});
