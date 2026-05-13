import { prisma } from "@/lib/prisma";

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
}

export async function findSupportKnowledgeAnswer(
  messageText: string,
  channel?: string,
): Promise<KnowledgeAnswerResult | null> {
  const entries = await prisma.supportKnowledge.findMany({
    where: { isActive: true },
  });

  if (entries.length === 0) return null;

  const matches: KnowledgeMatch[] = entries
    .map((entry) => {
      const result = scoreMatch(messageText, entry.title, entry.content, entry.category, entry.keywords);
      return {
        id: entry.id,
        title: entry.title,
        content: entry.content,
        keywords: entry.keywords,
        score: result.score,
        matchSource: result.matchSource === "none" ? "content" : result.matchSource,
      };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  if (matches.length === 0) return null;

  const best = matches[0];
  const content =
    best.content.length > MAX_REPLY_LENGTH
      ? best.content.slice(0, MAX_REPLY_LENGTH) + "..."
      : best.content;

  trackKnowledgeMatch(best.id, channel);

  return {
    id: best.id,
    title: best.title,
    content,
    keywords: best.keywords,
    matchSource: best.matchSource,
    score: best.score,
    candidateCount: matches.length,
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
