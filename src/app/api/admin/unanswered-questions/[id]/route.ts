import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

export const PATCH = withErrorHandler(async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await params;
  const body = await req.json();
  const { resolved } = body;

  const existing = await prisma.chatbotUnansweredQuestion.findUnique({ where: { id } });
  if (!existing) {
    return errorResponse("Không tìm thấy câu hỏi", 404);
  }

  const updated = await prisma.chatbotUnansweredQuestion.update({
    where: { id },
    data: { resolved: resolved !== undefined ? resolved : true },
  });

  return jsonResponse(updated);
});
