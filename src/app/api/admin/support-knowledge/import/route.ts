import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { parseSections } from "@/lib/knowledge-import";
import type { NextRequest } from "next/server";

export const POST = withErrorHandler(async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await req.json();
  const { text, category } = body;

  if (!text || typeof text !== "string" || !text.trim()) {
    return errorResponse("Nội dung không được để trống", 400);
  }

  if (!category || typeof category !== "string") {
    return errorResponse("Danh mục là bắt buộc", 400);
  }

  const sections = parseSections(text);

  if (sections.length === 0) {
    return errorResponse(
      "Không tìm thấy mục nào. Vui lòng sử dụng dấu # hoặc dòng kết thúc bằng : để phân tách các mục.",
      400,
    );
  }

  const created = [];
  for (const section of sections) {
    const entry = await prisma.supportKnowledge.create({
      data: {
        title: section.title,
        content: section.content,
        category,
        isActive: true,
      },
    });
    created.push(entry);
  }

  console.log(
    `[admin/knowledge-import] imported=${created.length} category="${category}"`,
  );

  return jsonResponse({ count: created.length, entries: created }, 201);
});
