import { prisma } from "@/lib/prisma";
import { getCurrentUser, jsonResponse, errorResponse } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function PUT(request: Request) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  const { fullName, phone, address, telegramChatId } = body;

  const user = await prisma.user.update({
    where: { id: sessionUser.id },
    data: { fullName, phone, address, telegramChatId },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      address: true,
      role: true,
      telegramChatId: true,
    },
  });

  return jsonResponse(user);
}

export async function PATCH(request: Request) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return errorResponse("Current and new password are required");
  }

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) return errorResponse("User not found", 404);

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) return errorResponse("Current password is incorrect");

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: sessionUser.id },
    data: { password: hashed },
  });

  return jsonResponse({ message: "Password updated" });
}
