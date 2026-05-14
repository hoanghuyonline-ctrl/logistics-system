import { prisma } from "../prisma";
import { sendEmail } from "./channels/email";
import { sendTelegram } from "./channels/telegram";
import { sendZalo } from "./channels/zalo";
import type {
  NotificationPayload,
  NotificationResult,
  ChannelSendResult,
} from "./types";

function classifyFailure(error: string): string {
  const lower = error.toLowerCase();
  if (lower.includes("token") && (lower.includes("expired") || lower.includes("invalid"))) return "TOKEN_EXPIRED";
  if (lower.includes("recipient") || lower.includes("user not found") || lower.includes("not found")) return "INVALID_RECIPIENT";
  if (lower.includes("permission") || lower.includes("forbidden") || lower.includes("403")) return "PERMISSION_DENIED";
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("timeout") || lower.includes("econnrefused")) return "NETWORK_ERROR";
  if (lower.includes("not configured") || lower.includes("missing") || lower.includes("no email")) return "CONFIG_MISSING";
  return "UNKNOWN";
}

function logChannelResult(
  channel: string,
  payload: NotificationPayload,
  success: boolean,
  recipient?: string,
  error?: string,
): void {
  const parts = [
    `[notify/${channel.toLowerCase()}] ${success ? "OK" : "FAIL"}`,
    payload.orderCode ? `đơn=${payload.orderCode}` : null,
    `customerId=${payload.userId}`,
    recipient ? `recipient=${recipient}` : null,
    error ? `reason=${error}` : null,
  ].filter(Boolean);
  if (success) {
    console.log(parts.join(" | "));
  } else {
    console.error(parts.join(" | "));
  }
}

function persistFailure(
  channel: string,
  payload: NotificationPayload,
  error: string,
  recipient?: string,
): void {
  prisma.notificationFailure
    .create({
      data: {
        channel,
        orderCode: payload.orderCode ?? null,
        customerId: payload.userId,
        recipient: recipient ?? null,
        failureCategory: classifyFailure(error),
        shortReason: error.slice(0, 500),
        payloadSummary: `${payload.title}: ${payload.message}`.slice(0, 500),
      },
    })
    .catch((e) => console.error("[notify/failure] persist error:", e instanceof Error ? e.message : String(e)));
}

async function sendToChannel(
  channel: NotificationPayload["channels"][number],
  payload: NotificationPayload,
): Promise<ChannelSendResult> {
  try {
    switch (channel) {
      case "SYSTEM":
        logChannelResult(channel, payload, true);
        return { channel, success: true };

      case "EMAIL": {
        if (!payload.userEmail) {
          logChannelResult(channel, payload, false, undefined, "No email address");
          persistFailure(channel, payload, "No email address");
          return { channel, success: false, error: "No email address" };
        }
        await sendEmail({
          to: payload.userEmail,
          subject: payload.title,
          text: payload.message,
        });
        logChannelResult(channel, payload, true, payload.userEmail);
        return { channel, success: true };
      }

      case "TELEGRAM": {
        const tgUser = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { telegramChatId: true },
        });
        if (!tgUser?.telegramChatId) {
          logChannelResult(channel, payload, false, undefined, "TELEGRAM_NOT_BOUND");
          persistFailure(channel, payload, "TELEGRAM_NOT_BOUND");
          return { channel, success: false, error: "TELEGRAM_NOT_BOUND" };
        }
        await sendTelegram({
          text: `<b>${payload.title}</b>\n${payload.message}`,
          chatId: tgUser.telegramChatId,
        });
        logChannelResult(channel, payload, true, tgUser.telegramChatId);
        return { channel, success: true };
      }

      case "ZALO": {
        const zaloUser = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { zaloRecipientId: true },
        });
        if (!zaloUser?.zaloRecipientId) {
          logChannelResult(channel, payload, false, undefined, "ZALO_NOT_BOUND");
          persistFailure(channel, payload, "ZALO_NOT_BOUND");
          return { channel, success: false, error: "ZALO_NOT_BOUND" };
        }
        await sendZalo({
          text: `${payload.title}\n${payload.message}`,
          orderCode: payload.orderCode,
          recipientId: zaloUser.zaloRecipientId,
        });
        logChannelResult(channel, payload, true, zaloUser.zaloRecipientId);
        return { channel, success: true };
      }

      default:
        return { channel, success: false, error: "Unknown channel" };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logChannelResult(channel, payload, false, undefined, message);
    persistFailure(channel, payload, message);
    return { channel, success: false, error: message };
  }
}

export async function sendNotification(
  payload: NotificationPayload,
): Promise<NotificationResult> {
  const channels = payload.channels.length > 0 ? payload.channels : ["SYSTEM" as const];

  const notification = await prisma.notification.create({
    data: {
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      type: channels.includes("EMAIL") ? "EMAIL" : channels.includes("TELEGRAM") ? "TELEGRAM" : "SYSTEM",
      orderId: payload.orderId,
    },
  });

  const nonSystemChannels = channels.filter((ch) => ch !== "SYSTEM");
  const results = await Promise.allSettled(
    nonSystemChannels.map((ch) => sendToChannel(ch, payload)),
  );

  const channelResults: ChannelSendResult[] = [
    { channel: "SYSTEM", success: true },
    ...results.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : { channel: nonSystemChannels[i], success: false, error: String(r.reason) },
    ),
  ];

  return { notificationId: notification.id, channels: channelResults };
}
