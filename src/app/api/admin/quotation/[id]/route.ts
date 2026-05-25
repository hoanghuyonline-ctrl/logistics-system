export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

export const GET = withErrorHandler(async function GET(_req: NextRequest, ctx: RouteContext<"/api/admin/quotation/[id]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const request = await prisma.quotationRequest.findUnique({
    where: { id },
    include: { responder: { select: { id: true, fullName: true } } },
  });

  if (!request) return errorResponse("Not found", 404);
  return jsonResponse(request);
});

export const PUT = withErrorHandler(async function PUT(req: NextRequest, ctx: RouteContext<"/api/admin/quotation/[id]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const existing = await prisma.quotationRequest.findUnique({ where: { id } });
  if (!existing) return errorResponse("Not found", 404);

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.status) data.status = body.status;
  if (body.adminNote !== undefined) data.adminNote = body.adminNote || null;
  if (body.quotedPrice !== undefined) {
    data.quotedPrice = body.quotedPrice ? parseFloat(body.quotedPrice) : null;
    if (body.quotedPrice) {
      data.quotedAt = new Date();
      data.respondedBy = user.id;
      if (!body.status) data.status = "QUOTED";
    }
  }
  if (body.quotedNote !== undefined) data.quotedNote = body.quotedNote || null;

  const updated = await prisma.quotationRequest.update({
    where: { id },
    data,
    include: { responder: { select: { id: true, fullName: true } } },
  });

  return jsonResponse(updated);
});
