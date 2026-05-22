import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import { sendEmail } from "@/lib/notifications/channels/email";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const timestamp = new Date().toISOString();

  if (!user.email) {
    return jsonResponse({
      success: false,
      error: "Tài khoản admin chưa có email — không thể gửi thử",
      timestamp,
    });
  }

  const dbHost = await prisma.systemConfig.findUnique({ where: { key: "SMTP_HOST" } });
  const smtpHost = dbHost?.value || process.env.SMTP_HOST;

  if (!smtpHost) {
    return jsonResponse({
      success: false,
      error: "Chưa cấu hình SMTP_HOST — vui lòng cập nhật trong trang Cài đặt hoặc biến môi trường (.env)",
      timestamp,
    });
  }

  try {
    await sendEmail({
      to: user.email,
      subject: "Bắc Trung Hải Logistics — Email thử nghiệm",
      text: `Đây là email thử nghiệm từ hệ thống Bắc Trung Hải Logistics.\nGửi lúc: ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}\nSMTP: ${smtpHost}`,
      html:
        `<h3>Bắc Trung Hải Logistics</h3>` +
        `<p>Đây là email thử nghiệm từ hệ thống.</p>` +
        `<p><b>Thời gian:</b> ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</p>` +
        `<p><b>SMTP:</b> ${smtpHost}</p>` +
        `<p style="color:#888;font-size:12px">Email này được gửi từ trang quản trị Bắc Trung Hải Logistics.</p>`,
    });

    return jsonResponse({
      success: true,
      message: `Đã gửi email thử nghiệm đến ${user.email}`,
      timestamp,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[test-email] Admin ${user.email} gửi thử thất bại:`, message);
    return jsonResponse({
      success: false,
      error: `Gửi email thất bại: ${message}`,
      timestamp,
    });
  }
}
