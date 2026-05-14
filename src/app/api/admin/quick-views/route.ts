export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const now = new Date();
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
  });
}
