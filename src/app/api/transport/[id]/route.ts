export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

export const GET = withErrorHandler(async function GET(_req: NextRequest, ctx: RouteContext<"/api/transport/[id]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["CUSTOMER", "ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const request = await prisma.transportRequest.findUnique({
    where: { id },
    include: { customer: { select: { id: true, fullName: true, email: true, phone: true } } },
  });

  if (!request) return errorResponse("Not found", 404);

  if (user.role === "CUSTOMER" && request.customerId !== user.id) {
    return errorResponse("Forbidden", 403);
  }

  return jsonResponse(request);
});
