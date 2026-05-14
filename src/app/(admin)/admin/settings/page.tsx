"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";

const CONFIG_LABELS: Record<string, { ready: string; missing: string }> = {
  ZALO_SEND_ENABLED: { ready: "Đã bật gửi tin nhắn", missing: "Chưa bật — cần đặt = true" },
  ZALO_OA_ACCESS_TOKEN: { ready: "Đã có access token", missing: "Chưa có — cần lấy từ Zalo OA" },
  ZALO_RECIPIENT_ID: { ready: "Đã có ID người nhận", missing: "Chưa có — cần ID user Zalo" },
};

interface NotifConfig {
  key: string;
  value: string;
  configured: boolean;
  source: "db" | "env" | "none";
}

interface ChannelHealth {
  telegram: "enabled" | "disabled";
  zalo: "enabled" | "disabled" | "token_expired";
  email: "enabled" | "disabled";
  messenger: "enabled" | "disabled";
}

const CHANNEL_LABELS: { key: keyof ChannelHealth; label: string; icon: string }[] = [
  { key: "telegram", label: "Telegram", icon: "💬" },
  { key: "zalo", label: "Zalo OA", icon: "📱" },
  { key: "email", label: "Email (SMTP)", icon: "📧" },
  { key: "messenger", label: "Messenger", icon: "💭" },
];

interface SmtpStatus {
  key: string;
  configured: boolean;
}

const SMTP_LABELS: Record<string, string> = {
  SMTP_HOST: "Máy chủ SMTP",
  SMTP_PORT: "Cổng SMTP",
  SMTP_USER: "Tài khoản SMTP",
  SMTP_PASS: "Mật khẩu SMTP",
  SMTP_FROM: "Địa chỉ gửi",
};

