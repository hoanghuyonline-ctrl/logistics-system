import { prisma } from "@/lib/prisma";

interface KnowledgeMatch {
  id: string;
  title: string;
  content: string;
  score: number;
}

const MAX_REPLY_LENGTH = 500;

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[\s,./!?;:()\-–—]+/)
    .filter((w) => w.length >= 2);
}

export function scoreMatch(query: string, title: string, content: string, category: string): number {
  const normalizedQuery = normalize(query);
  const tokens = tokenize(query);

  if (tokens.length === 0) return 0;

  let score = 0;
  const normalizedTitle = normalize(title);
  const normalizedContent = normalize(content);
  const normalizedCategory = normalize(category);

  // Exact substring match in title (highest weight)
  if (normalizedTitle.includes(normalizedQuery)) {
    score += 10;
  }

  // Token-level matching
  for (const token of tokens) {
    if (normalizedTitle.includes(token)) score += 3;
    if (normalizedCategory.includes(token)) score += 2;
    if (normalizedContent.includes(token)) score += 1;
  }

  return score;
}

export async function findSupportKnowledgeAnswer(
  messageText: string,
): Promise<{ id: string; title: string; content: string } | null> {
  const entries = await prisma.supportKnowledge.findMany({
    where: { isActive: true },
  });

  if (entries.length === 0) return null;

  const matches: KnowledgeMatch[] = entries
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      content: entry.content,
      score: scoreMatch(messageText, entry.title, entry.content, entry.category),
    }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  if (matches.length === 0) return null;

  const best = matches[0];
  const content =
    best.content.length > MAX_REPLY_LENGTH
      ? best.content.slice(0, MAX_REPLY_LENGTH) + "..."
      : best.content;

  return { id: best.id, title: best.title, content };
}
