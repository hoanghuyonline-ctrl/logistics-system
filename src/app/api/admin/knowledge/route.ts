export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

const CATEGORIES = [
  "IMPORT_POLICY",
  "EXPORT_TAX",
  "HS_CODE",
  "LOGISTICS_NEWS",
  "EXPORT_GUIDE",
  "INCOTERMS",
  "VIETNAM_PORTS",
] as const;

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  const suffix = Date.now().toString(36).slice(-4);
  return `${base}-${suffix}`;
}

export const GET = withErrorHandler(async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const category = url.searchParams.get("category") || undefined;
  const published = url.searchParams.get("published");
  const search = url.searchParams.get("search") || undefined;
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (published === "true") where.isPublished = true;
  if (published === "false") where.isPublished = false;
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
      include: { author: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.knowledgeArticle.count({ where }),
  ]);

  return jsonResponse({ articles, total, page, totalPages: Math.ceil(total / limit) });
});

export const POST = withErrorHandler(async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await req.json();
  const { title, summary, content, category, coverImage, tags, isPublished } = body;

  if (!title || !content) {
    return errorResponse("Tiêu đề và nội dung là bắt buộc", 400);
  }

  if (!category || !CATEGORIES.includes(category)) {
    return errorResponse("Danh mục không hợp lệ", 400);
  }

  const article = await prisma.knowledgeArticle.create({
    data: {
      slug: generateSlug(title),
      title,
      summary: summary || null,
      content,
      category,
      coverImage: coverImage || null,
      tags: tags || null,
      isPublished: isPublished || false,
      publishedAt: isPublished ? new Date() : null,
      authorId: user.id,
    },
  });

  return jsonResponse(article, 201);
});
