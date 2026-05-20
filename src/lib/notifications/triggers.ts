import { sendNotification } from "./service";
import { orderCreatedTemplate, shipmentStatusChangedTemplate } from "./templates";
import type { NotificationChannel, NotificationResult } from "./types";

const DEFAULT_CHANNELS: NotificationChannel[] = ["SYSTEM"];
const ALL_CHANNELS: NotificationChannel[] = ["SYSTEM", "TELEGRAM", "ZALO", "EMAIL"];

export async function onOrderCreated(params: {
  userId: string;
  userEmail?: string;
  userName?: string;
  orderId: string;
  orderCode: string;
  channels?: NotificationChannel[];
}): Promise<NotificationResult> {
  const template = orderCreatedTemplate({
    orderCode: params.orderCode,
    userName: params.userName,
  });

  return sendNotification({
    userId: params.userId,
    userEmail: params.userEmail,
    userName: params.userName,
    title: template.subject,
    message: template.body,
    orderId: params.orderId,
    orderCode: params.orderCode,
    channels: params.channels ?? DEFAULT_CHANNELS,
  });
}

export async function onShipmentStatusChanged(params: {
  userId: string;
  userEmail?: string;
  userName?: string;
  orderId: string;
  orderCode: string;
  fromStatus: string;
  toStatus: string;
  channels?: NotificationChannel[];
}): Promise<NotificationResult> {
  const template = shipmentStatusChangedTemplate({
    orderCode: params.orderCode,
    fromStatus: params.fromStatus,
    toStatus: params.toStatus,
    userName: params.userName,
  });

  return sendNotification({
    userId: params.userId,
    userEmail: params.userEmail,
    userName: params.userName,
    title: template.subject,
    message: template.body,
    orderId: params.orderId,
    orderCode: params.orderCode,
    channels: params.channels ?? DEFAULT_CHANNELS,
  });
}

const ISSUE_STATUS_LABELS: Record<string, string> = {
  NEW: "Mới",
  IN_PROGRESS: "Đang xử lý",
  WAITING_CUSTOMER: "Chờ khách phản hồi",
  RESOLVED: "Đã giải quyết",
};

const ISSUE_TYPE_LABELS: Record<string, string> = {
  THIEU_HANG: "Thiếu hàng",
  GIAO_CHAM: "Giao chậm",
  SAI_CAN: "Sai cân nặng",
  HONG_HANG: "Hỏng hàng",
  CHUA_NHAN: "Chưa nhận được hàng",
  PHI_SAI: "Phí sai",
  CHATBOT: "Chatbot/Hỗ trợ",
  KHAC: "Khác",
};

export async function onCustomerIssueCreated(params: {
  userId: string;
  userEmail?: string;
  userName?: string;
  issueType: string;
  orderCode?: string;
  channels?: NotificationChannel[];
}): Promise<NotificationResult> {
  const typeLabel = ISSUE_TYPE_LABELS[params.issueType] || params.issueType;
  const orderRef = params.orderCode ? ` (đơn ${params.orderCode})` : "";
  return sendNotification({
    userId: params.userId,
    userEmail: params.userEmail,
    userName: params.userName,
    title: "Khiếu nại đã được gửi",
    message: `Chào ${params.userName || "bạn"}, khiếu nại "${typeLabel}"${orderRef} đã được tiếp nhận. Chúng tôi sẽ phản hồi sớm nhất.`,
    orderCode: params.orderCode,
    channels: params.channels ?? ALL_CHANNELS,
  });
}

export async function onCustomerIssueStatusChanged(params: {
  userId: string;
  userEmail?: string;
  userName?: string;
  issueType: string;
  newStatus: string;
  orderCode?: string;
  resolution?: string;
  channels?: NotificationChannel[];
}): Promise<NotificationResult> {
  const statusLabel = ISSUE_STATUS_LABELS[params.newStatus] || params.newStatus;
  const typeLabel = ISSUE_TYPE_LABELS[params.issueType] || params.issueType;
  const orderRef = params.orderCode ? ` (đơn ${params.orderCode})` : "";
  const resolutionNote = params.resolution ? `\nPhản hồi: ${params.resolution}` : "";
  return sendNotification({
    userId: params.userId,
    userEmail: params.userEmail,
    userName: params.userName,
    title: `Cập nhật khiếu nại: ${statusLabel}`,
    message: `Chào ${params.userName || "bạn"}, khiếu nại "${typeLabel}"${orderRef} đã được cập nhật: ${statusLabel}.${resolutionNote}`,
    orderCode: params.orderCode,
    channels: params.channels ?? ALL_CHANNELS,
  });
}

