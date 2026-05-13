export interface ParsedSection {
  title: string;
  content: string;
}

export function parseSections(text: string): ParsedSection[] {
  const lines = text.split("\n");
  const sections: ParsedSection[] = [];
  let currentTitle = "";
  let currentLines: string[] = [];

  function flushSection() {
    const content = currentLines.join("\n").trim();
    if (currentTitle && content) {
      sections.push({ title: currentTitle.trim(), content });
    }
    currentTitle = "";
    currentLines = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();

    // Match "# heading" or "## heading"
    const headingMatch = trimmed.match(/^#{1,2}\s+(.+)$/);
    if (headingMatch) {
      flushSection();
      currentTitle = headingMatch[1];
      continue;
    }

    // Match "Some title:" at end of line (min 4 chars before colon)
    const colonMatch = trimmed.match(/^(.{4,}):$/);
    if (colonMatch) {
      flushSection();
      currentTitle = colonMatch[1];
      continue;
    }

    currentLines.push(line);
  }

  flushSection();
  return sections;
}
