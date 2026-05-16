export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [
    leadsBySource,
    leadTotal,
    convertedCount,
    followUpOverdue,
    openTickets,
    ticketsByPriority,
    campaignCount,
    campaignsByStatus,
  ] = await Promise.all([
    prisma.lead.groupBy({ by: ["source"], _count: true }),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "CONVERTED" } }),
    prisma.lead.count({
      where: {
        nextFollowUpAt: { lt: todayStart },
        status: { notIn: ["CONVERTED", "LOST"] },
      },
    }),
    prisma.customerIssue.count({
      where: { status: { not: "RESOLVED" } },
    }),
    prisma.customerIssue.groupBy({
      by: ["priority"],
      where: { status: { not: "RESOLVED" } },
      _count: true,
    }),
    prisma.campaign.count(),
    prisma.campaign.groupBy({ by: ["status"], _count: true }),
  ]);

  const sourceMap: Record<string, number> = {};
  for (const s of leadsBySource) sourceMap[s.source] = s._count;

  const priorityMap: Record<string, number> = {};
  for (const p of ticketsByPriority) priorityMap[p.priority] = p._count;

  const campaignStatusMap: Record<string, number> = {};
  for (const c of campaignsByStatus) campaignStatusMap[c.status] = c._count;

  return jsonResponse({
    leads: {
      total: leadTotal,
      converted: convertedCount,
      conversionRate: leadTotal > 0 ? Math.round((convertedCount / leadTotal) * 100) : 0,
      bySource: sourceMap,
      followUpOverdue,
    },
    support: {
      openTickets,
      byPriority: priorityMap,
    },
    campaigns: {
      total: campaignCount,
      byStatus: campaignStatusMap,
    },
  });
});
