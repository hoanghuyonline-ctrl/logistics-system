/**
 * API Route: /api/admin/homepage
 *
 * GET  → Đọc cấu hình khối trang chủ từ SystemConfig (key: homepage_blocks)
 * PUT  → Ghi mảng HomePageBlock[] vào SystemConfig (chỉ ADMIN)
 *
 * Lưu trữ trong bảng SystemConfig hiện có của dự án thay vì file JSON
 * để tương thích với output: "standalone" và production PostgreSQL.
 */
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import type { HomePageBlock } from "@/types/page";
import {
  getCurrentUser,
  hasRole,
  jsonResponse,
  errorResponse,
  withErrorHandler,
} from "@/lib/utils";

const CONFIG_KEY = "homepage_blocks";

// ── GET /api/admin/homepage ──────────────────────────────────────────────────
export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const record = await prisma.systemConfig.findUnique({
    where: { key: CONFIG_KEY },
  });

  if (!record) {
    // Chưa có cấu hình → trả về mảng rỗng, client sẽ dùng initialBlocks
    return jsonResponse([]);
  }

  try {
    const blocks: HomePageBlock[] = JSON.parse(record.value);
    return jsonResponse(blocks);
  } catch {
    return jsonResponse([]);
  }
});

// ── PUT /api/admin/homepage ──────────────────────────────────────────────────
export const PUT = withErrorHandler(async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body: unknown = await request.json();

  if (!Array.isArray(body)) {
    return errorResponse("Dữ liệu không hợp lệ: phải là mảng HomePageBlock[]", 400);
  }

  // Validate từng phần tử có trường bắt buộc
  const validTypes = new Set(["banner", "about", "services"]);
  for (const item of body) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("id" in item) ||
      !("type" in item) ||
      !validTypes.has((item as Record<string, unknown>).type as string)
    ) {
      return errorResponse("Dữ liệu không hợp lệ: mỗi block phải có id và type hợp lệ", 400);
    }
  }

  const serialized = JSON.stringify(body);

  await prisma.systemConfig.upsert({
    where: { key: CONFIG_KEY },
    update: { value: serialized, updatedBy: user.id },
    create: { key: CONFIG_KEY, value: serialized, updatedBy: user.id },
  });

  return jsonResponse({ success: true, message: "Đã lưu cấu hình trang chủ!" });
});
