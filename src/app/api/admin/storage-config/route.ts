export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { resetStorageCache } from "@/lib/storage";
import { resetDomainCache } from "@/lib/url";
import type { NextRequest } from "next/server";

const STORAGE_KEYS = [
  "APP_DOMAIN",
  "STORAGE_PROVIDER",
  "GCS_BUCKET",
  "GCS_CREDENTIALS",
  "GDRIVE_FOLDER_ID",
  "GDRIVE_CLIENT_ID",
  "GDRIVE_CLIENT_SECRET",
  "GDRIVE_REFRESH_TOKEN",
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_CUSTOM_DOMAIN",
] as const;

const SENSITIVE_KEYS = new Set(["GCS_CREDENTIALS", "GDRIVE_CLIENT_SECRET", "GDRIVE_REFRESH_TOKEN", "R2_SECRET_ACCESS_KEY"]);

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const dbConfigs = await prisma.systemConfig.findMany({
    where: { key: { in: [...STORAGE_KEYS] } },
  });
  const dbMap = new Map(dbConfigs.map((c) => [c.key, c.value]));

  const result = STORAGE_KEYS.map((key) => ({
    key,
    configured: !!(dbMap.get(key) || process.env[key]),
    value: SENSITIVE_KEYS.has(key)
      ? (dbMap.get(key) || process.env[key] ? "••••••••" : "")
      : (dbMap.get(key) || process.env[key] || ""),
    source: dbMap.has(key) ? "db" as const : (process.env[key] ? "env" as const : "none" as const),
  }));

  return jsonResponse(result);
});

export const PUT = withErrorHandler(async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await req.json();

  if (!body || typeof body !== "object") {
    return errorResponse("Dữ liệu không hợp lệ", 400);
  }

  const validKeys = new Set<string>(STORAGE_KEYS);
  const updates: { key: string; value: string }[] = [];

  for (const [key, value] of Object.entries(body)) {
    if (!validKeys.has(key)) {
      return errorResponse(`Khóa không hợp lệ: ${key}`, 400);
    }
    if (typeof value !== "string") {
      return errorResponse(`Giá trị của ${key} phải là chuỗi`, 400);
    }
    if (SENSITIVE_KEYS.has(key) && value === "••••••••") {
      continue;
    }
    let cleanValue = value;
    if (key === "APP_DOMAIN") {
      cleanValue = value.trim().replace(/\/+$/, "");
      if (cleanValue && !/^https?:\/\/.+/.test(cleanValue)) {
        return errorResponse("APP_DOMAIN phải bắt đầu bằng http:// hoặc https://", 400);
      }
    }
    updates.push({ key, value: cleanValue });
  }

  if (updates.length === 0) {
    return errorResponse("Không có giá trị để cập nhật", 400);
  }

  await Promise.all(
    updates.map(({ key, value }) =>
      prisma.systemConfig.upsert({
        where: { key },
        update: { value, updatedBy: user.id },
        create: { key, value, updatedBy: user.id },
      }),
    ),
  );

  resetStorageCache();
  resetDomainCache();

  return jsonResponse({ success: true, message: "Đã lưu cấu hình lưu trữ" });
});
