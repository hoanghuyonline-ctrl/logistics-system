export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Đang chờ xử lý",
  PURCHASED: "Đã đặt mua",
  SELLER_SHIPPED: "Shop đã gửi hàng",
  ARRIVED_CHINA_WH: "Đã tới kho Trung Quốc",
  PACKING: "Đang đóng gói tại kho",
  SHIPPING_TO_VIETNAM: "Đang trên đường về Việt Nam",
  ARRIVED_VIETNAM_WH: "Đã tới kho Việt Nam",
  OUT_FOR_DELIVERY: "Đang giao đến bạn",
  COMPLETED: "Đã giao thành công",
  CANCELLED: "Đã huỷ",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code")?.trim();

    if (!code) {
      return Response.json(
        { error: "Vui lòng nhập mã đơn hàng." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { orderCode: code },
      select: {
        orderCode: true,
        status: true,
        weightKg: true,
        totalCostVND: true,
      },
    });

    if (!order) {
      return Response.json({ found: false }, { status: 200 });
    }

    return Response.json({
      found: true,
      orderCode: order.orderCode,
      status: order.status,
      statusLabel: STATUS_LABELS[order.status] || order.status,
      weightKg: order.weightKg !== null && order.weightKg !== undefined
        ? Number(order.weightKg)
        : null,
      totalCostVND: Number(order.totalCostVND) > 0
        ? Number(order.totalCostVND)
        : null,
    });
  } catch (error) {
    console.error("[api/tracking] Error:", error);
    return Response.json(
      { error: "Đã xảy ra lỗi. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
