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

export default function SettingsPage() {
  const { toast } = useToast();
  const [zaloSending, setZaloSending] = useState(false);
  const [lastTestTime, setLastTestTime] = useState<string | null>(null);
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
    toast(res.ok ? "Đã lưu cài đặt thành công" : "Không thể lưu cài đặt", res.ok ? "success" : "error");
  }

  if (loading) return <LoadingSpinner text="Đang tải cài đặt..." />;

  const fields = [
    { key: "exchange_rate", label: "Tỷ giá (1 CNY = ? VND)", unit: "VND", desc: "Tỷ giá quy đổi Nhân dân tệ sang Việt Nam đồng" },
    { key: "service_fee_percent", label: "Phí dịch vụ", unit: "%", desc: "Phần trăm tính trên giá sản phẩm" },
    { key: "china_domestic_shipping_default", label: "Phí vận chuyển nội địa Trung Quốc (mặc định)", unit: "VND", desc: "Phí ship nội địa Trung Quốc mặc định" },
    { key: "international_shipping_rate", label: "Phí vận chuyển quốc tế (theo kg)", unit: "VND/kg", desc: "Giá mỗi kg từ Trung Quốc về Việt Nam" },
    { key: "vietnam_delivery_fee_default", label: "Phí giao hàng Việt Nam (mặc định)", unit: "VND", desc: "Phí giao hàng chặng cuối tại Việt Nam" },
  ] as const;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Cài đặt hệ thống" subtitle="Cấu hình phí, tỷ giá và cước vận chuyển" />

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

        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-600 mb-2">Cần thêm vào file .env:</p>
          <ul className="text-xs text-slate-500 space-y-1 font-mono">
            <li>ZALO_SEND_ENABLED=true</li>
            <li>ZALO_OA_ACCESS_TOKEN=&lt;lấy từ trang quản trị Zalo OA&gt;</li>
            <li>ZALO_RECIPIENT_ID=&lt;ID Zalo của người nhận thử&gt;</li>
          </ul>
          <p className="text-xs text-amber-600 mt-2">
            Access token có thời hạn ngắn, cần làm mới thường xuyên. Hệ thống chưa hỗ trợ tự động làm mới.
          </p>
        </div>
      </Card>
    </div>
  );
}
