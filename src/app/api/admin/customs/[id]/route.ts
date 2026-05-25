export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

export const PUT = withErrorHandler(async function PUT(req: NextRequest, ctx: RouteContext<"/api/admin/customs/[id]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();

  const existing = await prisma.customsRequest.findUnique({ where: { id } });
  if (!existing) return errorResponse("Not found", 404);

  const data: Record<string, unknown> = {};

  if (body.status !== undefined) data.status = body.status;
  if (body.adminNote !== undefined) data.adminNote = body.adminNote || null;
  if (body.quotedPrice !== undefined) {
    data.quotedPrice = body.quotedPrice ? parseFloat(body.quotedPrice) : null;
    if (body.quotedPrice) data.quotedAt = new Date();
  }

  const updated = await prisma.customsRequest.update({
    where: { id },
    data,
    include: {
      customer: { select: { id: true, fullName: true, email: true, phone: true } },
    },
  });

  return jsonResponse(updated);
});
