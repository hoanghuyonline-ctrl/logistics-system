export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  const warehouses = await prisma.chinaWarehouse.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      nameVi: true,
      nameZh: true,
      nameEn: true,
      addressVi: true,
      addressZh: true,
      addressEn: true,
    },
  });

  return jsonResponse({ warehouses });
});
