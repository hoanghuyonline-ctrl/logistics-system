export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

import { translateText } from "@/lib/translate";

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const warehouses = await prisma.chinaWarehouse.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return jsonResponse({ warehouses });
});

export const POST = withErrorHandler(async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await req.json();
  const { nameVi, nameZh, nameEn, addressVi, addressZh, addressEn } = body;

  if (!nameVi || !addressVi) {
    return errorResponse("Vietnamese name and address fields are required", 400);
  }

  let finalNameZh = nameZh || "";
  let finalNameEn = nameEn || "";
  let finalAddressZh = addressZh || "";
  let finalAddressEn = addressEn || "";

  // Auto-translate name if zh or en is empty
  if (!finalNameZh.trim() || !finalNameEn.trim()) {
    try {
      const translated = await translateText(nameVi);
      if (!finalNameZh.trim()) finalNameZh = translated.zh;
      if (!finalNameEn.trim()) finalNameEn = translated.en;
    } catch (e) {
      console.error("Auto-translate name failed:", e);
    }
  }

  // Auto-translate address if zh or en is empty
  if (!finalAddressZh.trim() || !finalAddressEn.trim()) {
    try {
      const translated = await translateText(addressVi);
      if (!finalAddressZh.trim()) finalAddressZh = translated.zh;
      if (!finalAddressEn.trim()) finalAddressEn = translated.en;
    } catch (e) {
      console.error("Auto-translate address failed:", e);
    }
  }

  const warehouse = await prisma.chinaWarehouse.create({
    data: {
      nameVi,
      nameZh: finalNameZh || nameVi,
      nameEn: finalNameEn || nameVi,
      addressVi,
      addressZh: finalAddressZh || addressVi,
      addressEn: finalAddressEn || addressVi,
    },
  });

  return jsonResponse({ warehouse }, 201);
});
