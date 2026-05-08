import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import { sendZalo } from "@/lib/notifications/channels/zalo";

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

  console.log(`[zalo-test] Admin ${user.email} triggered test at ${timestamp}`, config);

  if (!config.ZALO_SEND_ENABLED) {
    console.log("[zalo-test] Skipped — ZALO_SEND_ENABLED is not 'true'");
    return jsonResponse({
      success: false,
      error: "ZALO_SEND_ENABLED chưa bật (phải đặt = 'true')",
      config,
      timestamp,
    });
  }

  if (!config.ZALO_OA_ACCESS_TOKEN) {
    console.log("[zalo-test] Skipped — ZALO_OA_ACCESS_TOKEN missing");
    return jsonResponse({
      success: false,
      error: "ZALO_OA_ACCESS_TOKEN chưa được cấu hình",
      config,
      timestamp,
    });
  }

  if (!config.ZALO_RECIPIENT_ID) {
    console.log("[zalo-test] Skipped — ZALO_RECIPIENT_ID missing");
    return jsonResponse({
      success: false,
      error: "ZALO_RECIPIENT_ID chưa được cấu hình",
      config,
      timestamp,
    });
  }

  try {
    await sendZalo({
      text: `[THỬ NGHIỆM] Thông báo Zalo OA từ Nam Trung Hải Logistics — ${timestamp}`,
    });
    console.log(`[zalo-test] Sent successfully at ${timestamp}`);
    return jsonResponse({
      success: true,
      message: "Gửi thông báo Zalo thành công",
      config,
      timestamp,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[zalo-test] Failed at ${timestamp}:`, message);
    return jsonResponse({
      success: false,
      error: `Gửi thất bại: ${message}`,
      config,
      timestamp,
    });
  }
}
