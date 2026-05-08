import type { NotificationTemplate } from "./types";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xử lý",
  PURCHASED: "Đã mua hàng",
  SELLER_SHIPPED: "Người bán đã gửi",
  ARRIVED_CHINA_WH: "Đã đến kho Trung Quốc",
  PACKING: "Đang đóng gói",
  SHIPPING_TO_VIETNAM: "Đang vận chuyển về Việt Nam",
  ARRIVED_VIETNAM_WH: "Đã đến kho Việt Nam",
  OUT_FOR_DELIVERY: "Đang giao hàng",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

export function orderCreatedTemplate(params: {
  orderCode: string;
  userName?: string;
}): NotificationTemplate {
  const greeting = params.userName ? `Xin chào ${params.userName}` : "Xin chào";
  return {
    subject: `Đơn hàng ${params.orderCode} — Tạo thành công`,
    body: `${greeting}, đơn hàng ${params.orderCode} của bạn đã được tạo và đang được xử lý.`,
    html: [
      `<p>${greeting},</p>`,
      `<p>Đơn hàng <strong>${params.orderCode}</strong> của bạn đã được tạo và đang được xử lý.</p>`,
      `<p>Chúng tôi sẽ thông báo khi trạng thái đơn hàng thay đổi.</p>`,
      `<p>— Nam Trung Hải Logistics</p>`,
    ].join("\n"),
  };
}

export function shipmentStatusChangedTemplate(params: {
  orderCode: string;
  fromStatus: string;
  toStatus: string;
  userName?: string;
}): NotificationTemplate {
  const greeting = params.userName ? `Xin chào ${params.userName}` : "Xin chào";
  const to = statusLabel(params.toStatus);
  return {
    subject: `Đơn hàng ${params.orderCode} — Trạng thái: ${to}`,
    body: `${greeting}, đơn hàng ${params.orderCode} của bạn đã chuyển từ ${statusLabel(params.fromStatus)} sang ${to}.`,
    html: [
      `<p>${greeting},</p>`,
      `<p>Đơn hàng <strong>${params.orderCode}</strong> của bạn đã cập nhật trạng thái:</p>`,
      `<p><strong>${statusLabel(params.fromStatus)}</strong> → <strong>${to}</strong></p>`,
      `<p>— Nam Trung Hải Logistics</p>`,
    ].join("\n"),
  };
}
