"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const [zaloSending, setZaloSending] = useState(false);
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
        toast("Chỉ admin mới được sử dụng", "error");
        return;
      }
      setZaloResult(data);
      toast(
        data.success ? data.message : data.error,
        data.success ? "success" : "error",
      );
    } catch {
      toast("Lỗi mạng — không thể kết nối server", "error");
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
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    toast(res.ok ? "Settings saved successfully" : "Failed to save settings", res.ok ? "success" : "error");
  }

  if (loading) return <LoadingSpinner text="Loading settings..." />;

  const fields = [
    { key: "exchange_rate", label: "Exchange Rate (1 CNY = ? VND)", unit: "VND", desc: "Current CNY to VND conversion rate" },
    { key: "service_fee_percent", label: "Service Fee", unit: "%", desc: "Percentage charged on product cost" },
    { key: "china_domestic_shipping_default", label: "China Domestic Shipping (default)", unit: "VND", desc: "Default domestic shipping fee within China" },
    { key: "international_shipping_rate", label: "International Shipping (per kg)", unit: "VND/kg", desc: "Rate per kilogram for China to Vietnam shipping" },
    { key: "vietnam_delivery_fee_default", label: "Vietnam Delivery Fee (default)", unit: "VND", desc: "Default last-mile delivery fee in Vietnam" },
  ] as const;

  return (
    <div className="max-w-2xl">
      <PageHeader title="System Settings" subtitle="Configure fees, exchange rates, and shipping costs" />

      <Card title="Fee Configuration">
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
            Save Settings
          </button>
        </form>
      </Card>

      <Card title="Kiểm tra thông báo Zalo OA">
        <p className="text-sm text-slate-500 mb-4">
          Gửi tin nhắn thử đến ZALO_RECIPIENT_ID đã cấu hình qua kênh Zalo OA.
        </p>

        <button
          type="button"
          onClick={sendTestZalo}
          disabled={zaloSending}
          className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {zaloSending ? "Đang gửi…" : "Gửi thử thông báo Zalo"}
        </button>

        {zaloResult && (
          <div className={`mt-4 p-4 rounded-xl text-sm ${zaloResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            <p className={`font-semibold ${zaloResult.success ? "text-green-700" : "text-red-700"}`}>
              {zaloResult.success ? "Thành công" : "Thất bại"}
            </p>
            <p className={`mt-1 ${zaloResult.success ? "text-green-600" : "text-red-600"}`}>
              {zaloResult.success ? zaloResult.message : zaloResult.error}
            </p>
            {zaloResult.timestamp && (
              <p className="mt-1 text-slate-400 text-xs">Thời gian: {zaloResult.timestamp}</p>
            )}
            {zaloResult.config && (
              <div className="mt-3 pt-3 border-t border-slate-200 space-y-1">
                <p className="text-xs font-medium text-slate-500 mb-1">Trạng thái cấu hình:</p>
                {Object.entries(zaloResult.config).map(([key, val]) => (
                  <p key={key} className="text-xs text-slate-500 flex items-center gap-1.5">
                    <span className={`inline-block w-2 h-2 rounded-full ${val ? "bg-green-500" : "bg-red-400"}`} />
                    <code className="text-xs">{key}</code>: {val ? "Đã cấu hình" : "Chưa cấu hình"}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-2">Biến môi trường cần thiết (trong .env):</p>
          <ul className="text-xs text-slate-400 space-y-1 font-mono">
            <li>ZALO_SEND_ENABLED=true</li>
            <li>ZALO_OA_ACCESS_TOKEN=&lt;token từ Zalo OA&gt;</li>
            <li>ZALO_RECIPIENT_ID=&lt;user_id người nhận&gt;</li>
          </ul>
          <p className="text-xs text-amber-600 mt-2">
            Lưu ý: Access token có thời hạn ngắn, cần làm mới định kỳ. Hiện chưa có auto-refresh.
          </p>
        </div>
      </Card>
    </div>
  );
}
