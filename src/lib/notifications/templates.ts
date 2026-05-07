import type { NotificationTemplate } from "./types";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PURCHASED: "Purchased",
  SELLER_SHIPPED: "Seller Shipped",
  ARRIVED_CHINA_WH: "Arrived at China Warehouse",
  PACKING: "Packing",
  SHIPPING_TO_VIETNAM: "Shipping to Vietnam",
  ARRIVED_VIETNAM_WH: "Arrived at Vietnam Warehouse",
  OUT_FOR_DELIVERY: "Out for Delivery",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

export function orderCreatedTemplate(params: {
  orderCode: string;
  userName?: string;
}): NotificationTemplate {
  const greeting = params.userName ? `Hi ${params.userName}` : "Hello";
  return {
    subject: `Order ${params.orderCode} — Created Successfully`,
    body: `${greeting}, your order ${params.orderCode} has been created and is now being processed.`,
    html: [
      `<p>${greeting},</p>`,
      `<p>Your order <strong>${params.orderCode}</strong> has been created and is now being processed.</p>`,
      `<p>We will notify you when the status changes.</p>`,
      `<p>— VN Logistics</p>`,
    ].join("\n"),
  };
}

export function shipmentStatusChangedTemplate(params: {
  orderCode: string;
  fromStatus: string;
  toStatus: string;
  userName?: string;
}): NotificationTemplate {
  const greeting = params.userName ? `Hi ${params.userName}` : "Hello";
  const to = statusLabel(params.toStatus);
  return {
    subject: `Order ${params.orderCode} — Status: ${to}`,
    body: `${greeting}, your order ${params.orderCode} status has changed from ${statusLabel(params.fromStatus)} to ${to}.`,
    html: [
      `<p>${greeting},</p>`,
      `<p>Your order <strong>${params.orderCode}</strong> status has been updated:</p>`,
      `<p><strong>${statusLabel(params.fromStatus)}</strong> → <strong>${to}</strong></p>`,
      `<p>— VN Logistics</p>`,
    ].join("\n"),
  };
}
