import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { DEFAULT_TEMPLATES } from "@/lib/knowledge-templates";

export const POST = withErrorHandler(async function POST() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const existing = await prisma.supportKnowledge.findMany({
    select: { title: true },
  });
  const existingTitles = new Set(existing.map((e) => e.title));

  let created = 0;
  let skipped = 0;

  for (const template of DEFAULT_TEMPLATES) {
    if (existingTitles.has(template.title)) {
      skipped++;
      continue;
    }

    await prisma.supportKnowledge.create({
      data: {
        title: template.title,
        content: template.content,
        category: template.category,
        keywords: template.keywords,
        isActive: true,
      },
    });
    created++;
  }

  console.log(
    `[admin/knowledge-templates] created=${created} skipped=${skipped}`,
  );

  return jsonResponse({ created, skipped }, 201);
});
