export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { buildAssetUrl } from "@/lib/url";

export const GET = withErrorHandler(async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const url = new URL(request.url);
  const isAdmin = hasRole(user.role, ["ADMIN"]);
  const showAll = url.searchParams.get("all") === "1" && isAdmin;

  const where = showAll ? {} : { isActive: true };

  const products = await prisma.product.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const resolved = await Promise.all(
    products.map(async (p) => ({ ...p, imageUrl: await buildAssetUrl(p.imageUrl) })),
  );

  return jsonResponse(resolved);
});

export const POST = withErrorHandler(async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { name, description, category, estimatedPrice, imageUrl, sortOrder } = body;

  if (!name) return errorResponse("Tên sản phẩm là bắt buộc");

  const product = await prisma.product.create({
    data: {
      name,
      description: description || null,
      category: category || null,
      estimatedPrice: estimatedPrice != null ? parseFloat(estimatedPrice) : null,
      imageUrl: imageUrl || null,
      sortOrder: sortOrder != null ? parseInt(sortOrder) : 0,
      createdById: user.id,
    },
  });

  return jsonResponse({ ...product, imageUrl: await buildAssetUrl(product.imageUrl) }, 201);
});
