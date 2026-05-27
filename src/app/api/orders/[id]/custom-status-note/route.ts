export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { onCustomerVisibleOrderNote } from "@/lib/notifications";
import type { NextRequest } from "next/server";

export const PUT = withErrorHandler(async function PUT(req: NextRequest, ctx: RouteContext<"/api/orders/[id]/custom-status-note">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "STAFF"])) {
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
    select: { id: true, orderCode: true, customStatusNote: true, userId: true },
  });

  if (customStatusNote) {
    prisma.user
      .findUnique({ where: { id: order.userId }, select: { email: true, fullName: true } })
      .then((customer) =>
        onCustomerVisibleOrderNote({
          userId: order.userId,
          userEmail: customer?.email,
          userName: customer?.fullName,
          orderId: order.id,
          orderCode: order.orderCode,
          noteContent: customStatusNote,
        }),
      )
      .catch((err) => {
        console.error("[notify] custom-status-note failed:", err);
      });
  }

  return jsonResponse(order);
});
