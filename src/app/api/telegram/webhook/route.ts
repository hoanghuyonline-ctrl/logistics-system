export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getNotificationConfig } from "@/lib/notification-config";

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

interface TelegramMessage {
  message_id: number;
  from?: { id: number; first_name?: string };
  chat: { id: number; type: string };
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

async function replyToChat(chatId: number, text: string): Promise<void> {
  const token = await getNotificationConfig("telegram_bot_token");
  if (!token) return;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
}

function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

async function handleStartCommand(chatId: number): Promise<void> {
  const text =
    "Chào mừng bạn đến với Bắc Trung Hải Logistics.\n" +
    "Bạn có thể gửi mã đơn hàng để tra cứu trạng thái.";
  await replyToChat(chatId, text);
}

async function handleOrderLookup(chatId: number, text: string): Promise<void> {
  const orderCode = text.trim();

  const order = await prisma.order.findUnique({
    where: { orderCode },
    select: {
      orderCode: true,
      productName: true,
      status: true,
      createdAt: true,
    },
  });

  if (!order) {
    await replyToChat(chatId, "Không tìm thấy đơn hàng");
    return;
  }

  const reply =
    `<b>Đơn hàng: ${order.orderCode}</b>\n` +
    `Sản phẩm: ${order.productName}\n` +
    `Trạng thái: ${statusLabel(order.status)}\n` +
    `Ngày tạo: ${order.createdAt.toLocaleDateString("vi-VN")}`;
  await replyToChat(chatId, reply);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TelegramUpdate;
    const message = body.message;
    if (!message || !message.text) {
      return Response.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    if (text === "/start") {
      await handleStartCommand(chatId);
    } else {
      await handleOrderLookup(chatId, text);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[telegram/webhook] Error:", error);
    return Response.json({ ok: true });
  }
}