const NOTIF_FIELD_META: Record<string, { label: string; desc: string; secret: boolean; placeholder: string }> = {
  telegram_bot_token: {
    label: "Telegram Bot Token",
    desc: "Token từ @BotFather trên Telegram",
    secret: true,
    placeholder: "Nhập bot token mới...",
  },
  telegram_chat_id: {
    label: "Telegram Chat ID",
    desc: "ID chat/group nhận thông báo",
    secret: false,
    placeholder: "Ví dụ: -1001234567890",
  },
  zalo_send_enabled: {
    label: "Bật gửi Zalo",
    desc: "Đặt true để kích hoạt gửi tin nhắn Zalo OA",
    secret: false,
    placeholder: "true hoặc false",
  },
  zalo_oa_access_token: {
    label: "Zalo OA Access Token",
    desc: "Access token từ trang quản trị Zalo OA",
    secret: true,
    placeholder: "Nhập access token mới...",
  },
  zalo_oa_refresh_token: {
    label: "Zalo OA Refresh Token",
    desc: "Refresh token để tự động gia hạn access token",
    secret: true,
    placeholder: "Nhập refresh token...",
  },
  zalo_app_id: {
    label: "Zalo App ID",
    desc: "App ID từ trang developers.zalo.me",
    secret: false,
    placeholder: "Nhập App ID...",
  },
  zalo_app_secret_key: {
    label: "Zalo App Secret Key",
    desc: "Secret key của ứng dụng Zalo (để refresh token)",
    secret: true,
    placeholder: "Nhập secret key...",
  },
  zalo_recipient_id: {
    label: "Zalo Recipient ID",
    desc: "ID người nhận tin nhắn thử Zalo",
    secret: false,
    placeholder: "Ví dụ: 1234567890",
  },
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [zaloSending, setZaloSending] = useState(false);
  const [lastTestTime, setLastTestTime] = useState<string | null>(null);

  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    timestamp?: string;
  } | null>(null);

  const sendTestEmail = useCallback(async () => {
    setEmailSending(true);
    setEmailResult(null);
    try {
      const res = await fetch("/api/admin/test-email", { method: "POST" });
      const data = await res.json();
      if (res.status === 403) {
        toast("Chỉ admin mới có quyền gửi thử", "error");
        return;
      }
      setEmailResult(data);
      toast(
        data.success ? data.message : data.error,
        data.success ? "success" : "error",
      );
    } catch {
      toast("Mất kết nối — không gọi được tới server", "error");
    } finally {
      setEmailSending(false);
    }
  }, [toast]);
  const [zaloResult, setZaloResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    config?: { ZALO_OA_ACCESS_TOKEN: boolean; ZALO_RECIPIENT_ID: boolean; ZALO_SEND_ENABLED: boolean };
    timestamp?: string;
  } | null>(null);

  const sendTestZalo = useCallback(async () => {
    setZaloSending(true);
    setZaloResult(null);
    try {
      const res = await fetch("/api/admin/test-zalo", { method: "POST" });
      const data = await res.json();
      if (res.status === 403) {
        toast("Chỉ admin mới có quyền gửi thử", "error");
        return;
      }
      setZaloResult(data);
      if (data.timestamp) {
        setLastTestTime(new Date(data.timestamp).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }));
      }
      toast(
        data.success ? data.message : data.error,
        data.success ? "success" : "error",
      );
    } catch {
      toast("Mất kết nối — không gọi được tới server", "error");
    } finally {
      setZaloSending(false);
    }
  }, [toast]);

  const [settings, setSettings] = useState({
    exchange_rate: "",
    service_fee_percent: "",
    china_domestic_shipping_default: "",
    international_shipping_rate: "",
    vietnam_delivery_fee_default: "",
  });
  const [loading, setLoading] = useState(true);

  const [notifConfigs, setNotifConfigs] = useState<NotifConfig[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);

  const [smtpStatus, setSmtpStatus] = useState<SmtpStatus[]>([]);
  const [smtpLoading, setSmtpLoading] = useState(true);
  const [notifEdits, setNotifEdits] = useState<Record<string, string>>({});
  const [channelHealth, setChannelHealth] = useState<ChannelHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);

  const loadNotifConfigs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notification-config");
      if (res.ok) {
        const data = await res.json();
        setNotifConfigs(data);
      }
    } catch {
      // silently fail
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings({
          exchange_rate: d.exchange_rate || "3500",
          service_fee_percent: d.service_fee_percent || "5",
          china_domestic_shipping_default: d.china_domestic_shipping_default || "50000",
          international_shipping_rate: d.international_shipping_rate || "35000",
          vietnam_delivery_fee_default: d.vietnam_delivery_fee_default || "30000",
        });
        setLoading(false);
      });
    loadNotifConfigs();
    fetch("/api/admin/notifications/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setChannelHealth(d))
      .catch(() => {})
      .finally(() => setHealthLoading(false));
    fetch("/api/admin/smtp-diagnostics")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setSmtpStatus(d))
      .catch(() => {})
      .finally(() => setSmtpLoading(false));
  }, [loadNotifConfigs]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    toast(res.ok ? "Đã lưu cài đặt thành công" : "Không thể lưu cài đặt", res.ok ? "success" : "error");
  }

  async function saveNotifConfig(key: string) {
    const value = notifEdits[key];
    if (value === undefined || value === "") {
      toast("Vui lòng nhập giá trị", "error");
      return;
    }
    setNotifSaving(true);
    try {
      const res = await fetch("/api/admin/notification-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotifConfigs(data.configs);
        setNotifEdits((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        toast("Đã cập nhật thành công", "success");
      } else {
        const data = await res.json();
        toast(data.error || "Không thể cập nhật", "error");
      }
    } catch {
      toast("Mất kết nối — không gọi được tới server", "error");
    } finally {
      setNotifSaving(false);
    }
  }

  if (loading) return <LoadingSpinner text="Đang tải cài đặt..." />;

  const fields = [
    { key: "exchange_rate", label: "Tỷ giá (1 CNY = ? VND)", unit: "VND", desc: "Tỷ giá quy đổi Nhân dân tệ sang Việt Nam đồng" },
    { key: "service_fee_percent", label: "Phí dịch vụ", unit: "%", desc: "Phần trăm tính trên giá sản phẩm" },
    { key: "china_domestic_shipping_default", label: "Phí vận chuyển nội địa Trung Quốc (mặc định)", unit: "VND", desc: "Phí ship nội địa Trung Quốc mặc định" },
    { key: "international_shipping_rate", label: "Phí vận chuyển quốc tế (theo kg)", unit: "VND/kg", desc: "Giá mỗi kg từ Trung Quốc về Việt Nam" },
    { key: "vietnam_delivery_fee_default", label: "Phí giao hàng Việt Nam (mặc định)", unit: "VND", desc: "Phí giao hàng chặng cuối tại Việt Nam" },
  ] as const;

  const telegramKeys = ["telegram_bot_token", "telegram_chat_id"];
  const zaloKeys = ["zalo_send_enabled", "zalo_oa_access_token", "zalo_oa_refresh_token", "zalo_app_id", "zalo_app_secret_key", "zalo_recipient_id"];

  function renderNotifField(cfg: NotifConfig) {
    const meta = NOTIF_FIELD_META[cfg.key];
    if (!meta) return null;
    const isEditing = cfg.key in notifEdits;
    const sourceLabel = cfg.source === "db" ? "Cơ sở dữ liệu" : cfg.source === "env" ? "Biến môi trường (.env)" : "";

    return (
      <div key={cfg.key} className="py-3 border-b border-slate-100 last:border-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700">{meta.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{meta.desc}</p>
            {cfg.configured ? (
              <div className="mt-1.5 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 shrink-0" />
                <span className="text-sm text-green-700 font-mono">
                  {cfg.value ? `Đã cấu hình ${cfg.value}` : "Đã cấu hình"}
                </span>
                {sourceLabel && (
                  <span className="text-xs text-slate-400">({sourceLabel})</span>
                )}
              </div>
            ) : (
              <div className="mt-1.5 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-red-400 shrink-0" />
                <span className="text-sm text-red-600">Chưa cấu hình</span>
              </div>
            )}
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setNotifEdits((prev) => ({ ...prev, [cfg.key]: "" }))}
              className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
            >
              {cfg.configured ? "Thay đổi" : "Thêm"}
            </button>
          )}
        </div>
        {isEditing && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type={meta.secret ? "password" : "text"}
              value={notifEdits[cfg.key] || ""}
              onChange={(e) => setNotifEdits((prev) => ({ ...prev, [cfg.key]: e.target.value }))}
              placeholder={meta.placeholder}
              className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => saveNotifConfig(cfg.key)}
              disabled={notifSaving}
              className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Lưu
            </button>
            <button
              type="button"
              onClick={() => setNotifEdits((prev) => {
                const next = { ...prev };
                delete next[cfg.key];
                return next;
              })}
              className="px-3 py-2 border border-slate-300 text-sm rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Huỷ
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Cài đặt hệ thống" subtitle="Cấu hình phí, tỷ giá, cước vận chuyển và kênh thông báo" />

      <Card title="Trạng thái kênh thông báo">
        {healthLoading ? (
          <p className="text-sm text-slate-400">Đang tải...</p>
        ) : !channelHealth ? (
          <p className="text-sm text-red-500">Không thể tải trạng thái kênh thông báo.</p>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-3">
              Tổng quan trạng thái sẵn sàng của các kênh gửi thông báo.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {CHANNEL_LABELS.map(({ key, label, icon }) => {
                const status = channelHealth[key];
                const isEnabled = status === "enabled";
                const isTokenExpired = status === "token_expired";
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
                      isTokenExpired
                        ? "border-red-300 bg-red-50"
                        : isEnabled
                          ? "border-green-200 bg-green-50"
                          : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <span className="text-lg">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700">{label}</p>
                      <p className={`text-xs font-medium ${
                        isTokenExpired ? "text-red-600" : isEnabled ? "text-green-600" : "text-slate-400"
                      }`}>
                        {isTokenExpired ? "Token hết hạn — cần cập nhật" : isEnabled ? "Sẵn sàng" : "Thiếu cấu hình"}
                      </p>
                    </div>
                    <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${
                      isTokenExpired ? "bg-red-500" : isEnabled ? "bg-green-500" : "bg-slate-300"
                    }`} />
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200 flex-1">
                <span className="text-sm">🔔</span>
                <div>
                  <p className="text-sm font-medium text-blue-700">App (Hệ thống)</p>
                  <p className="text-xs font-medium text-blue-600">Đang bật</p>
                </div>
                <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0 bg-blue-500 ml-auto" />
              </div>
            </div>
          </>
        )}
      </Card>

      <Card title="Cấu hình phí">
        <form onSubmit={save} className="space-y-6">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.01"
                  value={settings[f.key]}
                  onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
                <span className="text-sm font-medium text-slate-500 w-16 text-right">{f.unit}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{f.desc}</p>
            </div>
          ))}
          <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-sm">
            Lưu cài đặt
          </button>
        </form>
      </Card>

      <Card title="Cấu hình Telegram">
        {notifLoading ? (
          <p className="text-sm text-slate-400">Đang tải...</p>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-3">
              Cấu hình kênh Telegram để gửi thông báo đơn hàng tự động.
            </p>
            {telegramKeys.map((key) => {
              const cfg = notifConfigs.find((c) => c.key === key);
              if (!cfg) return null;
              return renderNotifField(cfg);
            })}
            <p className="text-xs text-slate-400 mt-3">
              Giá trị trong cơ sở dữ liệu được ưu tiên hơn biến môi trường (.env).
            </p>
          </>
        )}
      </Card>

      <Card title="Cấu hình Zalo OA">
        {notifLoading ? (
          <p className="text-sm text-slate-400">Đang tải...</p>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-3">
              Cấu hình kênh Zalo OA để gửi thông báo cho khách hàng.
            </p>
            {zaloKeys.map((key) => {
              const cfg = notifConfigs.find((c) => c.key === key);
              if (!cfg) return null;
              return renderNotifField(cfg);
            })}
            <p className="text-xs text-amber-600 mt-3">
              Access token Zalo có thời hạn ngắn, cần làm mới thường xuyên. Hệ thống chưa hỗ trợ tự động làm mới.
            </p>
          </>
        )}
      </Card>

      <Card title="Cấu hình Email (SMTP)">
        {smtpLoading ? (
          <p className="text-sm text-slate-400">Đang tải...</p>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-3">
              Tình trạng cấu hình SMTP để gửi email thông báo.
            </p>
            {smtpStatus.map((item) => (
              <div key={item.key} className="py-2 border-b border-slate-100 last:border-0 flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${item.configured ? "bg-green-500" : "bg-red-400"}`} />
                <code className="text-xs text-slate-600 w-28">{item.key}</code>
                <span className={`text-sm ${item.configured ? "text-green-700" : "text-red-600"}`}>
                  {item.configured ? "Đã cấu hình" : "Chưa cấu hình"}
                </span>
                <span className="text-xs text-slate-400 ml-auto">{SMTP_LABELS[item.key] || item.key}</span>
              </div>
            ))}
            <p className="text-xs text-slate-400 mt-3">
              Cấu hình SMTP qua biến môi trường (.env) trên máy chủ.
            </p>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500 mb-3">
                Gửi email thử nghiệm đến địa chỉ email của bạn để kiểm tra kết nối SMTP.
              </p>
              <div className="flex items-center gap-3 mb-2">
                <button
                  type="button"
                  onClick={sendTestEmail}
                  disabled={emailSending}
                  className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {emailSending ? "Đang gửi…" : "Gửi thử Email"}
                </button>
              </div>
              {emailResult && (
                <div className={`mt-3 p-4 rounded-xl text-sm ${emailResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                  <p className={`font-semibold ${emailResult.success ? "text-green-700" : "text-red-700"}`}>
                    {emailResult.success ? "Gửi thành công" : "Gửi không thành công"}
                  </p>
                  <p className={`mt-1 ${emailResult.success ? "text-green-600" : "text-red-600"}`}>
                    {emailResult.success ? emailResult.message : emailResult.error}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </Card>

      <Card title="Gửi thử Zalo OA">
        <p className="text-sm text-slate-500 mb-4">
          Gửi tin nhắn thử qua kênh Zalo OA để kiểm tra kết nối và cấu hình.
        </p>

        <div className="flex items-center gap-3 mb-2">
          <button
            type="button"
            onClick={sendTestZalo}
            disabled={zaloSending}
            className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {zaloSending ? "Đang gửi…" : "Gửi thử Zalo"}
          </button>
          {lastTestTime && (
            <span className="text-xs text-slate-400">Lần thử gần nhất: {lastTestTime}</span>
          )}
        </div>

        {zaloResult && (
          <div className={`mt-4 p-4 rounded-xl text-sm ${zaloResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            <p className={`font-semibold ${zaloResult.success ? "text-green-700" : "text-red-700"}`}>
              {zaloResult.success ? "Gửi thành công" : "Gửi không thành công"}
            </p>
            <p className={`mt-1 ${zaloResult.success ? "text-green-600" : "text-red-600"}`}>
              {zaloResult.success ? zaloResult.message : zaloResult.error}
            </p>
            {zaloResult.config && (
              <div className="mt-3 pt-3 border-t border-slate-200 space-y-1.5">
                <p className="text-xs font-medium text-slate-600 mb-1">Tình trạng cấu hình:</p>
                {Object.entries(zaloResult.config).map(([key, val]) => {
                  const labels = CONFIG_LABELS[key];
                  return (
                    <div key={key} className="flex items-start gap-1.5">
                      <span className={`inline-block w-2 h-2 rounded-full mt-1 shrink-0 ${val ? "bg-green-500" : "bg-red-400"}`} />
                      <div>
                        <code className="text-xs text-slate-600">{key}</code>
                        <p className={`text-xs ${val ? "text-green-600" : "text-red-500"}`}>
                          {val ? labels?.ready || "Sẵn sàng" : labels?.missing || "Chưa cấu hình"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
