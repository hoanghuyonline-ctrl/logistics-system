import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "ACCOUNTANT"])) {
    return errorResponse("Forbidden", 403);
  }

  const requests = await prisma.walletTopUpRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
      confirmer: {
        select: { fullName: true },
      },
    },
  });

  return jsonResponse(requests);
}
