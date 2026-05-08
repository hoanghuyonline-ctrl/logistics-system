import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import { sendZalo } from "@/lib/notifications/channels/zalo";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  try {
    await sendZalo({
      text: `[TEST] Zalo OA notification test from Bắc Trung Hải Logistics at ${new Date().toISOString()}`,
    });
    return jsonResponse({ success: true, message: "Test Zalo message sent successfully" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ success: false, error: message }, 200);
  }
}
