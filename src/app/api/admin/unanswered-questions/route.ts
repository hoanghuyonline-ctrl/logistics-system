import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const questions = await prisma.chatbotUnansweredQuestion.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return jsonResponse(questions);
}
