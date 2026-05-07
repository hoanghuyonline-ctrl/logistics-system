const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
const API_BASE = "https://api.telegram.org/bot";

export interface TelegramOptions {
  text: string;
  chatId?: string;
}

export async function sendTelegram(options: TelegramOptions): Promise<void> {
  const token = BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }

  const chatId = options.chatId || CHAT_ID;
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
