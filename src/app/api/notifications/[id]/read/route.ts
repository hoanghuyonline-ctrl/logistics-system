import { prisma } from "@/lib/prisma";
import { getCurrentUser, jsonResponse, errorResponse } from "@/lib/utils";
import type { NextRequest } from "next/server";

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/notifications/[id]/read">) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const { id } = await ctx.params;

  await prisma.notification.update({
    where: { id, userId: user.id },
    data: { isRead: true },
  });

  return jsonResponse({ message: "Marked as read" });
}
