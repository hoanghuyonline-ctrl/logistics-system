import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import { testSupportKnowledgeMatch } from "@/lib/support-knowledge";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await req.json();
  const { message } = body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return errorResponse("Câu hỏi không được để trống", 400);
  }

  const result = await testSupportKnowledgeMatch(message.trim());

  return jsonResponse(result);
}
