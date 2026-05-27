export { sendNotification } from "./service";
export {
  onOrderCreated,
  onShipmentStatusChanged,
  onCustomerIssueCreated,
  onCustomerIssueStatusChanged,
  onCustomerVisibleOrderNote,
  onPricingConfirmed,
  onWarehouseChanged,
  onStaffPricingSubmitted,
  onSalesRequestCreated,
  onWalletEvent,
} from "./triggers";
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
