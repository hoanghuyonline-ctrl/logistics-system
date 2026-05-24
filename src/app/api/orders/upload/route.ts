export const dynamic = "force-dynamic";

import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { uploadFileToStorage } from "@/lib/storage";
import { buildAssetUrl } from "@/lib/url";
import type { NextRequest } from "next/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 80);
}

export const POST = withErrorHandler(async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["CUSTOMER", "ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return errorResponse("No file provided", 400);

  if (!ALLOWED_TYPES.includes(file.type)) {
    return errorResponse("Only JPG, PNG, and WebP images are allowed", 400);
  }
  if (file.size > MAX_SIZE) {
    return errorResponse("Image must be smaller than 5 MB", 400);
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeName = sanitize(file.name);
  const fileName = `${Date.now()}-${safeName}`;
  const savedPath = await uploadFileToStorage(buffer, fileName, "orders");
  const url = await buildAssetUrl(savedPath);

  return jsonResponse({ path: savedPath, url }, 201);
});
