import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "ACCOUNTANT"])) {
    return errorResponse("Forbidden", 403);
  }

  const logs = await prisma.bankWebhookLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return jsonResponse(logs);
}
