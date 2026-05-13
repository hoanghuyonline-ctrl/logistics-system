export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getNotificationConfig } from "@/lib/notification-config";
import { findSupportKnowledgeAnswer } from "@/lib/support-knowledge";

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

const WELCOME_MESSAGE =
  "Xin chào, Bắc Trung Hải Logistics đã nhận được tin nhắn của quý khách.\n\n" +
  "Quý khách có thể gửi mã đơn hàng để tra cứu trạng thái.";

const BIND_SUCCESS_MESSAGE =
  "✅ Zalo đã được liên kết với tài khoản của quý khách.\n" +
  "Các cập nhật vận chuyển sẽ được gửi tự động qua Zalo.";

async function tryBindZaloRecipient(
  senderId: string,
  matchedUserId: string,
  orderCode: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: matchedUserId },
    select: { zaloRecipientId: true },
  });

  if (!user) {
    console.log(
      `[zalo/bind] SKIP — user not found | senderId=${senderId} orderCode=${orderCode} matchedUserId=${matchedUserId}`
    );
    return false;
  }

  // Already bound to the same sender — no action needed
  if (user.zaloRecipientId === senderId) {
    console.log(
      `[zalo/bind] SKIP — already bound | senderId=${senderId} orderCode=${orderCode} matchedUserId=${matchedUserId}`
    );
    return false;
  }

  // Conflict: another Zalo account already bound to this customer
  if (user.zaloRecipientId && user.zaloRecipientId !== senderId) {
    console.warn(
      `[zalo/bind] CONFLICT — user already has different zaloRecipientId | senderId=${senderId} existing=${user.zaloRecipientId} orderCode=${orderCode} matchedUserId=${matchedUserId}`
    );
    return false;
  }

  // First-time bind
  await prisma.user.update({
    where: { id: matchedUserId },
    data: { zaloRecipientId: senderId },
  });
  console.log(
    `[zalo/bind] OK — bound | senderId=${senderId} orderCode=${orderCode} matchedUserId=${matchedUserId}`
  );
  return true;
}

async function replyToUser(userId: string, text: string): Promise<void> {
  const token = await getNotificationConfig("zalo_oa_access_token");
  if (!token) {
    console.warn("[zalo/webhook] ZALO_OA_ACCESS_TOKEN not configured — skipping reply");
    return;
  }

  const tokenHint = token.slice(0, 6) + "***";
  console.log(`[zalo/webhook] Sending reply to ${userId} (token: ${tokenHint})`);

  try {
    const res = await fetch("https://openapi.zalo.me/v3.0/oa/message/cs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: token,
      },
      body: JSON.stringify({
        recipient: { user_id: userId },
        message: { text },
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(
        `[zalo/webhook] Zalo API error — status: ${res.status}, body: ${errorBody}`
      );
      return;
    }

    const data = await res.json();
    if (data.error !== 0) {
      console.error(
        `[zalo/webhook] Zalo API returned error — code: ${data.error}, message: ${data.message || "unknown"}`
      );
      return;
    }

    console.log(`[zalo/webhook] Reply sent successfully to ${userId}`);
  } catch (err) {
    console.error("[zalo/webhook] Network error sending reply:", err);
  }
}

async function handleOrderLookup(userId: string, text: string): Promise<void> {
  const orderCode = text.trim();

  const order = await prisma.order.findUnique({
    where: { orderCode },
    select: {
      orderCode: true,
      userId: true,
      status: true,
      weightKg: true,
      totalCostVND: true,
    },
  });

  if (!order) {
    const reply =
      `📦 Bắc Trung Hải Logistics\n` +
      `Không tìm thấy đơn hàng với mã: ${orderCode}\n\n` +
      `Vui lòng kiểm tra lại mã đơn hàng.\n` +
      `Nếu cần hỗ trợ, quý khách có thể liên hệ nhân viên Bắc Trung Hải Logistics.`;
    await replyToUser(userId, reply);
    return;
  }

  // Auto-bind Zalo sender ID to the order's customer account
  try {
    const bound = await tryBindZaloRecipient(userId, order.userId, orderCode);
    if (bound) {
      await replyToUser(userId, BIND_SUCCESS_MESSAGE);
    }
  } catch (err) {
    console.error("[zalo/bind] FAIL | senderId=" + userId + " orderCode=" + orderCode, err);
  }

  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const lines: string[] = [
    `📦 Bắc Trung Hải Logistics`,
    ``,
    `Đơn hàng: ${order.orderCode}`,
    `📌 Trạng thái: ${statusLabel}`,
  ];

  if (order.weightKg !== null && order.weightKg !== undefined) {
    lines.push(`⚖️ Khối lượng: ${Number(order.weightKg)}kg`);
  }

  const cost = Number(order.totalCostVND);
  if (cost > 0) {
    lines.push(`💰 Tổng tiền: ${cost.toLocaleString("vi-VN")}đ`);
  }

  lines.push(
    ``,
    `Nếu cần hỗ trợ thêm, quý khách có thể gửi mã đơn hàng khác hoặc liên hệ nhân viên.`,
    ``,
    `Cảm ơn quý khách đã sử dụng dịch vụ Bắc Trung Hải Logistics.`,
  );

  await replyToUser(userId, lines.join("\n"));
}

interface ZaloWebhookPayload {
  event_name?: string;
  sender?: { id?: string };
  message?: { text?: string; msg_id?: string };
  timestamp?: string;
}

/**
 * POST — Receive incoming Zalo OA webhook events.
 * Handles user_send_text with auto-reply and order lookup.
 * Returns 200 to acknowledge receipt regardless of processing result.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ZaloWebhookPayload;

    console.log(
      "[zalo/webhook] Received event:",
      JSON.stringify(body, null, 2)
    );

    if (body.event_name === "user_send_text") {
      const userId = body.sender?.id;
      const text = body.message?.text?.trim();

      if (userId && text) {
        // Fire-and-forget: do not await to avoid blocking webhook response
        (async () => {
          try {
            if (/\d/.test(text) && !/\s/.test(text)) {
              await handleOrderLookup(userId, text);
            } else {
              const match = await findSupportKnowledgeAnswer(text, "ZALO");
              if (match) {
                console.log(
                  `[zalo/knowledge] matched=true | matchSource=${match.matchSource} id=${match.id} title="${match.title}" query="${text}"`
                );
                const reply =
                  `📦 Bắc Trung Hải Logistics\n\n` +
                  `${match.content}\n\n` +
                  `Nếu cần hỗ trợ thêm, quý khách có thể liên hệ nhân viên.`;
                await replyToUser(userId, reply);
              } else {
                console.log(
                  `[zalo/knowledge] matched=false | matchSource=none query="${text}"`
                );
                prisma.chatbotUnansweredQuestion.create({
                  data: { channel: "ZALO", question: text, senderId: userId },
                }).catch((e: unknown) => console.error("[zalo/unanswered] save error:", e));
                await replyToUser(userId, WELCOME_MESSAGE);
              }
            }
          } catch (err) {
            console.error("[zalo/webhook] Error handling user_send_text:", err);
          }
        })();
      }
    }

    return Response.json({ status: "ok" }, { status: 200 });
  } catch (err) {
    console.error("[zalo/webhook] Error processing webhook:", err);
    return Response.json({ status: "ok" }, { status: 200 });
  }
}
