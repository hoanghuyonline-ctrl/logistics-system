import { prisma } from "@/lib/prisma";
import { getChatbotConfig, isTopicAllowed, logQualityFlag, QUALITY_FLAGS } from "@/lib/chatbot-config";

interface KnowledgeMatch {
  id: string;
  title: string;
  content: string;
  keywords: string | null;
  score: number;
  matchSource: "keywords" | "title" | "category" | "content";
}

const MAX_REPLY_LENGTH = 500;

const CHANNEL_COUNT_FIELD: Record<string, string> = {
  ZALO: "matchCountZalo",
  TELEGRAM: "matchCountTelegram",
  MESSENGER: "matchCountMessenger",
};

export function trackKnowledgeMatch(entryId: string, channel?: string): void {
  const incrementData: Record<string, unknown> = { matchCount: { increment: 1 } };
  if (channel && CHANNEL_COUNT_FIELD[channel]) {
    incrementData[CHANNEL_COUNT_FIELD[channel]] = { increment: 1 };
  }
  prisma.supportKnowledge.update({
    where: { id: entryId },
    data: { ...incrementData, lastMatchedAt: new Date() },
  }).catch((e: unknown) => console.error("[knowledge/tracking] error:", e));
}

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[\s,./!?;:()\-–—]+/)
    .filter((w) => w.length >= 2);
}

export function scoreMatch(
  query: string,
  title: string,
  content: string,
  category: string,
  keywords?: string | null,
): { score: number; matchSource: "keywords" | "title" | "category" | "content" | "none" } {
  const normalizedQuery = normalize(query);
  const tokens = tokenize(query);

  if (tokens.length === 0) return { score: 0, matchSource: "none" };

  let score = 0;
  let keywordsScore = 0;
  let titleScore = 0;
  let categoryScore = 0;
  let contentScore = 0;

  // Keywords matching (highest priority)
  if (keywords) {
    const kwList = keywords.split(",").map((k) => normalize(k.trim())).filter((k) => k.length >= 2);
    for (const kw of kwList) {
      if (normalizedQuery.includes(kw)) keywordsScore += 15;
      for (const token of tokens) {
        if (kw.includes(token)) keywordsScore += 5;
      }
    }
    score += keywordsScore;
  }

  const normalizedTitle = normalize(title);
  const normalizedContent = normalize(content);
  const normalizedCategory = normalize(category);

  // Exact substring match in title
  if (normalizedTitle.includes(normalizedQuery)) {
    titleScore += 10;
  }

  // Token-level matching
  for (const token of tokens) {
    if (normalizedTitle.includes(token)) titleScore += 3;
    if (normalizedCategory.includes(token)) categoryScore += 2;
    if (normalizedContent.includes(token)) contentScore += 1;
  }

  score += titleScore + categoryScore + contentScore;

  let matchSource: "keywords" | "title" | "category" | "content" | "none" = "none";
  if (keywordsScore > 0) matchSource = "keywords";
  else if (titleScore > 0) matchSource = "title";
  else if (categoryScore > 0) matchSource = "category";
  else if (contentScore > 0) matchSource = "content";

  return { score, matchSource };
}

export interface KnowledgeAnswerResult {
  id: string;
  title: string;
  content: string;
  keywords: string | null;
  matchSource: string;
  score: number;
  candidateCount: number;
  qualityFlag?: string;
}

