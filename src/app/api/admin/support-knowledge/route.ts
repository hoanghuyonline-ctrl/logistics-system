import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const url = new URL(req.url);
  const category = url.searchParams.get("category");

  const entries = await prisma.supportKnowledge.findMany({
    where: category ? { category } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return jsonResponse(entries);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await req.json();
  const { title, content, category, keywords } = body;

  if (!title || !content || !category) {
    return errorResponse("Tiêu đề, nội dung và danh mục là bắt buộc", 400);
  }

  const trimmedKeywords = typeof keywords === "string" ? keywords.trim() || null : null;

  const entry = await prisma.supportKnowledge.create({
    data: { title, content, category, keywords: trimmedKeywords },
  });

  return jsonResponse(entry, 201);
}
