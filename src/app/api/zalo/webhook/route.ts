export const dynamic = "force-dynamic";

/**
 * POST — Receive incoming Zalo OA webhook events.
 * Logs payload safely and returns 200 to acknowledge receipt.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log(
      "[zalo/webhook] Received event:",
      JSON.stringify(body, null, 2)
    );

    return Response.json({ status: "ok" }, { status: 200 });
  } catch (err) {
    console.error("[zalo/webhook] Error processing webhook:", err);
    return Response.json({ status: "ok" }, { status: 200 });
  }
}
