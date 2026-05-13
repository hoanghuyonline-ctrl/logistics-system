export const dynamic = "force-dynamic";

import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import { getNotificationConfig } from "@/lib/notification-config";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const [telegramToken, telegramChatId, zaloEnabled, zaloToken, messengerToken, smtpHost] =
    await Promise.all([
      getNotificationConfig("telegram_bot_token"),
      getNotificationConfig("telegram_chat_id"),
      getNotificationConfig("zalo_send_enabled"),
      getNotificationConfig("zalo_oa_access_token"),
      Promise.resolve(process.env.MESSENGER_PAGE_ACCESS_TOKEN || ""),
      Promise.resolve(process.env.SMTP_HOST || ""),
    ]);

  return jsonResponse({
    telegram: telegramToken && telegramChatId ? "enabled" : "disabled",
    zalo: zaloEnabled === "true" && zaloToken ? "enabled" : "disabled",
    email: smtpHost ? "enabled" : "disabled",
    messenger: messengerToken ? "enabled" : "disabled",
  });
}
