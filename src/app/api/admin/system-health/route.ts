export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import { getNotificationConfig } from "@/lib/notification-config";
import { getZaloTokenStatus } from "@/lib/zalo-token";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const now = new Date();

  // Database check + operational counts in parallel
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [
    dbOk,
    telegramToken,
    telegramChatId,
    zaloEnabled,
    zaloToken,
    messengerToken,
    unansweredCount,
    stuckPendingCount,
    stuckDeliveryCount,
    latestChatbotActivity,
    zaloTokenExpiredFailure,
    zaloUnresolvedFailureCount,
    zaloBoundCustomerCount,
    failuresToday,
    unresolvedFailures,
    affectedChannels,
    latestFailure,
  ] = await Promise.all([
    prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    getNotificationConfig("telegram_bot_token"),
    getNotificationConfig("telegram_chat_id"),
    getNotificationConfig("zalo_send_enabled"),
    getNotificationConfig("zalo_oa_access_token"),
    Promise.resolve(process.env.MESSENGER_PAGE_ACCESS_TOKEN || ""),
    prisma.chatbotUnansweredQuestion.count({ where: { resolved: false } }),
    prisma.order.count({
      where: {
        status: "PENDING",
        createdAt: { lt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.order.count({
      where: {
        status: "OUT_FOR_DELIVERY",
        updatedAt: { lt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.chatbotUnansweredQuestion
      .findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true, channel: true } })
      .catch(() => null),
    prisma.notificationFailure.findFirst({
      where: { channel: "ZALO", failureCategory: "TOKEN_EXPIRED", resolved: false },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, shortReason: true },
    }).catch(() => null),
    prisma.notificationFailure.count({
      where: { channel: "ZALO", resolved: false },
    }).catch(() => 0),
    prisma.user.count({
      where: { zaloRecipientId: { not: null } },
    }).catch(() => 0),
    prisma.notificationFailure.count({
      where: { createdAt: { gte: todayStart } },
    }).catch(() => 0),
    prisma.notificationFailure.count({
      where: { resolved: false },
    }).catch(() => 0),
    prisma.notificationFailure.groupBy({
      by: ["channel"],
      where: { resolved: false },
      _count: true,
    }).catch(() => []),
    prisma.notificationFailure.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, channel: true },
    }).catch(() => null),
  ]);

  const zaloTokenExpired = !!zaloTokenExpiredFailure;
  const zaloTokenRefresh = getZaloTokenStatus();

  return jsonResponse({
    system: {
      appOnline: true,
      database: dbOk ? "connected" : "disconnected",
      serverTime: now.toISOString(),
      environment: process.env.NODE_ENV || "development",
    },
    chatbot: {
      telegram: telegramToken && telegramChatId ? "enabled" : "disabled",
      zalo: zaloEnabled === "true" && zaloToken ? "enabled" : "disabled",
      messenger: messengerToken ? "enabled" : "disabled",
    },
    zaloDiagnostics: {
      tokenExpired: zaloTokenExpired,
      tokenExpiredAt: zaloTokenExpiredFailure?.createdAt ?? null,
      tokenExpiredReason: zaloTokenExpiredFailure?.shortReason ?? null,
      unresolvedFailures: zaloUnresolvedFailureCount,
      boundCustomers: zaloBoundCustomerCount,
      configPresent: {
        sendEnabled: zaloEnabled === "true",
        accessToken: !!zaloToken,
      },
      tokenRefresh: zaloTokenRefresh
        ? {
            lastRefreshAt: zaloTokenRefresh.refreshedAt,
            success: zaloTokenRefresh.success,
            errorReason: zaloTokenRefresh.errorReason ?? null,
          }
        : null,
    },
    operational: {
      unansweredQuestions: unansweredCount,
      stuckPending: stuckPendingCount,
      stuckDelivery: stuckDeliveryCount,
      lastChatbotActivity: latestChatbotActivity
        ? { time: latestChatbotActivity.createdAt, channel: latestChatbotActivity.channel }
        : null,
    },
    notificationDelivery: {
      failuresToday,
      unresolvedFailures,
      affectedChannels: (affectedChannels as { channel: string; _count: number }[]).map(
        (c) => c.channel,
      ),
      latestFailureAt: latestFailure?.createdAt ?? null,
    },
  });
}
