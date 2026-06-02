export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { findSupportKnowledgeAnswer } from "@/lib/support-knowledge";
import { upsertLeadFromChannel } from "@/lib/lead-intake";

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
  "Chào mừng đến với Bắc Trung Hải Logistics.\n\n" +
  "Vui lòng gửi mã đơn hàng để tra cứu trạng thái vận chuyển.\n\n" +
  "Ví dụ:\nORD-20260504-I9J0";

// [FIX] Verify X-Hub-Signature-256 from Meta to reject forged webhook calls.
// Returns true if valid (or if APP_SECRET not configured — graceful degradation).
function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.MESSENGER_APP_SECRET;
  if (!appSecret) {
    // Secret not configured: skip verification but warn
    console.warn("[messenger/webhook] MESSENGER_APP_SECRET not set — skipping signature check (insecure)");
    return true;
  }
  if (!signatureHeader?.startsWith("sha256=")) {
    console.warn("[messenger/webhook] Missing or malformed X-Hub-Signature-256 header");
    return false;
  }
  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const received = signatureHeader.slice(7); // strip "sha256="
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
  } catch {
    return false;
  }
}

async function sendMessage(recipientId: string, text: string): Promise<void> {
  const token = process.env.MESSENGER_PAGE_ACCESS_TOKEN;
  if (!token) {
    console.warn(
      "[messenger/webhook] ⚠️  MESSENGER_PAGE_ACCESS_TOKEN not configured — skipping reply.\n" +
      "  → Go to Meta Developer Dashboard → Your App → Messenger → Page Access Token → Generate Token\n" +
      "  → Paste the new token into .env as MESSENGER_PAGE_ACCESS_TOKEN=<token>"
    );
    return;
  }

  const tokenHint = token.slice(0, 6) + "***";
  console.log(`[messenger/webhook] Sending reply to ${recipientId} (token: ${tokenHint})`);

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      // [FIX] Detect OAuthException (token expired / revoked) for clear operator guidance
      let parsedError: { error?: { code?: number; type?: string; message?: string } } = {};
      try { parsedError = JSON.parse(errorBody); } catch { /* non-JSON body */ }
      const errCode = parsedError?.error?.code;
      const errType = parsedError?.error?.type;
      if (errType === "OAuthException" || errCode === 190 || errCode === 100) {
        console.error(
          `[messenger/webhook] 🔴 OAuthException (code ${errCode}) — Page Access Token is EXPIRED or INVALID.\n` +
          "  ACTION REQUIRED:\n" +
          "  1. Go to Meta Developer Dashboard → Your App → Messenger → Page Access Token\n" +
          "  2. Click 'Generate Token' for the correct Facebook Page\n" +
          "  3. Update MESSENGER_PAGE_ACCESS_TOKEN in .env / .env.local / server environment\n" +
          "  4. Restart PM2: pm2 restart logistics-system\n" +
          `  Raw error: ${errorBody}`
        );
      } else if (errCode === 10 || errCode === 200) {
        console.error(
          `[messenger/webhook] 🔴 Permission error (code ${errCode}) — App may be in Development mode.\n` +
          "  ACTION REQUIRED:\n" +
          "  1. Go to Meta Developer Dashboard → App Review → Permissions\n" +
          "  2. Request 'pages_messaging' Advanced Access (required for non-admin users)\n" +
          "  3. Switch App Mode from Development → Live\n" +
          `  Raw error: ${errorBody}`
        );
      } else {
        console.error(
          `[messenger/webhook] Graph API error — status: ${res.status}, body: ${errorBody}`
        );
      }
      return;
    }

    console.log(`[messenger/webhook] Reply sent successfully to ${recipientId} (status: ${res.status})`);
  } catch (err) {
    console.error("[messenger/webhook] Network error sending message:", err);
  }
}

async function handleOrderLookup(senderId: string, text: string): Promise<void> {
  const orderCode = text.trim();

  const order = await prisma.order.findUnique({
    where: { orderCode },
    select: {
      orderCode: true,
      status: true,
      weightKg: true,
      totalCostVND: true,
    },
  });

  if (!order) {
    const reply =
      "Không tìm thấy đơn hàng với mã này.\n\n" +
      "Vui lòng kiểm tra lại mã đơn hàng, ví dụ:\n" +
      "ORD-20260504-I9J0\n\n" +
      "Nếu mã đúng nhưng vẫn không tra được, vui lòng liên hệ Bắc Trung Hải Logistics để được hỗ trợ.";
    await sendMessage(senderId, reply);
    return;
  }

  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const lines: string[] = [
    `📦 Đơn hàng: ${order.orderCode}`,
    `📌 Trạng thái: ${statusLabel}`,
  ];

  if (order.weightKg !== null && order.weightKg !== undefined) {
    lines.push(`⚖️ Khối lượng: ${Number(order.weightKg)}kg`);
  }

  const cost = Number(order.totalCostVND);
  if (cost > 0) {
    lines.push(`💰 Tổng tiền: ${cost.toLocaleString("vi-VN")}đ`);
  }

  lines.push("", "Cảm ơn quý khách đã sử dụng Bắc Trung Hải Logistics.");

  await sendMessage(senderId, lines.join("\n"));
}

