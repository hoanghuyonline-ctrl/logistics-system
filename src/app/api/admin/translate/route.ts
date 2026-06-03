export const dynamic = "force-dynamic";

import { getCurrentUser, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { translateText } from "@/lib/translate";
import type { NextRequest } from "next/server";

export const POST = withErrorHandler(async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "STAFF", "WAREHOUSE_CN", "WAREHOUSE_VN", "ACCOUNTANT"].includes(user.role)) {
    return errorResponse("Forbidden", 403);
  }

  const body = await req.json();
  const { text } = body;

  if (!text || typeof text !== "string") {
    return errorResponse("Text parameter is required and must be a string", 400);
  }

  try {
    const result = await translateText(text);
    return jsonResponse(result);
  } catch (error: any) {
    return errorResponse(error.message || "Translation error", 500);
  }
});
