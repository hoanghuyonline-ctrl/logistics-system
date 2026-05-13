export { sendNotification } from "./service";
export { onOrderCreated, onShipmentStatusChanged } from "./triggers";
export { sendEmail } from "./channels/email";
export { sendTelegram } from "./channels/telegram";
export { sendZalo, notifyZaloStatusChange } from "./channels/zalo";
export { orderCreatedTemplate, shipmentStatusChangedTemplate } from "./templates";
export type {
  NotificationChannel,
  NotificationPayload,
  NotificationResult,
  ChannelSendResult,
  NotificationTemplate,
} from "./types";
