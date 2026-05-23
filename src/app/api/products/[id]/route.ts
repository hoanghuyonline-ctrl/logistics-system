import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { buildAssetUrl } from "@/lib/url";
import type { NextRequest } from "next/server";

export const PATCH = withErrorHandler(async function PATCH(req: NextRequest, ctx: RouteContext<"/api/products/[id]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return errorResponse("Sản phẩm không tồn tại", 404);

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description || null;
  if (body.category !== undefined) data.category = body.category || null;
  if (body.estimatedPrice !== undefined) data.estimatedPrice = body.estimatedPrice != null ? parseFloat(body.estimatedPrice) : null;
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl || null;
  if (body.images !== undefined) data.images = body.images;
  if (body.variants !== undefined) data.variants = body.variants;
  if (body.specs !== undefined) data.specs = body.specs;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.sortOrder !== undefined) data.sortOrder = parseInt(body.sortOrder);

  const updated = await prisma.product.update({ where: { id }, data });
  return jsonResponse({ ...updated, imageUrl: await buildAssetUrl(updated.imageUrl) });
});
