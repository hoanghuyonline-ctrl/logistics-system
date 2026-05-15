import { getNotificationConfig } from "@/lib/notification-config";
import { prisma } from "@/lib/prisma";

const REFRESH_URL = "https://oauth.zaloapp.com/v4/oa/access_token";

interface ZaloTokenCache {
  accessToken: string;
  refreshedAt: string;
  success: boolean;
  errorReason?: string;
}

let cachedToken: ZaloTokenCache | null = null;

export function getZaloTokenStatus(): ZaloTokenCache | null {
  return cachedToken;
}

export function getCachedAccessToken(): string | null {
  if (!cachedToken || !cachedToken.success) return null;
  return cachedToken.accessToken;
}

export async function refreshZaloAccessToken(): Promise<string> {
  const refreshToken = await getNotificationConfig("zalo_oa_refresh_token");
  if (!refreshToken) {
    const reason = "Thiếu ZALO_OA_REFRESH_TOKEN — không thể tự động refresh";
    console.error(`[zalo/token] FAIL | reason=${reason}`);
    cachedToken = {
      accessToken: "",
      refreshedAt: new Date().toISOString(),
      success: false,
      errorReason: reason,
    };
    throw new Error(reason);
  }

  const appId = await getNotificationConfig("zalo_app_id");
  const secretKey = await getNotificationConfig("zalo_app_secret_key");

  if (!appId || !secretKey) {
    const reason = "Thiếu ZALO_APP_ID hoặc ZALO_APP_SECRET_KEY";
    console.error(`[zalo/token] FAIL | reason=${reason}`);
    cachedToken = {
      accessToken: "",
      refreshedAt: new Date().toISOString(),
      success: false,
      errorReason: reason,
    };
    throw new Error(reason);
  }

  console.log(`[zalo/token] REFRESHING | appId=${appId.slice(0, 6)}***`);

  const res = await fetch(REFRESH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      secret_key: secretKey,
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      app_id: appId,
      grant_type: "refresh_token",
    }).toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    const reason = `Zalo OAuth HTTP ${res.status}: ${body.slice(0, 200)}`;
    console.error(`[zalo/token] FAIL | reason=${reason}`);
    cachedToken = {
      accessToken: "",
      refreshedAt: new Date().toISOString(),
      success: false,
      errorReason: reason,
    };
    throw new Error(reason);
  }

  const data = await res.json();

  if (data.error && data.error !== 0) {
    const reason = `Zalo OAuth error ${data.error}: ${data.message || "unknown"}`;
    console.error(`[zalo/token] FAIL | errorCode=${data.error} reason=${reason}`);
    cachedToken = {
      accessToken: "",
      refreshedAt: new Date().toISOString(),
      success: false,
      errorReason: reason,
    };
    throw new Error(reason);
  }

  const newAccessToken = data.access_token;
  if (!newAccessToken) {
    const reason = "Zalo OAuth trả về không có access_token";
    console.error(`[zalo/token] FAIL | reason=${reason}`);
    cachedToken = {
      accessToken: "",
      refreshedAt: new Date().toISOString(),
      success: false,
      errorReason: reason,
    };
    throw new Error(reason);
  }

  const tokenHint = newAccessToken.slice(0, 6) + "***";
  const now = new Date().toISOString();
  console.log(`[zalo/token] OK | newToken=${tokenHint} refreshedAt=${now}`);

  // Persist new access token and rotated refresh token to DB
  try {
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    const actorId = admin?.id;
    if (actorId) {
      await prisma.systemConfig.upsert({
        where: { key: "zalo_oa_access_token" },
        update: { value: newAccessToken, updatedBy: actorId },
        create: { key: "zalo_oa_access_token", value: newAccessToken, updatedBy: actorId },
      });
      if (data.refresh_token) {
        await prisma.systemConfig.upsert({
          where: { key: "zalo_oa_refresh_token" },
          update: { value: data.refresh_token, updatedBy: actorId },
          create: { key: "zalo_oa_refresh_token", value: data.refresh_token, updatedBy: actorId },
        });
        console.log(`[zalo/token] persisted new refresh_token to DB`);
      }
      console.log(`[zalo/token] persisted new access_token to DB`);
    } else {
      console.warn(`[zalo/token] no ADMIN user found — cannot persist tokens to DB`);
    }
  } catch (err) {
    console.error(`[zalo/token] failed to persist tokens to DB:`, err);
  }

  cachedToken = {
    accessToken: newAccessToken,
    refreshedAt: now,
    success: true,
  };

  return newAccessToken;
}
