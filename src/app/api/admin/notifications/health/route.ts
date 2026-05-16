export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { getNotificationConfig } from "@/lib/notification-config";

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const [telegramToken, telegramChatId, zaloEnabled, zaloToken, messengerToken, smtpHost, zaloTokenExpired] =
    await Promise.all([
      getNotificationConfig("telegram_bot_token"),
      getNotificationConfig("telegram_chat_id"),
      getNotificationConfig("zalo_send_enabled"),
      getNotificationConfig("zalo_oa_access_token"),
      Promise.resolve(process.env.MESSENGER_PAGE_ACCESS_TOKEN || ""),
      Promise.resolve(process.env.SMTP_HOST || ""),
      prisma.notificationFailure.findFirst({
        where: { channel: "ZALO", failureCategory: "TOKEN_EXPIRED", resolved: false },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }).then((f) => !!f).catch(() => false),
    ]);

  const zaloConfigured = zaloEnabled === "true" && zaloToken;

  return jsonResponse({
    telegram: telegramToken && telegramChatId ? "enabled" : "disabled",
    zalo: zaloConfigured ? (zaloTokenExpired ? "token_expired" : "enabled") : "disabled",
    email: smtpHost ? "enabled" : "disabled",
    messenger: messengerToken ? "enabled" : "disabled",
  });
});
