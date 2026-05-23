export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { jsonResponse, withErrorHandler } from "@/lib/utils";
import { buildAssetUrl } from "@/lib/url";

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

  const resolved = await Promise.all(
    products.map(async (p) => ({ ...p, imageUrl: await buildAssetUrl(p.imageUrl) })),
  );

  return jsonResponse(resolved);
});
