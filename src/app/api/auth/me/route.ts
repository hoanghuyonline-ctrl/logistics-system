export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, jsonResponse, errorResponse } from "@/lib/utils";

export async function GET() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return errorResponse("Unauthorized", 401);

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      address: true,
      role: true,
      telegramChatId: true,
      createdAt: true,
    },
  });

  return jsonResponse(user);
}
