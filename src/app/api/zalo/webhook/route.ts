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

const GREETING_PATTERNS = /^(xin chào|chào|hello|hi|hey|alo|a lô|ad ơi|admin ơi|chào shop|chào bạn|mình cần hỗ trợ|hỗ trợ|help)$/i;

const GREETING_REPLY =
  "Xin chào 👋\n" +
  "Bắc Trung Hải Logistics có thể hỗ trợ:\n\n" +
  "• Tra cứu đơn hàng\n" +
  "• Kiểm tra trạng thái vận chuyển\n" +
  "• Hướng dẫn nạp tiền\n" +
  "• Giải đáp phí vận chuyển\n\n" +
  "Bạn có thể:\n" +
  "• Gửi mã đơn (ví dụ BTH123456)\n" +
  "• Hoặc nhập câu hỏi cần hỗ trợ.";

const FALLBACK_REPLY =
  "Hiện tại hệ thống chưa có câu trả lời phù hợp cho câu hỏi này.\n" +
  "Bộ phận hỗ trợ sẽ kiểm tra và phản hồi sớm nhất.\n\n" +
  "Bạn cũng có thể gửi mã đơn hàng để tra cứu trạng thái.";

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
    const msg = "ZALO_OA_ACCESS_TOKEN not configured";
    console.error(`[zalo/reply] FAIL | senderId=${userId} reason=${msg}`);
    throw new Error(msg);
  }

  const tokenHint = token.slice(0, 6) + "***";
  console.log(`[zalo/reply] SENDING | senderId=${userId} token=${tokenHint} textLen=${text.length}`);

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
    const msg = `Zalo API HTTP ${res.status}: ${errorBody}`;
    console.error(`[zalo/reply] FAIL | senderId=${userId} reason=${msg}`);
    throw new Error(msg);
  }

  const data = await res.json();
  if (data.error !== 0) {
    const msg = `Zalo API error ${data.error}: ${data.message || "unknown"}`;
    console.error(`[zalo/reply] FAIL | senderId=${userId} reason=${msg}`);
    throw new Error(msg);
  }

  console.log(`[zalo/reply] OK | senderId=${userId}`);
}

async function handleOrderLookup(userId: string, text: string): Promise<void> {
  const orderCode = text.trim();
  console.log(`[zalo/chat] branch=order_lookup | senderId=${userId} orderCode=${orderCode}`);

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
    console.log(`[zalo/chat] order_not_found | senderId=${userId} orderCode=${orderCode}`);
    const reply =
      `📦 Bắc Trung Hải Logistics\n` +
      `Không tìm thấy đơn hàng với mã: ${orderCode}\n\n` +
      `Vui lòng kiểm tra lại mã đơn hàng.\n` +
      `Nếu cần hỗ trợ, quý khách có thể liên hệ nhân viên Bắc Trung Hải Logistics.`;
    await replyToUser(userId, reply);
    return;
  }

  // Auto-bind Zalo sender ID to the order's customer account (non-blocking)
  try {
    const bound = await tryBindZaloRecipient(userId, order.userId, orderCode);
    if (bound) {
      try {
        await replyToUser(userId, BIND_SUCCESS_MESSAGE);
      } catch (bindReplyErr) {
        console.error(`[zalo/chat] bind_reply_failed | senderId=${userId} orderCode=${orderCode}`, bindReplyErr);
      }
    }
  } catch (err) {
    console.error(`[zalo/bind] FAIL | senderId=${userId} orderCode=${orderCode}`, err);
  }

  // Always send order status reply regardless of bind result

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
  recipient?: { id?: string };
  message?: { text?: string; msg_id?: string };
  follower?: { id?: string };
  timestamp?: string;
}

