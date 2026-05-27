export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

const DECLARATION_TYPES = [
  "KINH_DOANH",
  "GIA_CONG",
  "SAN_XUAT_XUAT_KHAU",
  "TAM_NHAP_TAI_XUAT",
  "PHI_MAU_DICH",
] as const;

function generateRequestCode(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const r = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `HQ${y}${m}${d}-${r}`;
}

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["CUSTOMER"])) {
    return errorResponse("Forbidden", 403);
  }

  const requests = await prisma.customsRequest.findMany({
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
  const { declarationType, accompanyingServices, goodsDescription, hsCode, goodsValue, goodsCurrency, goodsWeight, goodsQuantity, originCountry, destinationPort, companyName, taxCode, companyAddress, contactName, contactPhone, contactEmail, documents, customerNote } = body;

  if (!declarationType || !DECLARATION_TYPES.includes(declarationType)) {
    return errorResponse("Loại khai báo hải quan không hợp lệ", 400);
  }

  if (!goodsDescription) {
    return errorResponse("Vui lòng mô tả hàng hóa", 400);
  }

  const customerId = hasRole(user.role, ["ADMIN", "STAFF"]) && body.customerId ? body.customerId : user.id;

  const request = await prisma.customsRequest.create({
    data: {
      requestCode: generateRequestCode(),
      customerId,
      declarationType,
      accompanyingServices: accompanyingServices ? JSON.stringify(accompanyingServices) : null,
      goodsDescription,
      hsCode: hsCode || null,
      goodsValue: goodsValue ? parseFloat(goodsValue) : null,
      goodsCurrency: goodsCurrency || null,
      goodsWeight: goodsWeight ? parseFloat(goodsWeight) : null,
      goodsQuantity: goodsQuantity ? parseInt(goodsQuantity) : null,
      originCountry: originCountry || null,
      destinationPort: destinationPort || null,
      companyName: companyName || null,
      taxCode: taxCode || null,
      companyAddress: companyAddress || null,
      contactName: contactName || null,
      contactPhone: contactPhone || null,
      contactEmail: contactEmail || null,
      documents: documents ? JSON.stringify(documents) : null,
      customerNote: customerNote || null,
    },
  });

  return jsonResponse(request, 201);
});
