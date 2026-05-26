import { prisma } from "@/lib/prisma";
import { getCurrentUser, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

export const POST = withErrorHandler(async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/orders/[id]/cancel">
) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const { id } = await ctx.params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, status: true, userId: true, orderCode: true },
  });

  if (!order) return errorResponse("Không tìm thấy đơn hàng", 404);

  if (order.userId !== user.id) {
    return errorResponse("Forbidden", 403);
  }

  if (order.status !== "PENDING") {
    return errorResponse(
      "Đơn hàng đã được xử lý hoặc mua hàng, không thể hủy.",
      400
    );
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: "CANCELLED",
      statusLogs: {
        create: {
          fromStatus: order.status,
          toStatus: "CANCELLED",
          changedBy: user.id,
          note: "Khách hàng tự hủy đơn",
        },
      },
    },
  });

  return jsonResponse({ success: true, order: { id: updated.id, status: updated.status } });
});
