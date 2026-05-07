export { sendNotification } from "./service";
export { onOrderCreated, onShipmentStatusChanged } from "./triggers";
export { sendEmail } from "./channels/email";
export { orderCreatedTemplate, shipmentStatusChangedTemplate } from "./templates";
export type {
  NotificationChannel,
  NotificationPayload,
  NotificationResult,
  ChannelSendResult,
  NotificationTemplate,
} from "./types";
