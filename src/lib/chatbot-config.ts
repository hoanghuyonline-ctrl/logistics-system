import { prisma } from "./prisma";

export const CHATBOT_CONFIG_KEYS = [
  "chatbot_concise_replies",
  "chatbot_avoid_repeat",
  "chatbot_fallback_human",
  "chatbot_allowed_topics",
  "chatbot_min_match_score",
] as const;

export type ChatbotConfigKey = (typeof CHATBOT_CONFIG_KEYS)[number];

export interface ChatbotConfig {
  conciseReplies: boolean;
  avoidRepeat: boolean;
  fallbackHuman: boolean;
  allowedTopics: string[];
  minMatchScore: number;
}

export async function getChatbotConfig(): Promise<ChatbotConfig> {
  const rows = await prisma.systemConfig
    .findMany({
      where: { key: { in: [...CHATBOT_CONFIG_KEYS] } },
    })
    .catch(() => []);

  const map = new Map(rows.map((r) => [r.key, r.value]));

  return {
    conciseReplies: (map.get("chatbot_concise_replies") ?? "true") === "true",
    avoidRepeat: (map.get("chatbot_avoid_repeat") ?? "true") === "true",
    fallbackHuman: (map.get("chatbot_fallback_human") ?? "true") === "true",
    allowedTopics: parseTopics(map.get("chatbot_allowed_topics") ?? ""),
    minMatchScore: parseInt(map.get("chatbot_min_match_score") ?? "3", 10) || 3,
  };
}

function parseTopics(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
}

export function isTopicAllowed(
  category: string,
  allowedTopics: string[],
): boolean {
  if (allowedTopics.length === 0) return true;
  const normalized = category.toLowerCase().trim();
  return allowedTopics.some(
    (t) => normalized.includes(t) || t.includes(normalized),
  );
}

export function logQualityFlag(
  channel: string,
  senderId: string | null,
  question: string,
  flag: string,
  detail?: string,
  knowledgeId?: string,
  score?: number,
): void {
  prisma.chatbotQualityLog
    .create({
      data: {
        channel,
        senderId,
        question,
        flag,
        detail,
        knowledgeId,
        score,
      },
    })
    .catch((e: unknown) =>
      console.error("[chatbot/quality] log error:", e),
    );
}

export const QUALITY_FLAGS = {
  LOW_SCORE: "LOW_SCORE",
  REPEATED_QUESTION: "REPEATED_QUESTION",
  FALLBACK_HUMAN: "FALLBACK_HUMAN",
  TOPIC_BLOCKED: "TOPIC_BLOCKED",
  CONCISE_APPLIED: "CONCISE_APPLIED",
} as const;
