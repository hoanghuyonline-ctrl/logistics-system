export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

export const GET = withErrorHandler(async function GET(_req: NextRequest, ctx: RouteContext<"/api/customs/[id]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["CUSTOMER", "ADMIN", "STAFF"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;

  const where = hasRole(user.role, ["ADMIN", "STAFF"]) ? { id } : { id, customerId: user.id };

  const request = await prisma.customsRequest.findFirst({
    where,
    include: {
      customer: { select: { id: true, fullName: true, email: true, phone: true, address: true } },
    },
  });

  if (!request) return errorResponse("Not found", 404);

  return jsonResponse(request);
});
