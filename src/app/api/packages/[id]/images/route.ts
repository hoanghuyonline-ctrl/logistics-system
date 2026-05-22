export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";
import { getStorage } from "@/lib/storage";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 100);
}

export const GET = withErrorHandler(async function GET(_req: NextRequest, ctx: RouteContext<"/api/packages/[id]/images">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "WAREHOUSE_CN", "WAREHOUSE_VN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const images = await prisma.packageImage.findMany({
    where: { packageId: id },
    orderBy: { createdAt: "desc" },
  });

  return jsonResponse(images);
});

export const POST = withErrorHandler(async function POST(req: NextRequest, ctx: RouteContext<"/api/packages/[id]/images">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "WAREHOUSE_CN", "WAREHOUSE_VN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;

  const pkg = await prisma.package.findUnique({ where: { id } });
  if (!pkg) return errorResponse("Package not found", 404);

  const formData = await req.formData();
  const file = formData.get("image") as File | null;

  if (!file) return errorResponse("Image file is required");

  if (!ALLOWED_TYPES.includes(file.type)) {
    return errorResponse("Only JPG, PNG, and WebP images are allowed");
  }

  if (file.size > MAX_SIZE_BYTES) {
    return errorResponse("Image must be smaller than 5 MB");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const safeName = sanitizeFilename(file.name);
  const key = `packages/${id}-${Date.now()}-${safeName}`;
  const store = await getStorage();
  const imageUrl = await store.upload(buffer, key);

  const image = await prisma.packageImage.create({
    data: { packageId: id, imageUrl },
  });

  return jsonResponse(image, 201);
});

export const DELETE = withErrorHandler(async function DELETE(req: NextRequest, ctx: RouteContext<"/api/packages/[id]/images">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "WAREHOUSE_CN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const imageId = searchParams.get("imageId");

  if (!imageId) return errorResponse("imageId query parameter is required");

  const image = await prisma.packageImage.findFirst({
    where: { id: imageId, packageId: id },
  });

  if (!image) return errorResponse("Image not found", 404);

  const store = await getStorage();
  const isGcsUrl = image.imageUrl.startsWith("https://storage.googleapis.com/");
  const key = isGcsUrl
    ? image.imageUrl.replace(/^https:\/\/storage\.googleapis\.com\/[^/]+\//, "")
    : image.imageUrl.replace(/^\/uploads\//, "");
  await store.delete(key);

  await prisma.packageImage.delete({ where: { id: imageId } });

  return jsonResponse({ success: true });
});
