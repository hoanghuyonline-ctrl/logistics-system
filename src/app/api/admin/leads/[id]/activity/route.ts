export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import type { NextRequest } from "next/server";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/admin/leads/[id]/activity">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;

  const activities = await prisma.leadActivity.findMany({
    where: { leadId: id },
    include: { actor: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return jsonResponse(activities);
}
