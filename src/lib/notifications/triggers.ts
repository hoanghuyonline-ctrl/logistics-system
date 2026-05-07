import { sendNotification } from "./service";
import { orderCreatedTemplate, shipmentStatusChangedTemplate } from "./templates";
import type { NotificationChannel, NotificationResult } from "./types";

const DEFAULT_CHANNELS: NotificationChannel[] = ["SYSTEM"];

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
