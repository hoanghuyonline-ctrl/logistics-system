export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

const SMTP_KEYS = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM", "SMTP_SECURE"] as const;

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const dbConfigs = await prisma.systemConfig.findMany({
    where: { key: { in: [...SMTP_KEYS] } },
  });
  const dbMap = new Map(dbConfigs.map((c) => [c.key, c.value]));

  const result = SMTP_KEYS.map((key) => ({
    key,
    configured: !!(dbMap.get(key) || process.env[key]),
    value: key === "SMTP_PASS"
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

  const validKeys = new Set<string>(SMTP_KEYS);
  const updates: { key: string; value: string }[] = [];

  for (const [key, value] of Object.entries(body)) {
    if (!validKeys.has(key)) {
      return errorResponse(`Khóa không hợp lệ: ${key}`, 400);
    }
    if (typeof value !== "string") {
      return errorResponse(`Giá trị của ${key} phải là chuỗi`, 400);
    }
    if (key === "SMTP_PASS" && value === "••••••••") {
      continue;
    }
    updates.push({ key, value });
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

  return jsonResponse({ success: true, message: "Đã lưu cấu hình SMTP" });
});
