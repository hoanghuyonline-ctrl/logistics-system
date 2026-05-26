export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

export const PUT = withErrorHandler(async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await params;
  const body = await req.json();
  const { nameVi, nameZh, nameEn, addressVi, addressZh, addressEn, isActive } = body;

  const existing = await prisma.chinaWarehouse.findUnique({ where: { id } });
  if (!existing) {
    return errorResponse("Warehouse not found", 404);
  }

  const warehouse = await prisma.chinaWarehouse.update({
    where: { id },
    data: {
      ...(nameVi !== undefined && { nameVi }),
      ...(nameZh !== undefined && { nameZh }),
      ...(nameEn !== undefined && { nameEn }),
      ...(addressVi !== undefined && { addressVi }),
      ...(addressZh !== undefined && { addressZh }),
      ...(addressEn !== undefined && { addressEn }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return jsonResponse({ warehouse });
});

export const DELETE = withErrorHandler(async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await params;

  const orderCount = await prisma.order.count({ where: { chinaWarehouseId: id } });
  if (orderCount > 0) {
    return errorResponse("Cannot delete warehouse with existing orders. Deactivate it instead.", 400);
  }

  await prisma.chinaWarehouse.delete({ where: { id } });

  return jsonResponse({ success: true });
});
