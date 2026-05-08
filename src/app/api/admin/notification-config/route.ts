import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  return jsonResponse({
    zalo: {
      sendEnabled: process.env.ZALO_SEND_ENABLED === "true",
      accessTokenSet: !!process.env.ZALO_OA_ACCESS_TOKEN,
      recipientIdSet: !!process.env.ZALO_RECIPIENT_ID,
    },
    email: {
      smtpHostSet: !!process.env.SMTP_HOST,
      smtpUserSet: !!process.env.SMTP_USER,
      smtpFromSet: !!process.env.SMTP_FROM,
    },
  });
}
