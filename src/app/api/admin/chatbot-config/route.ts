export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import { CHATBOT_CONFIG_KEYS } from "@/lib/chatbot-config";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const rows = await prisma.systemConfig.findMany({
    where: { key: { in: [...CHATBOT_CONFIG_KEYS] } },
  });
  const config: Record<string, string> = {};
  for (const r of rows) {
    config[r.key] = r.value;
  }

  // Quality log summary (last 24h)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const qualityLogs = await prisma.chatbotQualityLog.groupBy({
    by: ["flag"],
    where: { createdAt: { gte: oneDayAgo } },
    _count: { id: true },
  });

  const qualitySummary: Record<string, number> = {};
  for (const log of qualityLogs) {
    qualitySummary[log.flag] = log._count.id;
  }

  // Recent quality logs (last 20)
  const recentLogs = await prisma.chatbotQualityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      channel: true,
      question: true,
      flag: true,
      detail: true,
      score: true,
      createdAt: true,
    },
  });

  return jsonResponse({ config, qualitySummary, recentLogs });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();

  const updates = Object.entries(body)
    .filter(([key]) => (CHATBOT_CONFIG_KEYS as readonly string[]).includes(key))
    .map(([key, value]) =>
      prisma.systemConfig.upsert({
        where: { key },
        update: { value: String(value), updatedBy: user.id },
        create: { key, value: String(value), updatedBy: user.id },
      }),
    );

  if (updates.length === 0) {
    return errorResponse("No valid config keys provided", 400);
  }

  await Promise.all(updates);
  return jsonResponse({ message: "Chatbot config updated" });
}
