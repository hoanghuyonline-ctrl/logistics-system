import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import type { NextRequest } from "next/server";

function normalizeQuestion(q: string): string {
  return q.toLowerCase().trim().replace(/[?？!！.。,，]+$/g, "").trim();
}

export async function GET() {
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
      };
    }
    groups[key].ids.push(q.id);
    groups[key].count++;
    if (!q.resolved) groups[key].unresolvedCount++;
    if (!groups[key].channels.includes(q.channel)) {
      groups[key].channels.push(q.channel);
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
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await req.json();
  const { ids } = body as { ids?: string[] };

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return errorResponse("Thiếu danh sách ID", 400);
  }

  const result = await prisma.chatbotUnansweredQuestion.updateMany({
    where: { id: { in: ids } },
    data: { resolved: true },
  });

  return jsonResponse({ updated: result.count });
}
