export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

export const GET = withErrorHandler(async function GET(_req: NextRequest, ctx: RouteContext<"/api/admin/knowledge/[id]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const article = await prisma.knowledgeArticle.findUnique({
    where: { id },
    include: { author: { select: { id: true, fullName: true } } },
  });

  if (!article) return errorResponse("Not found", 404);
  return jsonResponse(article);
});

export const PUT = withErrorHandler(async function PUT(req: NextRequest, ctx: RouteContext<"/api/admin/knowledge/[id]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const existing = await prisma.knowledgeArticle.findUnique({ where: { id } });
  if (!existing) return errorResponse("Not found", 404);

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.title !== undefined) data.title = body.title;
  if (body.summary !== undefined) data.summary = body.summary || null;
  if (body.content !== undefined) data.content = body.content;
  if (body.category !== undefined) data.category = body.category;
  if (body.coverImage !== undefined) data.coverImage = body.coverImage || null;
  if (body.tags !== undefined) data.tags = body.tags || null;
  if (body.isPublished !== undefined) {
    data.isPublished = body.isPublished;
    if (body.isPublished && !existing.publishedAt) {
      data.publishedAt = new Date();
    }
  }

  const updated = await prisma.knowledgeArticle.update({
    where: { id },
    data,
    include: { author: { select: { id: true, fullName: true } } },
  });

  return jsonResponse(updated);
});

export const DELETE = withErrorHandler(async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/admin/knowledge/[id]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const existing = await prisma.knowledgeArticle.findUnique({ where: { id } });
  if (!existing) return errorResponse("Not found", 404);

  await prisma.knowledgeArticle.delete({ where: { id } });
  return jsonResponse({ success: true });
});
