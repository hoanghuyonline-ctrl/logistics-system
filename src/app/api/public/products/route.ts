export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { jsonResponse, withErrorHandler } from "@/lib/utils";

export const GET = withErrorHandler(async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      estimatedPrice: true,
      imageUrl: true,
    },
  });

  return jsonResponse(products);
});
