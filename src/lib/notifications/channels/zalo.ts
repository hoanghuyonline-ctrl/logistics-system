// TODO: Migrate to ZNS (Zalo Notification Service) templates for transactional messages
// TODO: Implement OAuth refresh flow for long-lived access tokens
// TODO: Add webhook handling for delivery receipts

const OA_ACCESS_TOKEN = process.env.ZALO_OA_ACCESS_TOKEN || "";
const RECIPIENT_ID = process.env.ZALO_RECIPIENT_ID || "";
const SEND_ENABLED = process.env.ZALO_SEND_ENABLED === "true";
const API_URL = "https://openapi.zalo.me/v3.0/oa/message/cs";

export interface ZaloOptions {
  text: string;
  recipientId?: string;
}

export async function sendZalo(options: ZaloOptions): Promise<void> {
  if (!SEND_ENABLED) {
    console.log("[zalo] Send disabled (ZALO_SEND_ENABLED !== 'true'), skipping");
    return;
  }

  const token = OA_ACCESS_TOKEN;
  if (!token) {
    throw new Error("ZALO_OA_ACCESS_TOKEN is not configured");
  }

  const recipientId = options.recipientId || RECIPIENT_ID;
  if (!recipientId) {
    throw new Error("ZALO_RECIPIENT_ID is not configured");
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: token,
    },
    body: JSON.stringify({
      recipient: { user_id: recipientId },
      message: { text: options.text },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zalo OA API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  if (data.error !== 0) {
    throw new Error(`Zalo OA API error code ${data.error}: ${data.message || "unknown"}`);
  }
}
