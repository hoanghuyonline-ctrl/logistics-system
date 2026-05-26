export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

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

  if (!nameVi || !nameZh || !nameEn || !addressVi || !addressZh || !addressEn) {
    return errorResponse("All name and address fields are required", 400);
  }

  const warehouse = await prisma.chinaWarehouse.create({
    data: { nameVi, nameZh, nameEn, addressVi, addressZh, addressEn },
  });

  return jsonResponse({ warehouse }, 201);
});
