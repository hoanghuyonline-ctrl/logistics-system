import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import type { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest, ctx: RouteContext<"/api/packages/[id]/images">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "WAREHOUSE_CN", "WAREHOUSE_VN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const formData = await req.formData();
  const file = formData.get("image") as File | null;

  if (!file) return errorResponse("Image file is required");

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads", "packages");
  await mkdir(uploadDir, { recursive: true });

  const filename = `${id}-${Date.now()}-${file.name}`;
  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, buffer);

  const imageUrl = `/uploads/packages/${filename}`;

  const image = await prisma.packageImage.create({
    data: { packageId: id, imageUrl },
  });

  return jsonResponse(image, 201);
}
