export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

export const GET = withErrorHandler(async function GET(req: NextRequest, ctx: RouteContext<"/api/users/[id]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "STAFF"])) {
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

  // STAFF cannot view ADMIN account details
  if (user.role === "STAFF" && found.role === "ADMIN") {
    return errorResponse("Staff cannot view or modify admin accounts", 403);
  }

  return jsonResponse(found);
});

export const PUT = withErrorHandler(async function PUT(req: NextRequest, ctx: RouteContext<"/api/users/[id]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "STAFF"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const { fullName, email, phone, address, role, isActive } = body;

  // STAFF cannot modify any user who currently holds ADMIN role
  if (user.role === "STAFF") {
    const targetUser = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (targetUser?.role === "ADMIN") {
      return errorResponse("Staff cannot view or modify admin accounts", 403);
    }
    if (role === "ADMIN") {
      return errorResponse("Staff cannot assign admin role", 403);
    }
  }

  if (email) {
    const existing = await prisma.user.findFirst({ where: { email, NOT: { id } } });
    if (existing) return errorResponse("Email already exists", 409);
  }

  const data: Record<string, unknown> = {};
  if (fullName !== undefined) data.fullName = fullName;
  if (email !== undefined) data.email = email;
  if (phone !== undefined) data.phone = phone;
  if (address !== undefined) data.address = address;
  if (role !== undefined) data.role = role;
  if (isActive !== undefined) data.isActive = isActive;

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, fullName: true, role: true, isActive: true },
  });

  return jsonResponse(updated);
});

export const DELETE = withErrorHandler(async function DELETE(req: NextRequest, ctx: RouteContext<"/api/users/[id]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;

  if (id === user.id) {
    return errorResponse("Cannot deactivate your own account", 400);
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  return jsonResponse({ message: "User deactivated" });
});
