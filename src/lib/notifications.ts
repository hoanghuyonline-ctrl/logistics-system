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
    PURCHASED: "Your order has been purchased from the seller.",
    SELLER_SHIPPED: "The seller has shipped your order.",
    ARRIVED_CHINA_WH: "Your order has arrived at the China warehouse.",
    PACKING: "Your order is being packed for international shipping.",
    SHIPPING_TO_VIETNAM: "Your order is on the way to Vietnam.",
    ARRIVED_VIETNAM_WH: "Your order has arrived at the Vietnam warehouse.",
    OUT_FOR_DELIVERY: "Your order is out for delivery.",
    COMPLETED: "Your order has been delivered successfully.",
    CANCELLED: "Your order has been cancelled.",
  };

  const message = statusMessages[newStatus] || `Order status updated to ${newStatus}.`;

  await createNotification({
    userId,
    title: `Order ${orderCode} - Status Update`,
    message,
    orderId,
  });
}
