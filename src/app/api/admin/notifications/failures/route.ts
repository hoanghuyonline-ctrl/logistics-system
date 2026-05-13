export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const failures = await prisma.notificationFailure.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return jsonResponse(failures);
}
