import { prisma } from "../prisma";
import { sendEmail } from "./channels/email";
import { sendTelegram } from "./channels/telegram";
import { sendZalo } from "./channels/zalo";
import type {
  NotificationPayload,
  NotificationResult,
  ChannelSendResult,
} from "./types";

async function sendToChannel(
  channel: NotificationPayload["channels"][number],
  payload: NotificationPayload,
): Promise<ChannelSendResult> {
  try {
    switch (channel) {
      case "SYSTEM":
        return { channel, success: true };

      case "EMAIL": {
        if (!payload.userEmail) {
          return { channel, success: false, error: "No email address" };
        }
        await sendEmail({
          to: payload.userEmail,
          subject: payload.title,
          text: payload.message,
        });
        return { channel, success: true };
      }

      case "TELEGRAM": {
        await sendTelegram({ text: `<b>${payload.title}</b>\n${payload.message}` });
        return { channel, success: true };
      }

      case "ZALO": {
        await sendZalo({ text: `${payload.title}\n${payload.message}`, orderCode: payload.orderCode });
        return { channel, success: true };
      }

      default:
        return { channel, success: false, error: "Unknown channel" };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[notifications] ${channel} send failed:`, message);
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

  const results = await Promise.allSettled(
    channels
      .filter((ch) => ch !== "SYSTEM")
      .map((ch) => sendToChannel(ch, payload)),
  );

  const channelResults: ChannelSendResult[] = [
    { channel: "SYSTEM", success: true },
    ...results.map((r) =>
      r.status === "fulfilled"
        ? r.value
        : { channel: "EMAIL" as const, success: false, error: String(r.reason) },
    ),
  ];

  return { notificationId: notification.id, channels: channelResults };
}
