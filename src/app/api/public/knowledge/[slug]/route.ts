export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

export const GET = withErrorHandler(async function GET(_req: NextRequest, ctx: RouteContext<"/api/public/knowledge/[slug]">) {
  const { slug } = await ctx.params;

  const article = await prisma.knowledgeArticle.findFirst({
    where: { slug, isPublished: true },
    include: { author: { select: { fullName: true } } },
  });

  if (!article) return errorResponse("Not found", 404);

  await prisma.knowledgeArticle.update({
    where: { id: article.id },
    data: { viewCount: { increment: 1 } },
  });

  return jsonResponse(article);
});
