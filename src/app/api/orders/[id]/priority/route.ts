export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

const VALID_PRIORITIES = ["NORMAL", "HIGH", "URGENT"] as const;

export const PUT = withErrorHandler(async function PUT(req: NextRequest, ctx: RouteContext<"/api/orders/[id]/priority">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "STAFF"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const priority = body.priority;

  if (!VALID_PRIORITIES.includes(priority)) {
    return errorResponse("Invalid priority", 400);
  }

  const order = await prisma.order.update({
    where: { id },
    data: { priority },
    select: { id: true, orderCode: true, priority: true },
  });

  return jsonResponse(order);
});
