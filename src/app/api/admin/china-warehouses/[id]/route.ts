export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

import { translateText } from "@/lib/translate";

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

  let finalNameZh = nameZh;
  let finalNameEn = nameEn;
  let finalAddressZh = addressZh;
  let finalAddressEn = addressEn;

  // Auto-translate name if zh or en is empty
  if (nameVi !== undefined && nameVi.trim() !== "") {
    if (finalNameZh === "" || finalNameEn === "" || (!finalNameZh && !existing.nameZh) || (!finalNameEn && !existing.nameEn)) {
      try {
        const translated = await translateText(nameVi);
        if (finalNameZh === "" || (!finalNameZh && !existing.nameZh)) finalNameZh = translated.zh;
        if (finalNameEn === "" || (!finalNameEn && !existing.nameEn)) finalNameEn = translated.en;
      } catch (e) {
        console.error("Auto-translate name failed during update:", e);
      }
    }
  }

  // Auto-translate address if zh or en is empty
  if (addressVi !== undefined && addressVi.trim() !== "") {
    if (finalAddressZh === "" || finalAddressEn === "" || (!finalAddressZh && !existing.addressZh) || (!finalAddressEn && !existing.addressEn)) {
      try {
        const translated = await translateText(addressVi);
        if (finalAddressZh === "" || (!finalAddressZh && !existing.addressZh)) finalAddressZh = translated.zh;
        if (finalAddressEn === "" || (!finalAddressEn && !existing.addressEn)) finalAddressEn = translated.en;
      } catch (e) {
        console.error("Auto-translate address failed during update:", e);
      }
    }
  }

  const warehouse = await prisma.chinaWarehouse.update({
    where: { id },
    data: {
      ...(nameVi !== undefined && { nameVi }),
      ...(finalNameZh !== undefined && { nameZh: finalNameZh }),
      ...(finalNameEn !== undefined && { nameEn: finalNameEn }),
      ...(addressVi !== undefined && { addressVi }),
      ...(finalAddressZh !== undefined && { addressZh: finalAddressZh }),
      ...(finalAddressEn !== undefined && { addressEn: finalAddressEn }),
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