async function handleTextMessage(userId: string, text: string): Promise<void> {
  let branch = "unknown";
  try {
    // 1. Greeting detection
    if (GREETING_PATTERNS.test(text.trim())) {
      branch = "greeting";
      console.log(`[zalo/chat] branch=${branch} | senderId=${userId} text="${text}"`);
      await replyToUser(userId, GREETING_REPLY);
      console.log(`[zalo/chat] reply_success=true | branch=${branch} senderId=${userId}`);
      return;
    }

    // 2. Order code lookup (alphanumeric codes with digits, no spaces)
    if (/^[A-Za-z0-9\-_]+$/.test(text) && /\d/.test(text) && text.length >= 4) {
      branch = "order_lookup";
      await handleOrderLookup(userId, text);
      console.log(`[zalo/chat] reply_success=true | branch=${branch} senderId=${userId}`);
      return;
    }

    // 3. FAQ / SupportKnowledge matching
    const match = await findSupportKnowledgeAnswer(text, "ZALO");
    if (match) {
      branch = "support_knowledge";
      console.log(
        `[zalo/chat] branch=${branch} | senderId=${userId} score=${match.score} candidates=${match.candidateCount} matchSource=${match.matchSource} id=${match.id} title="${match.title}" query="${text}"`
      );
      const reply =
        `📦 Bắc Trung Hải Logistics\n\n` +
        `${match.content}\n\n` +
        `Nếu cần hỗ trợ thêm, quý khách có thể liên hệ nhân viên.`;
      await replyToUser(userId, reply);
      console.log(`[zalo/chat] reply_success=true | branch=${branch} senderId=${userId}`);
      return;
    }

    // 4. Fallback — no match found
    branch = "fallback";
    console.log(
      `[zalo/chat] branch=${branch} | senderId=${userId} query="${text}"`
    );
    prisma.chatbotUnansweredQuestion.create({
      data: { channel: "ZALO", question: text, senderId: userId },
    }).catch((e: unknown) => console.error("[zalo/unanswered] save error:", e));
    await replyToUser(userId, FALLBACK_REPLY);
    console.log(`[zalo/chat] reply_success=true | branch=${branch} senderId=${userId}`);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`[zalo/chat] reply_success=false | branch=${branch} senderId=${userId} error="${reason}"`);
    // Anti-silence: try fallback reply even on error (only if the error wasn't from replyToUser itself in fallback branch)
    if (branch !== "fallback") {
      try {
        await replyToUser(userId, FALLBACK_REPLY);
        console.log(`[zalo/chat] fallback_retry=true | senderId=${userId}`);
      } catch (retryErr) {
        console.error(`[zalo/chat] fallback_retry=false | senderId=${userId}`, retryErr);
      }
    }
  }
}

/**
 * POST — Receive incoming Zalo OA webhook events.
 * Handles user_send_text, follow, and other text events.
 * Returns 200 to acknowledge receipt regardless of processing result.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ZaloWebhookPayload;
    const eventName = body.event_name || "unknown";
    const senderId = body.sender?.id || body.follower?.id;

    console.log(
      `[zalo/webhook] event=${eventName} | senderId=${senderId || "(none)"} | raw=${JSON.stringify(body)}`
    );

    // Handle text messages
    if (eventName === "user_send_text") {
      const text = body.message?.text?.trim();

      if (!senderId || !text) {
        console.warn(`[zalo/webhook] SKIP | event=${eventName} senderId=${senderId || "(missing)"} text=${text ? "present" : "(missing)"}`);
        return Response.json({ status: "ok" }, { status: 200 });
      }

      // Fire-and-forget: do not await to avoid blocking webhook response
      handleTextMessage(senderId, text).catch((err) =>
        console.error(`[zalo/webhook] unhandled error in handleTextMessage | senderId=${senderId}`, err)
      );
    }
    // Handle follow event — greet new followers
    else if (eventName === "follow") {
      if (senderId) {
        console.log(`[zalo/chat] branch=follow | senderId=${senderId}`);
        replyToUser(senderId, GREETING_REPLY).catch((err) =>
          console.error(`[zalo/chat] follow_reply_failed | senderId=${senderId}`, err)
        );
      }
    }
    // Log all other events so nothing is silently ignored
    else {
      console.log(`[zalo/webhook] branch=ignored_event | event=${eventName} senderId=${senderId || "(none)"}`);
    }

    return Response.json({ status: "ok" }, { status: 200 });
  } catch (err) {
    console.error("[zalo/webhook] Error processing webhook:", err);
    return Response.json({ status: "ok" }, { status: 200 });
  }
}
