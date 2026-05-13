export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import type { NextRequest } from "next/server";

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/orders/[id]/custom-status-note">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const customStatusNote = typeof body.customStatusNote === "string"
    ? body.customStatusNote.trim() || null
    : null;

  const order = await prisma.order.update({
    where: { id },
    data: { customStatusNote },
    select: { id: true, orderCode: true, customStatusNote: true },
  });

  return jsonResponse(order);
}
