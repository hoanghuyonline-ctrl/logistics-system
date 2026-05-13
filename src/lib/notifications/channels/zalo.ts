// TODO: Migrate to ZNS (Zalo Notification Service) templates for transactional messages
// TODO: Implement OAuth refresh flow for long-lived access tokens
// TODO: Add webhook handling for delivery receipts

import { getNotificationConfig } from "@/lib/notification-config";
import { prisma } from "@/lib/prisma";

const API_URL = "https://openapi.zalo.me/v3.0/oa/message/cs";

export type ZaloFailureCategory =
  | "TOKEN_EXPIRED"
  | "INVALID_RECIPIENT"
  | "PERMISSION_DENIED"
  | "NETWORK_ERROR"
  | "CONFIG_MISSING"
  | "UNKNOWN";

export interface ZaloSendLog {
  timestamp: string;
  orderCode?: string;
  recipientId: string;
  success: boolean;
  failureCategory?: ZaloFailureCategory;
  errorReason?: string;
}

export interface ZaloOptions {
  text: string;
  recipientId?: string;
  orderCode?: string;
}

function classifyZaloError(statusCode: number, apiErrorCode: number, message: string): ZaloFailureCategory {
  if (statusCode === 401 || apiErrorCode === -216 || apiErrorCode === -230 ||
      /access.?token.*expir|token.*invalid|token.*hết/i.test(message)) {
    return "TOKEN_EXPIRED";
  }
  if (apiErrorCode === -213 || apiErrorCode === -217 ||
      /recipient.*invalid|user.*not.*found|người.*nhận.*không/i.test(message)) {
    return "INVALID_RECIPIENT";
  }
  if (statusCode === 403 || apiErrorCode === -201 ||
      /permission|forbidden|quyền/i.test(message)) {
    return "PERMISSION_DENIED";
  }
  if (/timeout|ECONNREFUSED|ENOTFOUND|network|fetch.*fail/i.test(message)) {
    return "NETWORK_ERROR";
  }
  return "UNKNOWN";
}

const FAILURE_LABELS: Record<ZaloFailureCategory, string> = {
  TOKEN_EXPIRED: "Token hết hạn — cần lấy token mới từ Zalo OA",
  INVALID_RECIPIENT: "Người nhận không hợp lệ — kiểm tra lại ZALO_RECIPIENT_ID",
  PERMISSION_DENIED: "Không có quyền gửi — kiểm tra quyền OA trên Zalo",
  NETWORK_ERROR: "Lỗi kết nối mạng — không thể gọi tới Zalo API",
  CONFIG_MISSING: "Thiếu cấu hình — kiểm tra biến môi trường Zalo",
  UNKNOWN: "Lỗi không xác định — xem chi tiết trong log server",
};

export function getFailureLabel(category: ZaloFailureCategory): string {
  return FAILURE_LABELS[category];
}

function logZaloSend(log: ZaloSendLog): void {
  const parts = [
    `[zalo] ${log.success ? "OK" : "FAIL"}`,
    log.orderCode ? `đơn=${log.orderCode}` : null,
    `recipient=${log.recipientId}`,
    log.failureCategory ? `loại=${log.failureCategory}` : null,
    log.errorReason ? `lý do: ${log.errorReason}` : null,
    `lúc ${log.timestamp}`,
  ].filter(Boolean);
  if (log.success) {
    console.log(parts.join(" | "));
  } else {
    console.error(parts.join(" | "));
  }
}

