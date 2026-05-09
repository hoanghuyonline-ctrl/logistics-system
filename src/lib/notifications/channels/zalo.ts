// TODO: Migrate to ZNS (Zalo Notification Service) templates for transactional messages
// TODO: Implement OAuth refresh flow for long-lived access tokens
// TODO: Add webhook handling for delivery receipts

const OA_ACCESS_TOKEN = process.env.ZALO_OA_ACCESS_TOKEN || "";
const RECIPIENT_ID = process.env.ZALO_RECIPIENT_ID || "";
const SEND_ENABLED = process.env.ZALO_SEND_ENABLED === "true";
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
  const recipientId = options.recipientId || RECIPIENT_ID;

  if (!SEND_ENABLED) {
    const log: ZaloSendLog = {
      timestamp, orderCode: options.orderCode, recipientId: recipientId || "(chưa đặt)",
      success: false, failureCategory: "CONFIG_MISSING", errorReason: "ZALO_SEND_ENABLED chưa bật",
    };
    logZaloSend(log);
    return log;
  }

  const token = OA_ACCESS_TOKEN;
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
