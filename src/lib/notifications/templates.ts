import type { NotificationTemplate } from "./types";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Đang chờ xử lý",
  PURCHASED: "Đã đặt mua",
  SELLER_SHIPPED: "Shop đã gửi hàng",
  ARRIVED_CHINA_WH: "Đã tới kho Trung Quốc",
  PACKING: "Đang đóng gói tại kho",
  SHIPPING_TO_VIETNAM: "Đang trên đường về Việt Nam",
  ARRIVED_VIETNAM_WH: "Đã tới kho Việt Nam",
  OUT_FOR_DELIVERY: "Đang giao đến bạn",
  COMPLETED: "Đã giao thành công",
  CANCELLED: "Đã huỷ",
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

export function orderCreatedTemplate(params: {
  orderCode: string;
  userName?: string;
}): NotificationTemplate {
  const name = params.userName || "bạn";
  return {
    subject: `Đơn ${params.orderCode} đã được tạo`,
    body: `Chào ${name}, đơn hàng ${params.orderCode} của bạn đã được tiếp nhận. Chúng tôi sẽ cập nhật khi có tiến triển mới.`,
    html: [
      `<p>Chào ${name},</p>`,
      `<p>Đơn hàng <strong>${params.orderCode}</strong> đã được tiếp nhận và đang xử lý.</p>`,
      `<p>Bạn sẽ nhận thông báo ngay khi đơn hàng có cập nhật mới.</p>`,
      `<p>Trân trọng,<br/>Công ty TNHH Bắc Trung Hải Logistics</p>`,
    ].join("\n"),
  };
}

export function shipmentStatusChangedTemplate(params: {
  orderCode: string;
  fromStatus: string;
  toStatus: string;
  userName?: string;
}): NotificationTemplate {
  const name = params.userName || "bạn";
  const to = statusLabel(params.toStatus);
  return {
    subject: `Đơn ${params.orderCode}: ${to}`,
    body: `Chào ${name}, đơn ${params.orderCode} vừa cập nhật: ${statusLabel(params.fromStatus)} → ${to}.`,
    html: [
      `<p>Chào ${name},</p>`,
      `<p>Đơn hàng <strong>${params.orderCode}</strong> vừa được cập nhật:</p>`,
      `<p>${statusLabel(params.fromStatus)} → <strong>${to}</strong></p>`,
      `<p>Trân trọng,<br/>Công ty TNHH Bắc Trung Hải Logistics</p>`,
    ].join("\n"),
  };
}