export async function onCustomerVisibleOrderNote(params: {
  userId: string;
  userEmail?: string;
  userName?: string;
  orderId: string;
  orderCode: string;
  noteContent: string;
  channels?: NotificationChannel[];
}): Promise<NotificationResult> {
  return sendNotification({
    userId: params.userId,
    userEmail: params.userEmail,
    userName: params.userName,
    title: `Đơn ${params.orderCode} — Cập nhật từ kho vận`,
    message: `Chào ${params.userName || "bạn"}, đơn ${params.orderCode} có cập nhật mới: ${params.noteContent}`,
    orderId: params.orderId,
    orderCode: params.orderCode,
    channels: params.channels ?? ALL_CHANNELS,
  });
}

const SALES_STATUS_LABELS: Record<string, string> = {
  NEW: "Mới",
  CONTACTED: "Đã liên hệ",
  PRICE_CONFIRMED: "Đã xác nhận giá",
  PAID: "Đã thanh toán",
  PROCESSING: "Đang xử lý",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export async function onSalesRequestStatusChanged(params: {
  userId: string;
  userEmail?: string;
  userName?: string;
  requestCode: string;
  productName: string;
  newStatus: string;
  confirmedPrice?: number;
  amountPaid?: number;
  walletBalance?: number;
  walletDebt?: number;
  channels?: NotificationChannel[];
}): Promise<NotificationResult> {
  const name = params.userName || "bạn";
  const statusLabel = SALES_STATUS_LABELS[params.newStatus] || params.newStatus;
  let title: string;
  let message: string;

  switch (params.newStatus) {
    case "PRICE_CONFIRMED": {
      const priceFormatted = params.confirmedPrice != null
        ? params.confirmedPrice.toLocaleString("vi-VN") + " VND"
        : "";
      title = `Giá đã được xác nhận — ${params.requestCode}`;
      message = `Chào ${name}, yêu cầu ${params.requestCode} — "${params.productName}" đã được xác nhận giá: ${priceFormatted}. Vui lòng vào mục "Đơn mua hàng" để thanh toán từ ví.`;
      break;
    }
    case "PAID": {
      const amtFormatted = params.amountPaid != null
        ? params.amountPaid.toLocaleString("vi-VN") + " VND"
        : "";
      title = `Thanh toán thành công — ${params.requestCode}`;
      message = `Chào ${name}, bạn đã thanh toán ${amtFormatted} cho yêu cầu ${params.requestCode} — "${params.productName}".`;
      if (params.walletBalance != null) {
        message += ` Số dư ví: ${params.walletBalance.toLocaleString("vi-VN")} VND.`;
      }
      if (params.walletDebt != null && params.walletDebt > 0) {
        message += ` Công nợ: ${params.walletDebt.toLocaleString("vi-VN")} VND.`;
      }
      break;
    }
    case "PROCESSING":
      title = `Đang xử lý — ${params.requestCode}`;
      message = `Chào ${name}, yêu cầu ${params.requestCode} — "${params.productName}" đang được xử lý. Chúng tôi sẽ thông báo khi hoàn thành.`;
      break;
    case "COMPLETED":
      title = `Hoàn thành — ${params.requestCode}`;
      message = `Chào ${name}, yêu cầu ${params.requestCode} — "${params.productName}" đã hoàn thành. Cảm ơn bạn đã sử dụng dịch vụ Bắc Trung Hải Logistics!`;
      break;
    case "CANCELLED":
      title = `Đã hủy — ${params.requestCode}`;
      message = `Chào ${name}, yêu cầu ${params.requestCode} — "${params.productName}" đã bị hủy. Vui lòng liên hệ hỗ trợ nếu cần.`;
      break;
    default:
      title = `Cập nhật yêu cầu mua hàng — ${params.requestCode}`;
      message = `Chào ${name}, yêu cầu ${params.requestCode} — "${params.productName}" đã chuyển sang: ${statusLabel}.`;
  }

  return sendNotification({
    userId: params.userId,
    userEmail: params.userEmail,
    userName: params.userName,
    title,
    message,
    channels: params.channels ?? DEFAULT_CHANNELS,
  });
}

export async function onWalletEvent(params: {
  userId: string;
  userEmail?: string;
  userName?: string;
  title: string;
  message: string;
  channels?: NotificationChannel[];
}): Promise<NotificationResult> {
  return sendNotification({
    userId: params.userId,
    userEmail: params.userEmail,
    userName: params.userName,
    title: params.title,
    message: params.message,
    channels: params.channels ?? ALL_CHANNELS,
  });
}
