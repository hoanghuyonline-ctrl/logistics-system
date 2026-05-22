export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { getNotificationConfig } from "@/lib/notification-config";

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const [telegramToken, telegramChatId, zaloEnabled, zaloToken, messengerToken, smtpDbConfigs, zaloTokenExpired] =
    await Promise.all([
      getNotificationConfig("telegram_bot_token"),
      getNotificationConfig("telegram_chat_id"),
      getNotificationConfig("zalo_send_enabled"),
      getNotificationConfig("zalo_oa_access_token"),
      Promise.resolve(process.env.MESSENGER_PAGE_ACCESS_TOKEN || ""),
      prisma.systemConfig.findMany({ where: { key: { in: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER"] } } }),
      prisma.notificationFailure.findFirst({
        where: { channel: "ZALO", failureCategory: "TOKEN_EXPIRED", resolved: false },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }).then((f) => !!f).catch(() => false),
    ]);

  const smtpDb = new Map(smtpDbConfigs.map((c: { key: string; value: string }) => [c.key, c.value]));
  const smtpHost = smtpDb.get("SMTP_HOST") || process.env.SMTP_HOST || "";
  const zaloConfigured = zaloEnabled === "true" && zaloToken;

  return jsonResponse({
    telegram: telegramToken && telegramChatId ? "enabled" : "disabled",
    zalo: zaloConfigured ? (zaloTokenExpired ? "token_expired" : "enabled") : "disabled",
    email: smtpHost ? "enabled" : "disabled",
    messenger: messengerToken ? "enabled" : "disabled",
  });
});
