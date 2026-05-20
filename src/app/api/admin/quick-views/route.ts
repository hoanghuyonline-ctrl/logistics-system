export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler, safeQuery } from "@/lib/utils";

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
    newSalesRequests,
  ] = await Promise.all([
    safeQuery(prisma.order.count({ where: { status: "PENDING" } }), 0),
    safeQuery(prisma.order.count({
      where: { status: "ARRIVED_CHINA_WH", updatedAt: { lt: fiveDaysAgo } },
    }), 0),
    safeQuery(prisma.order.count({
      where: { status: "ARRIVED_VIETNAM_WH", updatedAt: { lt: threeDaysAgo } },
    }), 0),
    safeQuery(prisma.order.count({
      where: {
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        updatedAt: { lt: fiveDaysAgo },
      },
    }), 0),
    safeQuery(prisma.customerIssue.count({ where: { status: { not: "RESOLVED" } } }), 0),
    safeQuery(prisma.notificationFailure.count({ where: { resolved: false } }), 0),
    safeQuery(prisma.chatbotUnansweredQuestion.count({ where: { resolved: false } }), 0),
    safeQuery(prisma.staffNote.count({ where: { resolved: false } }), 0),
    safeQuery(prisma.walletTopUpRequest.count({ where: { status: "PENDING" } }), 0),
    safeQuery(prisma.order.count({
      where: {
        status: { in: ["PURCHASED", "SELLER_SHIPPED"] },
        trackingCodeChina: null,
      },
    }), 0),
    safeQuery(prisma.order.count({
      where: { status: "ARRIVED_VIETNAM_WH" },
    }), 0),
    safeQuery(prisma.order.count({
      where: { createdAt: { gte: todayStart } },
    }), 0),
    safeQuery(prisma.order.count({
      where: {
        priority: { in: ["HIGH", "URGENT"] },
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
    }), 0),
    safeQuery(prisma.salesRequest.count({ where: { status: "NEW" } }), 0),
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
    newSalesRequests,
  });
});
