import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import { sendZalo, getFailureLabel } from "@/lib/notifications/channels/zalo";
import type { ZaloFailureCategory } from "@/lib/notifications/channels/zalo";
import { getNotificationConfig } from "@/lib/notification-config";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const timestamp = new Date().toISOString();
  const config = {
    ZALO_OA_ACCESS_TOKEN: !!(await getNotificationConfig("zalo_oa_access_token")),
    ZALO_RECIPIENT_ID: !!(await getNotificationConfig("zalo_recipient_id")),
    ZALO_SEND_ENABLED: (await getNotificationConfig("zalo_send_enabled")) === "true",
  };

  console.log(`[zalo-test] Admin ${user.email} yêu cầu gửi thử lúc ${timestamp}`, config);

  if (!config.ZALO_SEND_ENABLED) {
    return jsonResponse({
      success: false,
      error: "Chưa bật gửi Zalo — bật trong Cài đặt thông báo hoặc đặt ZALO_SEND_ENABLED=true",
      failureCategory: "CONFIG_MISSING" as ZaloFailureCategory,
      failureLabel: getFailureLabel("CONFIG_MISSING"),
      config,
      timestamp,
    });
  }

  if (!config.ZALO_OA_ACCESS_TOKEN) {
    return jsonResponse({
      success: false,
      error: "Chưa có access token — thêm trong Cài đặt thông báo hoặc .env",
      failureCategory: "CONFIG_MISSING" as ZaloFailureCategory,
      failureLabel: getFailureLabel("CONFIG_MISSING"),
      config,
      timestamp,
    });
  }

  if (!config.ZALO_RECIPIENT_ID) {
    return jsonResponse({
      success: false,
      error: "Chưa có ID người nhận — thêm trong Cài đặt thông báo hoặc .env",
      failureCategory: "CONFIG_MISSING" as ZaloFailureCategory,
      failureLabel: getFailureLabel("CONFIG_MISSING"),
      config,
      timestamp,
    });
  }

  try {
    const result = await sendZalo({
      text: `Bắc Trung Hải Logistics — Tin nhắn thử nghiệm gửi lúc ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}`,
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
