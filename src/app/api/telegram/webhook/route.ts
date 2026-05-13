export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getNotificationConfig } from "@/lib/notification-config";
import { findSupportKnowledgeAnswer } from "@/lib/support-knowledge";

const FALLBACK_GUIDANCE =
  "Để tra cứu đơn hàng, vui lòng gửi đúng mã đơn hàng.\n\n" +
  "Ví dụ:\n" +
  "<code>BTH123456</code>\n\n" +
  "Bạn cũng có thể dùng /help để xem hướng dẫn.";

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

async function handleStatusCommand(chatId: number): Promise<void> {
  const text =
    "Để tra cứu trạng thái đơn hàng, vui lòng gửi mã đơn hàng.\n\n" +
    "Ví dụ:\n" +
    "<code>BTH123456</code>\n\n" +
    "Bot sẽ tự động kiểm tra trạng thái vận chuyển hiện tại.";
  await replyToChat(chatId, text);
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
    "👋 Chào mừng đến với <b>Bắc Trung Hải Logistics</b>\n\n" +
    "Bot hỗ trợ:\n" +
    "• Tra cứu trạng thái đơn hàng\n" +
    "• Hướng dẫn sử dụng nhanh\n\n" +
    "📦 Gửi trực tiếp mã đơn hàng để tra cứu\n" +
    "Ví dụ:\n" +
    "<code>BTH123456</code>\n\n" +
    "📚 Các lệnh hỗ trợ:\n" +
    "/help — Hướng dẫn sử dụng\n" +
    "/status — Hướng dẫn tra cứu đơn hàng\n\n" +
    "Cảm ơn quý khách đã sử dụng dịch vụ.";
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
      weightKg: true,
      totalCostVND: true,
    },
  });

  if (!order) {
    const reply =
      "Không tìm thấy đơn hàng với mã này.\n\n" +
      "Vui lòng kiểm tra lại mã đơn hàng, ví dụ:\n" +
      "<code>BTH123456</code>\n\n" +
      "Nếu mã đúng nhưng vẫn không tra được, vui lòng liên hệ Bắc Trung Hải Logistics để được hỗ trợ.";
    await replyToChat(chatId, reply);
    return;
  }

  const lines: string[] = [
    `📦 Đơn hàng: <code>${order.orderCode}</code>`,
    `📌 Trạng thái: <b>${statusLabel(order.status)}</b>`,
  ];

  if (order.weightKg !== null && order.weightKg !== undefined) {
    lines.push(`⚖️ Khối lượng: ${Number(order.weightKg)}kg`);
  }

  const cost = Number(order.totalCostVND);
  if (cost > 0) {
    lines.push(`💰 Tổng tiền: ${cost.toLocaleString("vi-VN")}đ`);
  }

  lines.push("", "Cảm ơn quý khách đã sử dụng Bắc Trung Hải Logistics.");

  await replyToChat(chatId, lines.join("\n"));
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
    } else if (text === "/status" || text.startsWith("/status@") || text.startsWith("/status ")) {
      await handleStatusCommand(chatId);
    } else if (text.startsWith("/")) {
      const reply =
        "Bot chưa hỗ trợ lệnh này.\n\n" +
        "Bạn có thể dùng:\n" +
        "/start — Bắt đầu sử dụng bot\n" +
        "/help — Xem hướng dẫn\n" +
        "/status — Hướng dẫn tra cứu trạng thái đơn hàng\n\n" +
        "Hoặc gửi trực tiếp mã đơn hàng để tra cứu.";
      await replyToChat(chatId, reply);
    } else if (/\d/.test(text) && !/\s/.test(text)) {
      await handleOrderLookup(chatId, text);
    } else {
      try {
        const match = await findSupportKnowledgeAnswer(text, "TELEGRAM");
        if (match) {
          console.log(
            `[telegram/knowledge] matched=true | channel=TELEGRAM score=${match.score} candidates=${match.candidateCount} matchSource=${match.matchSource} id=${match.id} title="${match.title}" keywords="${match.keywords || ""}" query="${text}"`
          );
          const reply =
            `📦 Bắc Trung Hải Logistics\n\n` +
            `${match.content}\n\n` +
            `Nếu cần hỗ trợ thêm, quý khách có thể liên hệ nhân viên.`;
          await replyToChat(chatId, reply);
        } else {
          console.log(
            `[telegram/knowledge] matched=false | channel=TELEGRAM score=0 candidates=0 matchSource=none query="${text}"`
          );
          prisma.chatbotUnansweredQuestion.create({
            data: { channel: "TELEGRAM", question: text, senderId: String(chatId) },
          }).catch((e: unknown) => console.error("[telegram/unanswered] save error:", e));
          await replyToChat(chatId, FALLBACK_GUIDANCE);
        }
      } catch (err) {
        console.error("[telegram/knowledge] Error:", err);
        await replyToChat(chatId, FALLBACK_GUIDANCE);
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[telegram/webhook] Error:", error);
    return Response.json({ ok: true });
  }
}
