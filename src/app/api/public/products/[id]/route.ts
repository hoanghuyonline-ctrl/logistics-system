export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

export const GET = withErrorHandler(async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/public/products/[id]">
) {
  const { id } = await ctx.params;

  const product = await prisma.product.findUnique({
    where: { id, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      estimatedPrice: true,
      imageUrl: true,
    },
  });

  if (!product) return errorResponse("Sản phẩm không tồn tại", 404);

  return jsonResponse(product);
});
