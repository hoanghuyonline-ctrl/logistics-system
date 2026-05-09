import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import type { NextRequest } from "next/server";

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/orders/[id]/tracking">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();

  const updated = await prisma.order.update({
    where: { id },
    data: {
      trackingCodeChina: body.trackingCodeChina,
      trackingCodeIntl: body.trackingCodeIntl,
    },
  });

  return jsonResponse(updated);
}
