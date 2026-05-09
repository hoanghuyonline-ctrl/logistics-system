import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import { sendZalo, getFailureLabel } from "@/lib/notifications/channels/zalo";
import type { ZaloFailureCategory } from "@/lib/notifications/channels/zalo";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const timestamp = new Date().toISOString();
  const config = {
    ZALO_OA_ACCESS_TOKEN: !!process.env.ZALO_OA_ACCESS_TOKEN,
    ZALO_RECIPIENT_ID: !!process.env.ZALO_RECIPIENT_ID,
    ZALO_SEND_ENABLED: process.env.ZALO_SEND_ENABLED === "true",
  };

  console.log(`[zalo-test] Admin ${user.email} yêu cầu gửi thử lúc ${timestamp}`, config);

  if (!config.ZALO_SEND_ENABLED) {
    return jsonResponse({
      success: false,
      error: "Chưa bật gửi Zalo — đặt ZALO_SEND_ENABLED=true trong .env",
      failureCategory: "CONFIG_MISSING" as ZaloFailureCategory,
      failureLabel: getFailureLabel("CONFIG_MISSING"),
      config,
      timestamp,
    });
  }

  if (!config.ZALO_OA_ACCESS_TOKEN) {
    return jsonResponse({
      success: false,
      error: "Chưa có access token — thêm ZALO_OA_ACCESS_TOKEN vào .env",
      failureCategory: "CONFIG_MISSING" as ZaloFailureCategory,
      failureLabel: getFailureLabel("CONFIG_MISSING"),
      config,
      timestamp,
    });
  }

  if (!config.ZALO_RECIPIENT_ID) {
    return jsonResponse({
      success: false,
      error: "Chưa có ID người nhận — thêm ZALO_RECIPIENT_ID vào .env",
      failureCategory: "CONFIG_MISSING" as ZaloFailureCategory,
      failureLabel: getFailureLabel("CONFIG_MISSING"),
      config,
      timestamp,
    });
  }

  try {
    const result = await sendZalo({
      text: `Bac Trung Hai Logistics — Tin nhắn thử nghiệm gửi lúc ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}`,
    });
    return jsonResponse({
      success: true,
      message: "Đã gửi tin nhắn thử thành công qua Zalo OA",
      recipientId: result.recipientId,
      config,
      timestamp,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({
      success: false,
      error: message,
      config,
      timestamp,
    });
  }
}
