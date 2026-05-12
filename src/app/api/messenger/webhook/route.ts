export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";

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
    const body = (await request.json()) as MessengerWebhookPayload;

    if (body.object !== "page") {
      return Response.json({ error: "Unsupported object type" }, { status: 404 });
    }

    if (body.entry) {
      for (const entry of body.entry) {
        if (!entry.messaging) continue;
        for (const event of entry.messaging) {
          const senderId = event.sender.id;
          const timestamp = event.timestamp;

          if (event.message?.text) {
            console.log(
              `[messenger/webhook] Text message from ${senderId} at ${timestamp}: "${event.message.text}"`
            );
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