export async function sendZalo(options: ZaloOptions): Promise<ZaloSendLog> {
  const timestamp = new Date().toISOString();
  const recipientId = options.recipientId || (await getNotificationConfig("zalo_recipient_id"));
  const sendEnabled = (await getNotificationConfig("zalo_send_enabled")) === "true";

  if (!sendEnabled) {
    const log: ZaloSendLog = {
      timestamp, orderCode: options.orderCode, recipientId: recipientId || "(chưa đặt)",
      success: false, failureCategory: "CONFIG_MISSING", errorReason: "ZALO_SEND_ENABLED chưa bật",
    };
    logZaloSend(log);
    return log;
  }

  const token = await getNotificationConfig("zalo_oa_access_token");
  if (!token) {
    const log: ZaloSendLog = {
      timestamp, orderCode: options.orderCode, recipientId: recipientId || "(chưa đặt)",
      success: false, failureCategory: "CONFIG_MISSING", errorReason: "Thiếu ZALO_OA_ACCESS_TOKEN",
    };
    logZaloSend(log);
    throw new Error("ZALO_OA_ACCESS_TOKEN is not configured");
  }

  if (!recipientId) {
    const log: ZaloSendLog = {
      timestamp, orderCode: options.orderCode, recipientId: "(chưa đặt)",
      success: false, failureCategory: "CONFIG_MISSING", errorReason: "Thiếu ZALO_RECIPIENT_ID",
    };
    logZaloSend(log);
    throw new Error("ZALO_RECIPIENT_ID is not configured");
  }

  try {
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
      const category = classifyZaloError(res.status, 0, body);
      const log: ZaloSendLog = {
        timestamp, orderCode: options.orderCode, recipientId,
        success: false, failureCategory: category,
        errorReason: `HTTP ${res.status}: ${body.slice(0, 200)}`,
      };
      logZaloSend(log);
      throw new Error(getFailureLabel(category));
    }

    const data = await res.json();
    if (data.error !== 0) {
      const category = classifyZaloError(200, data.error, data.message || "");
      const log: ZaloSendLog = {
        timestamp, orderCode: options.orderCode, recipientId,
        success: false, failureCategory: category,
        errorReason: `Mã lỗi ${data.error}: ${data.message || "không rõ"}`,
      };
      logZaloSend(log);
      throw new Error(getFailureLabel(category));
    }

    const log: ZaloSendLog = { timestamp, orderCode: options.orderCode, recipientId, success: true };
    logZaloSend(log);
    return log;
  } catch (err) {
    if (err instanceof Error && Object.values(FAILURE_LABELS).includes(err.message)) {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    const category = classifyZaloError(0, 0, message);
    const log: ZaloSendLog = {
      timestamp, orderCode: options.orderCode, recipientId,
      success: false, failureCategory: category, errorReason: message,
    };
    logZaloSend(log);
    throw new Error(getFailureLabel(category));
  }
}

const ZALO_STATUS_TEMPLATES: Record<string, (orderCode: string) => string> = {
  PURCHASED: (c) => `🛒 Đơn hàng ${c} đã được đặt mua từ người bán.`,
  SELLER_SHIPPED: (c) => `📤 Đơn hàng ${c} — người bán đã gửi hàng.`,
  ARRIVED_CHINA_WH: (c) => `📦 Đơn hàng ${c} đã nhập kho Trung Quốc.`,
  PACKING: (c) => `📦 Đơn hàng ${c} đang được đóng gói tại kho.`,
  SHIPPING_TO_VIETNAM: (c) => `🚚 Đơn hàng ${c} đang vận chuyển về Việt Nam.`,
  ARRIVED_VIETNAM_WH: (c) => `🇻🇳 Đơn hàng ${c} đã tới kho Việt Nam.`,
  OUT_FOR_DELIVERY: (c) => `🚛 Đơn hàng ${c} đang được giao đến quý khách.`,
  COMPLETED: (c) => `✅ Đơn hàng ${c} đã giao thành công.`,
  CANCELLED: (c) => `❌ Đơn hàng ${c} đã bị huỷ.`,
};

export async function notifyZaloStatusChange(params: {
  userId: string;
  orderCode: string;
  toStatus: string;
}): Promise<void> {
  const { userId, orderCode, toStatus } = params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { zaloRecipientId: true },
  });

  if (!user?.zaloRecipientId) {
    console.log(
      `[zalo/status] Bỏ qua — khách hàng chưa có zaloRecipientId | đơn=${orderCode} customerId=${userId} status=${toStatus}`
    );
    return;
  }

  const templateFn = ZALO_STATUS_TEMPLATES[toStatus];
  if (!templateFn) {
    console.log(
      `[zalo/status] Bỏ qua — không có template cho status=${toStatus} | đơn=${orderCode}`
    );
    return;
  }

  const statusLine = templateFn(orderCode);
  const message = [
    `📦 Bắc Trung Hải Logistics`,
    ``,
    statusLine,
    ``,
    `Quý khách có thể gửi mã đơn hàng để tra cứu chi tiết.`,
    `Cảm ơn quý khách đã sử dụng dịch vụ Bắc Trung Hải Logistics.`,
  ].join("\n");

  try {
    const result = await sendZalo({
      text: message,
      recipientId: user.zaloRecipientId,
      orderCode,
    });
    console.log(
      `[zalo/status] ${result.success ? "OK" : "FAIL"} | đơn=${orderCode} customerId=${userId} recipientId=${user.zaloRecipientId} status=${toStatus}`
    );
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(
      `[zalo/status] FAIL | đơn=${orderCode} customerId=${userId} recipientId=${user.zaloRecipientId} status=${toStatus} | lý do: ${reason}`
    );
  }
}
