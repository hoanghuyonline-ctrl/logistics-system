export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "ACCOUNTANT"])) {
    return errorResponse("Forbidden", 403);
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  const [
    unpaidOrders,
    stuckChina,
    stuckVietnam,
    staleOrders,
    unresolvedIssues,
    notifFailures,
    unansweredQuestions,
    unresolvedNotes,
    pendingDeposits,
    ordersMissingTracking,
    allAtVietnamWh,
    newOrdersToday,
    highPriorityActive,
  ] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({
      where: { status: "ARRIVED_CHINA_WH", updatedAt: { lt: fiveDaysAgo } },
    }),
    prisma.order.count({
      where: { status: "ARRIVED_VIETNAM_WH", updatedAt: { lt: threeDaysAgo } },
    }),
    prisma.order.count({
      where: {
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        updatedAt: { lt: fiveDaysAgo },
      },
    }),
    prisma.customerIssue.count({ where: { status: { not: "RESOLVED" } } }),
    prisma.notificationFailure.count({ where: { resolved: false } }),
    prisma.chatbotUnansweredQuestion.count({ where: { resolved: false } }),
    prisma.staffNote.count({ where: { resolved: false } }),
    prisma.walletTopUpRequest.count({ where: { status: "PENDING" } }),
    prisma.order.count({
      where: {
        status: { in: ["PURCHASED", "SELLER_SHIPPED"] },
        trackingCodeChina: null,
      },
    }),
    prisma.order.count({
      where: { status: "ARRIVED_VIETNAM_WH" },
    }),
    prisma.order.count({
      where: { createdAt: { gte: todayStart } },
    }),
    prisma.order.count({
      where: {
        priority: { in: ["HIGH", "URGENT"] },
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
    }),
  ]);

  return jsonResponse({
    unpaidOrders,
    stuckChina,
    stuckVietnam,
    staleOrders,
    unresolvedIssues,
    notifFailures,
    unansweredQuestions,
    unresolvedNotes,
    pendingDeposits,
    ordersMissingTracking,
    allAtVietnamWh,
    newOrdersToday,
    highPriorityActive,
  });
});
