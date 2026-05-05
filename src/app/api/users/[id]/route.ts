export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/users/[id]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const found = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      address: true,
      role: true,
      isActive: true,
      telegramChatId: true,
      createdAt: true,
      wallet: { select: { balance: true, debt: true } },
    },
  });

  if (!found) return errorResponse("User not found", 404);
  return jsonResponse(found);
}

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/users/[id]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const { fullName, phone, address, role, isActive } = body;

  const updated = await prisma.user.update({
    where: { id },
    data: { fullName, phone, address, role, isActive },
    select: { id: true, email: true, fullName: true, role: true, isActive: true },
  });

  return jsonResponse(updated);
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/users/[id]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  return jsonResponse({ message: "User deactivated" });
}
