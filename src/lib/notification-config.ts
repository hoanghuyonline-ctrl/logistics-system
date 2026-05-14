import { prisma } from "./prisma";

const NOTIFICATION_KEYS = [
  "telegram_bot_token",
  "telegram_chat_id",
  "zalo_send_enabled",
  "zalo_oa_access_token",
  "zalo_oa_refresh_token",
  "zalo_recipient_id",
] as const;

export type NotificationConfigKey = (typeof NOTIFICATION_KEYS)[number];

const ENV_MAP: Record<NotificationConfigKey, string> = {
  telegram_bot_token: "TELEGRAM_BOT_TOKEN",
  telegram_chat_id: "TELEGRAM_CHAT_ID",
  zalo_send_enabled: "ZALO_SEND_ENABLED",
  zalo_oa_access_token: "ZALO_OA_ACCESS_TOKEN",
  zalo_oa_refresh_token: "ZALO_OA_REFRESH_TOKEN",
  zalo_recipient_id: "ZALO_RECIPIENT_ID",
};

const SECRET_KEYS: NotificationConfigKey[] = [
  "telegram_bot_token",
  "zalo_oa_access_token",
  "zalo_oa_refresh_token",
];

export async function getNotificationConfig(
  key: NotificationConfigKey,
): Promise<string> {
  const row = await prisma.systemConfig
    .findUnique({ where: { key } })
    .catch(() => null);
  if (row?.value) return row.value;
  return process.env[ENV_MAP[key]] || "";
}

function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 4) return "••••";
  return "••••" + value.slice(-4);
}

export interface MaskedNotificationConfig {
  key: NotificationConfigKey;
  value: string;
  configured: boolean;
  source: "db" | "env" | "none";
}

export async function getMaskedNotificationConfigs(): Promise<
  MaskedNotificationConfig[]
> {
  const rows = await prisma.systemConfig.findMany({
    where: { key: { in: [...NOTIFICATION_KEYS] } },
  });
  const dbMap = new Map(rows.map((r) => [r.key, r.value]));

  return NOTIFICATION_KEYS.map((key) => {
    const dbVal = dbMap.get(key) || "";
    const envVal = process.env[ENV_MAP[key]] || "";
    const raw = dbVal || envVal;
    const source: "db" | "env" | "none" = dbVal
      ? "db"
      : envVal
        ? "env"
        : "none";
    const isSecret = SECRET_KEYS.includes(key);
    return {
      key,
      value: isSecret ? maskSecret(raw) : raw,
      configured: !!raw,
      source,
    };
  });
}

export function isValidNotificationKey(
  key: string,
): key is NotificationConfigKey {
  return (NOTIFICATION_KEYS as readonly string[]).includes(key);
}
