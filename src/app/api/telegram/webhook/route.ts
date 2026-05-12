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

async function handleHelpCommand(chatId: number): Promise<void> {
  const text =
    "📖 <b>Hướng dẫn sử dụng Bot Bắc Trung Hải Logistics</b>\n\n" +
    "Để tra cứu đơn hàng, bạn chỉ cần gửi mã đơn hàng.\n" +
    "Ví dụ: <code>ORD-20260505-K1L2</code>\n\n" +
    "<b>Lệnh hỗ trợ:</b>\n" +
    "/start — Bắt đầu sử dụng bot\n" +
    "/help — Xem hướng dẫn sử dụng\n\n" +
    "Nếu cần hỗ trợ trực tiếp, vui lòng liên hệ Công ty TNHH Bắc Trung Hải Logistics.";
  await replyToChat(chatId, text);
}

async function handleStartCommand(chatId: number): Promise<void> {
  const text =
    "Xin chào! 👋 Cảm ơn bạn đã liên hệ <b>Bắc Trung Hải Logistics</b>.\n\n" +
    "Bạn có thể gửi <b>mã đơn hàng</b> để tra cứu trạng thái giao hàng.\n" +
    "Ví dụ: <code>ORD-20260505-K1L2</code>\n\n" +
    "Nếu cần hỗ trợ thêm, vui lòng liên hệ bộ phận chăm sóc khách hàng.";
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
    const reply =
      "Không tìm thấy đơn hàng với mã này.\n" +
      "Vui lòng kiểm tra lại mã đơn hàng của bạn.\n\n" +
      "Định dạng mã đơn: <code>ORD-XXXXXXXX-XXXX</code>\n" +
      "Ví dụ: <code>ORD-20260505-K1L2</code>";
    await replyToChat(chatId, reply);
    return;
  }

  const reply =
    `📦 <b>Thông tin đơn hàng</b>\n\n` +
    `🔖 Mã đơn: <code>${order.orderCode}</code>\n` +
    `📋 Sản phẩm: ${order.productName}\n` +
    `📍 Trạng thái: <b>${statusLabel(order.status)}</b>\n` +
    `📅 Ngày tạo: ${order.createdAt.toLocaleDateString("vi-VN")}\n\n` +
    `Nếu cần hỗ trợ, vui lòng liên hệ bộ phận chăm sóc khách hàng.`;
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

    if (text === "/start" || text.startsWith("/start@") || text.startsWith("/start ")) {
      await handleStartCommand(chatId);
    } else if (text === "/help" || text.startsWith("/help@") || text.startsWith("/help ")) {
      await handleHelpCommand(chatId);
    } else if (text.startsWith("/")) {
      // Ignore unrecognized bot commands
    } else {
      await handleOrderLookup(chatId, text);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[telegram/webhook] Error:", error);
    return Response.json({ ok: true });
  }
}
