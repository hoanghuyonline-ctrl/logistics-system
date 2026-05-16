import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

export const PATCH = withErrorHandler(async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/admin/support-knowledge/[id]">,
) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const { title, content, category, isActive, keywords } = body;

  const existing = await prisma.supportKnowledge.findUnique({ where: { id } });
  if (!existing) {
    return errorResponse("Không tìm thấy mục tri thức", 404);
  }

  const updated = await prisma.supportKnowledge.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(category !== undefined && { category }),
      ...(isActive !== undefined && { isActive }),
      ...(keywords !== undefined && {
        keywords: typeof keywords === "string" ? keywords.trim() || null : null,
      }),
    },
  });

  return jsonResponse(updated);
});

export const DELETE = withErrorHandler(async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/support-knowledge/[id]">,
) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;

  const existing = await prisma.supportKnowledge.findUnique({ where: { id } });
  if (!existing) {
    return errorResponse("Không tìm thấy mục tri thức", 404);
  }

  await prisma.supportKnowledge.delete({ where: { id } });

  return jsonResponse({ success: true });
});
