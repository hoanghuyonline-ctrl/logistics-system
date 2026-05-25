export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { jsonResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

export const GET = withErrorHandler(async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") || undefined;
  const search = url.searchParams.get("search") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 12;

  const where: Record<string, unknown> = { isPublished: true };
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { summary: { contains: search, mode: "insensitive" } },
      { tags: { contains: search, mode: "insensitive" } },
    ];
  }

  const [articles, total] = await Promise.all([
    prisma.knowledgeArticle.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        category: true,
        coverImage: true,
        tags: true,
        viewCount: true,
        publishedAt: true,
        author: { select: { fullName: true } },
      },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.knowledgeArticle.count({ where }),
  ]);

  return jsonResponse({ articles, total, page, totalPages: Math.ceil(total / limit) });
});
