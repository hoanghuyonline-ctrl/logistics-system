export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";

/**
 * GET /api/auth/biometric/credentials
 * Lists all registered biometric passkey credentials for the current logged-in user.
 */
export const GET = withErrorHandler(async function GET() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return errorResponse("Unauthorized", 401);

  const credentials = await prisma.credential.findMany({
    where: { userId: sessionUser.id },
    select: {
      id: true,
      name: true,
      credentialDeviceType: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return jsonResponse(credentials);
});

/**
 * DELETE /api/auth/biometric/credentials
 * Deletes a registered biometric passkey credential by its database ID, ensuring ownership.
 */
export const DELETE = withErrorHandler(async function DELETE(req: NextRequest) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return errorResponse("Unauthorized", 401);

  try {
    const body = await req.json();
    const { credentialId } = body as { credentialId: string };

    if (!credentialId) {
      return errorResponse("Thiếu thông tin ID thiết bị cần xóa.", 400);
    }

    // Guard: ensure the user owns this credential
    const cred = await prisma.credential.findUnique({
      where: { id: credentialId },
    });

    if (!cred) {
      return errorResponse("Không tìm thấy thiết bị này trên hệ thống.", 404);
    }

    if (cred.userId !== sessionUser.id) {
      return errorResponse("Bạn không có quyền xóa thiết bị này.", 403);
    }

    await prisma.credential.delete({
      where: { id: credentialId },
    });

    return jsonResponse({ success: true, message: "Đã xóa thiết bị thành công." });
  } catch (err) {
    console.error("[biometric/credentials/delete] Error:", err);
    return errorResponse("Lỗi máy chủ nội bộ khi xóa thiết bị.", 500);
  }
});
