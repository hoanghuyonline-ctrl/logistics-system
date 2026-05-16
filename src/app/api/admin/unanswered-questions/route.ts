import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

function normalizeQuestion(q: string): string {
  return q.toLowerCase().trim().replace(/[?？!！.。,，]+$/g, "").trim();
}

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const questions = await prisma.chatbotUnansweredQuestion.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const groups: Record<string, {
    normalized: string;
    displayQuestion: string;
    ids: string[];
    count: number;
    channels: string[];
    latestAt: string;
    unresolvedCount: number;
    category: string | null;
  }> = {};

  for (const q of questions) {
    const key = normalizeQuestion(q.question);
    if (!groups[key]) {
      groups[key] = {
        normalized: key,
        displayQuestion: q.question,
        ids: [],
        count: 0,
        channels: [],
        latestAt: q.createdAt.toISOString(),
        unresolvedCount: 0,
        category: null,
      };
    }
    groups[key].ids.push(q.id);
    groups[key].count++;
    if (!q.resolved) groups[key].unresolvedCount++;
    if (!groups[key].channels.includes(q.channel)) {
      groups[key].channels.push(q.channel);
    }
    if (q.category && !groups[key].category) {
      groups[key].category = q.category;
    }
    const ts = q.createdAt.toISOString();
    if (ts > groups[key].latestAt) {
      groups[key].latestAt = ts;
    }
  }

  const grouped = Object.values(groups).sort((a, b) =>
    b.latestAt.localeCompare(a.latestAt),
  );

  return jsonResponse(grouped);
});

export const PATCH = withErrorHandler(async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await req.json();
  const { ids, category } = body as { ids?: string[]; category?: string };

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return errorResponse("Thiếu danh sách ID", 400);
  }

  const data: { resolved?: boolean; category?: string | null } = {};
  if (category !== undefined) {
    data.category = category || null;
  } else {
    data.resolved = true;
  }

  const result = await prisma.chatbotUnansweredQuestion.updateMany({
    where: { id: { in: ids } },
    data,
  });

  return jsonResponse({ updated: result.count });
});
