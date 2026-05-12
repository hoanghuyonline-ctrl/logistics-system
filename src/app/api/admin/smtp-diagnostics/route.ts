export const dynamic = "force-dynamic";

import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";

const SMTP_KEYS = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"] as const;

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const result = SMTP_KEYS.map((key) => ({
    key,
    configured: !!process.env[key],
  }));

  return jsonResponse(result);
}
