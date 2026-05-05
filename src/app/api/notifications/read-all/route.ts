import { prisma } from "@/lib/prisma";
import { getCurrentUser, jsonResponse, errorResponse } from "@/lib/utils";

export async function PATCH() {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  return jsonResponse({ message: "All notifications marked as read" });
}
