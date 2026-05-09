export type NotificationChannel = "SYSTEM" | "EMAIL" | "TELEGRAM" | "ZALO";

export interface NotificationPayload {
  userId: string;
  userEmail?: string;
  userName?: string;
  title: string;
  message: string;
  orderId?: string;
  orderCode?: string;
  channels: NotificationChannel[];
}

export interface ChannelSendResult {
  channel: NotificationChannel;
  success: boolean;
  error?: string;
}

export interface NotificationResult {
  notificationId?: string;
  channels: ChannelSendResult[];
}

export interface NotificationTemplate {
  subject: string;
  body: string;
  html?: string;
}
