import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const allQuestions = await prisma.chatbotUnansweredQuestion.findMany({
    select: { channel: true, question: true, resolved: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const total = allQuestions.length;
  const unresolved = allQuestions.filter((q) => !q.resolved).length;
  const resolved = total - unresolved;

  const byChannel: Record<string, { total: number; unresolved: number }> = {};
  for (const q of allQuestions) {
    if (!byChannel[q.channel]) {
      byChannel[q.channel] = { total: 0, unresolved: 0 };
    }
    byChannel[q.channel].total++;
    if (!q.resolved) byChannel[q.channel].unresolved++;
  }

  const latestUnresolved = allQuestions.find((q) => !q.resolved) ?? null;

  const freq: Record<string, number> = {};
  for (const q of allQuestions) {
    const normalized = q.question.toLowerCase().trim();
    freq[normalized] = (freq[normalized] || 0) + 1;
  }
  const topRepeated = Object.entries(freq)
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([question, count]) => ({ question, count }));

  return jsonResponse({
    total,
    unresolved,
    resolved,
    byChannel,
    latestUnresolved: latestUnresolved
      ? { question: latestUnresolved.question, channel: latestUnresolved.channel, createdAt: latestUnresolved.createdAt }
      : null,
    topRepeated,
  });
});
