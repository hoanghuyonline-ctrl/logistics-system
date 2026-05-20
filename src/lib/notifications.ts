import { prisma } from "./prisma";

interface NotificationInput {
  userId: string;
  title: string;
  message: string;
  orderId?: string;
}

export async function createNotification(input: NotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: "SYSTEM",
      orderId: input.orderId,
    },
  });
}

export async function notifyOrderStatusChange(
  userId: string,
  orderId: string,
  orderCode: string,
  newStatus: string
) {
  const statusMessages: Record<string, string> = {
    PURCHASED: "Đơn hàng của bạn đã được mua từ người bán.",
    SELLER_SHIPPED: "Người bán đã gửi hàng cho đơn hàng của bạn.",
    ARRIVED_CHINA_WH: "Đơn hàng của bạn đã đến kho Trung Quốc.",
    PACKING: "Đơn hàng của bạn đang được đóng gói để vận chuyển quốc tế.",
    SHIPPING_TO_VIETNAM: "Đơn hàng của bạn đang trên đường về Việt Nam.",
    ARRIVED_VIETNAM_WH: "Đơn hàng của bạn đã đến kho Việt Nam.",
    OUT_FOR_DELIVERY: "Đơn hàng của bạn đang được giao.",
    COMPLETED: "Đơn hàng của bạn đã giao thành công.",
    CANCELLED: "Đơn hàng của bạn đã bị hủy.",
  };

  const message = statusMessages[newStatus] || `Trạng thái đơn hàng đã cập nhật: ${newStatus}.`;

  await createNotification({
    userId,
    title: `Đơn hàng ${orderCode} - Cập nhật trạng thái`,
    message,
    orderId,
  });
}

export {
  onShipmentStatusChanged,
  onCustomerIssueCreated,
  onCustomerIssueStatusChanged,
  onCustomerVisibleOrderNote,
  onWalletEvent,
  onSalesRequestStatusChanged,
} from "./notifications/triggers";
