export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/orders/[id]">) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const { id } = await ctx.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, fullName: true, email: true, phone: true, address: true, zaloRecipientId: true } },
      package: true,
      statusLogs: {
        orderBy: { createdAt: "asc" },
        include: { changer: { select: { fullName: true, role: true } } },
      },
      orderNotes: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { fullName: true, role: true } } },
      },
    },
  });

  if (!order) return errorResponse("Order not found", 404);

  if (hasRole(user.role, ["CUSTOMER"]) && order.userId !== user.id) {
    return errorResponse("Forbidden", 403);
  }

  return jsonResponse(order);
}

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/orders/[id]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();

  const order = await prisma.order.update({
    where: { id },
    data: {
      productName: body.productName,
      productLink: body.productLink,
      notes: body.notes,
    },
  });

  return jsonResponse(order);
}
