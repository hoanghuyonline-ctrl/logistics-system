import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import {
  getMaskedNotificationConfigs,
  isValidNotificationKey,
} from "@/lib/notification-config";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const configs = await getMaskedNotificationConfigs();
  return jsonResponse(configs);
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();

  if (!body || typeof body !== "object") {
    return errorResponse("Dữ liệu không hợp lệ", 400);
  }

  const updates: { key: string; value: string }[] = [];

  for (const [key, value] of Object.entries(body)) {
    if (!isValidNotificationKey(key)) {
      return errorResponse(`Khóa không hợp lệ: ${key}`, 400);
    }
    if (typeof value !== "string") {
      return errorResponse(`Giá trị của ${key} phải là chuỗi`, 400);
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

  const configs = await getMaskedNotificationConfigs();
  return jsonResponse({ message: "Đã cập nhật cấu hình thông báo", configs });
}
