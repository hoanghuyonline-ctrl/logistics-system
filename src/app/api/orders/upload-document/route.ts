export const dynamic = "force-dynamic";

import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { uploadFileToStorage } from "@/lib/storage";
import { buildAssetUrl } from "@/lib/url";
import type { NextRequest } from "next/server";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

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
    return errorResponse("Allowed: JPG, PNG, WebP, PDF, DOC, DOCX, XLS, XLSX", 400);
  }
  if (file.size > MAX_SIZE) {
    return errorResponse("File must be smaller than 10 MB", 400);
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeName = sanitize(file.name);
  const fileName = `${Date.now()}-${safeName}`;
  const savedPath = await uploadFileToStorage(buffer, fileName, "orders/documents");
  const url = await buildAssetUrl(savedPath);

  return jsonResponse({ path: savedPath, url, name: file.name, type: file.type, size: file.size }, 201);
});
