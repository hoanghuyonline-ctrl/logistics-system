export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/orders/[id]/notes">) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const { id } = await ctx.params;

  const notes = await prisma.orderNote.findMany({
    where: { orderId: id },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { fullName: true, role: true } } },
  });

  return jsonResponse(notes);
}

export async function POST(req: NextRequest, ctx: RouteContext<"/api/orders/[id]/notes">) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const { id } = await ctx.params;
  const body = await req.json();

  if (!body.content) return errorResponse("Content is required");

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return errorResponse("Order not found", 404);

  if (hasRole(user.role, ["CUSTOMER"]) && order.userId !== user.id) {
    return errorResponse("Forbidden", 403);
  }

  const note = await prisma.orderNote.create({
    data: {
      orderId: id,
      userId: user.id,
      content: body.content,
    },
    include: { user: { select: { fullName: true, role: true } } },
  });

  return jsonResponse(note, 201);
}