/**
 * GET — Meta webhook verification challenge.
 * Meta sends hub.mode, hub.verify_token, hub.challenge as query params.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.MESSENGER_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken && verifyToken) {
    console.log("[messenger/webhook] Verification successful");
    return new Response(challenge ?? "", { status: 200 });
  }

  console.warn("[messenger/webhook] Verification failed — token mismatch or missing");
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

interface MessengerEntry {
  id: string;
  time: number;
  messaging?: Array<{
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: {
      mid: string;
      text?: string;
    };
    postback?: {
      title: string;
      payload: string;
    };
  }>;
}

interface MessengerWebhookPayload {
  object: string;
  entry?: MessengerEntry[];
}

/**
 * POST — Receive incoming Messenger webhook events.
 * Logs events safely and returns 200 to acknowledge receipt.
 */
export async function POST(request: Request) {
  try {
    // [FIX] Read raw body text first for signature verification before parsing JSON
    const rawBody = await request.text();
    const signature = (request as unknown as { headers: { get: (k: string) => string | null } })
      .headers.get("x-hub-signature-256");

    if (!verifyMetaSignature(rawBody, signature)) {
      console.warn("[messenger/webhook] ⚠️  Signature mismatch — ignoring request (possible spoofed call)");
      // Still return 200 so Meta doesn't disable the webhook endpoint
      return Response.json({ ok: true });
    }

    let body: MessengerWebhookPayload;
    try {
      body = JSON.parse(rawBody) as MessengerWebhookPayload;
    } catch {
      console.error("[messenger/webhook] Invalid JSON payload");
      return Response.json({ ok: true });
    }

    // [FIX] Always return 200 for non-page objects — returning 404 causes Meta to block/disable the webhook
    if (body.object !== "page") {
      console.log(`[messenger/webhook] Non-page object type received: "${body.object}" — ignoring`);
      return Response.json({ ok: true });
    }

    if (body.entry) {
      for (const entry of body.entry) {
        if (!entry.messaging) continue;
        for (const event of entry.messaging) {
          const senderId = event.sender.id;
          const timestamp = event.timestamp;

          if (event.message?.text) {
            const text = event.message.text.trim();
            console.log(
              `[messenger/webhook] Text message from ${senderId} at ${timestamp}: "${text}"`
            );

            // Fire-and-forget: create/update CRM lead
            upsertLeadFromChannel({ channel: "FACEBOOK", senderId }).catch(() => {});

            if (/\d/.test(text) && !/\s/.test(text)) {
              await handleOrderLookup(senderId, text);
            } else {
              try {
                const match = await findSupportKnowledgeAnswer(text, "MESSENGER");
                if (match) {
                  console.log(
                    `[messenger/knowledge] matched=true | channel=MESSENGER score=${match.score} candidates=${match.candidateCount} matchSource=${match.matchSource} id=${match.id} title="${match.title}" keywords="${match.keywords || ""}" query="${text}"`
                  );
                  const reply =
                    `📦 Bắc Trung Hải Logistics\n\n` +
                    `${match.content}\n\n` +
                    `Nếu cần hỗ trợ thêm, quý khách có thể liên hệ nhân viên.`;
                  await sendMessage(senderId, reply);
                } else {
                  console.log(
                    `[messenger/knowledge] matched=false | channel=MESSENGER score=0 candidates=0 matchSource=none query="${text}"`
                  );
                  prisma.chatbotUnansweredQuestion.create({
                    data: { channel: "MESSENGER", question: text, senderId },
                  }).catch((e: unknown) => console.error("[messenger/unanswered] save error:", e));
                  await sendMessage(senderId, WELCOME_MESSAGE);
                }
              } catch (err) {
                console.error("[messenger/knowledge] Error:", err);
                await sendMessage(senderId, WELCOME_MESSAGE);
              }
            }
          } else if (event.postback) {
            console.log(
              `[messenger/webhook] Postback from ${senderId} at ${timestamp}: "${event.postback.payload}"`
            );
          } else {
            console.log(
              `[messenger/webhook] Event from ${senderId} at ${timestamp} (non-text)`
            );
          }
        }
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[messenger/webhook] Error:", error);
    return Response.json({ ok: true });
  }
}
