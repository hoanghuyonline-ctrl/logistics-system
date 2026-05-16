export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { getNotificationConfig } from "@/lib/notification-config";

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "ACCOUNTANT"])) {
    return errorResponse("Forbidden", 403);
  }

  const [
    dbOk,
    telegramToken,
    telegramChatId,
    zaloEnabled,
    zaloToken,
    smtpHost,
    messengerToken,
  ] = await Promise.all([
    prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    getNotificationConfig("telegram_bot_token"),
    getNotificationConfig("telegram_chat_id"),
    getNotificationConfig("zalo_send_enabled"),
    getNotificationConfig("zalo_oa_access_token"),
    Promise.resolve(process.env.SMTP_HOST || ""),
    Promise.resolve(process.env.MESSENGER_PAGE_ACCESS_TOKEN || ""),
  ]);

  return jsonResponse({
    db: dbOk ? "ok" : "error",
    telegram: telegramToken && telegramChatId ? "ok" : "off",
    zalo: zaloEnabled === "true" && zaloToken ? "ok" : "off",
    email: smtpHost ? "ok" : "off",
    messenger: messengerToken ? "ok" : "off",
    env: process.env.NODE_ENV || "development",
  });
});