export async function findSupportKnowledgeAnswer(
  messageText: string,
  channel?: string,
  senderId?: string,
): Promise<KnowledgeAnswerResult | null> {
  const config = await getChatbotConfig();

  const entries = await prisma.supportKnowledge.findMany({
    where: { isActive: true },
    select: { id: true, title: true, content: true, category: true, keywords: true },
  });

  if (entries.length === 0) return null;

  const matches: (KnowledgeMatch & { category: string })[] = entries
    .map((entry) => {
      const result = scoreMatch(messageText, entry.title, entry.content, entry.category, entry.keywords);
      return {
        id: entry.id,
        title: entry.title,
        content: entry.content,
        keywords: entry.keywords,
        category: entry.category,
        score: result.score,
        matchSource: result.matchSource === "none" ? "content" as const : result.matchSource,
      };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  if (matches.length === 0) return null;

  const best = matches[0];

  // Quality control: minimum score threshold
  if (best.score < config.minMatchScore) {
    logQualityFlag(channel || "UNKNOWN", senderId ?? null, messageText, QUALITY_FLAGS.LOW_SCORE, `score=${best.score} min=${config.minMatchScore}`, best.id, best.score);
    console.log(`[chatbot/quality] LOW_SCORE | channel=${channel} score=${best.score} min=${config.minMatchScore} query="${messageText}"`);
    return null;
  }

  // Quality control: allowed topics filter
  if (config.allowedTopics.length > 0 && !isTopicAllowed(best.category, config.allowedTopics)) {
    logQualityFlag(channel || "UNKNOWN", senderId ?? null, messageText, QUALITY_FLAGS.TOPIC_BLOCKED, `category=${best.category}`, best.id, best.score);
    console.log(`[chatbot/quality] TOPIC_BLOCKED | channel=${channel} category="${best.category}" query="${messageText}"`);
    return null;
  }

  // Quality control: avoid repeated questions (same sender, same entry, within 5 min)
  if (config.avoidRepeat && senderId && channel) {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recent = await prisma.chatbotQualityLog.findFirst({
      where: {
        channel,
        senderId,
        knowledgeId: best.id,
        flag: QUALITY_FLAGS.CONCISE_APPLIED,
        createdAt: { gte: fiveMinAgo },
      },
    }).catch(() => null);
    if (recent) {
      logQualityFlag(channel, senderId, messageText, QUALITY_FLAGS.REPEATED_QUESTION, `knowledgeId=${best.id}`, best.id, best.score);
      console.log(`[chatbot/quality] REPEATED_QUESTION | channel=${channel} senderId=${senderId} knowledgeId=${best.id}`);
    }
  }

  let content =
    best.content.length > MAX_REPLY_LENGTH
      ? best.content.slice(0, MAX_REPLY_LENGTH) + "..."
      : best.content;

  // Quality control: concise replies — trim to first paragraph
  let qualityFlag: string | undefined;
  if (config.conciseReplies && content.includes("\n\n")) {
    const firstParagraph = content.split("\n\n")[0];
    if (firstParagraph.length >= 30) {
      content = firstParagraph;
      qualityFlag = QUALITY_FLAGS.CONCISE_APPLIED;
      logQualityFlag(channel || "UNKNOWN", senderId ?? null, messageText, QUALITY_FLAGS.CONCISE_APPLIED, undefined, best.id, best.score);
    }
  }

  trackKnowledgeMatch(best.id, channel);

  return {
    id: best.id,
    title: best.title,
    content,
    keywords: best.keywords,
    matchSource: best.matchSource,
    score: best.score,
    candidateCount: matches.length,
    qualityFlag,
  };
}

export async function testSupportKnowledgeMatch(
  messageText: string,
): Promise<{
  matched: boolean;
  id?: string;
  title?: string;
  content?: string;
  matchSource: string;
  score: number;
}> {
  const entries = await prisma.supportKnowledge.findMany({
    where: { isActive: true },
  });

  if (entries.length === 0) {
    return { matched: false, matchSource: "none", score: 0 };
  }

  const matches = entries
    .map((entry) => {
      const result = scoreMatch(messageText, entry.title, entry.content, entry.category, entry.keywords);
      return {
        id: entry.id,
        title: entry.title,
        content: entry.content,
        score: result.score,
        matchSource: result.matchSource === "none" ? "content" as const : result.matchSource,
      };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  if (matches.length === 0) {
    return { matched: false, matchSource: "none", score: 0 };
  }

  const best = matches[0];
  return {
    matched: true,
    id: best.id,
    title: best.title,
    content: best.content,
    matchSource: best.matchSource,
    score: best.score,
  };
}
