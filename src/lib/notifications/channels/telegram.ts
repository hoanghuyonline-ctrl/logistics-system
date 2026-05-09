import { getNotificationConfig } from "@/lib/notification-config";

const API_BASE = "https://api.telegram.org/bot";

export interface TelegramOptions {
  text: string;
  chatId?: string;
}

export async function sendTelegram(options: TelegramOptions): Promise<void> {
  const token = await getNotificationConfig("telegram_bot_token");
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }

  const chatId = options.chatId || (await getNotificationConfig("telegram_chat_id"));
  if (!chatId) {
    throw new Error("TELEGRAM_CHAT_ID is not configured");
  }

  const url = `${API_BASE}${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: options.text,
      parse_mode: "HTML",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram API error ${res.status}: ${body}`);
  }
}
