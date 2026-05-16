"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";

interface AlertItem {
  id: string;
  type: "stuck_order" | "missing_weight" | "missing_tracking" | "unpaid_debt" | "notif_failure";
  level: "red" | "yellow";
  title: string;
  detail: string;
  href: string;
  createdAt: string;
}

interface AlertSummary {
  stuckOrders: number;
  missingWeight: number;
  missingTracking: number;
  unpaidDebt: number;
  notifFailures: number;
  total: number;
}

const TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
  stuck_order: { label: "Đơn bị kẹt", icon: "📦" },
  missing_weight: { label: "Chưa cân", icon: "⚖️" },
  missing_tracking: { label: "Chưa tracking", icon: "🔍" },
  unpaid_debt: { label: "Nợ chưa trả", icon: "💰" },
  notif_failure: { label: "Gửi TB lỗi", icon: "🔔" },
};

const FILTER_OPTIONS = [
  { key: "all", label: "Tất cả" },
  { key: "stuck_order", label: "Đơn kẹt" },
  { key: "missing_weight", label: "Chưa cân" },
  { key: "missing_tracking", label: "Chưa tracking" },
  { key: "unpaid_debt", label: "Nợ" },
  { key: "notif_failure", label: "TB lỗi" },
];

export default function CustomerAlertsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [filter, setFilter] = useState("all");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const inFlightRef = useRef(false);

  const fetchAlerts = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const res = await fetch("/api/admin/customer-alerts");
      if (!res.ok) throw new Error("Không thể tải cảnh báo");
      const data = await res.json();
      setAlerts(data.alerts || []);
      setSummary(data.summary || null);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      setError("Không thể tải dữ liệu cảnh báo. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, 60_000);
    return () => clearInterval(id);
  }, [fetchAlerts]);

  if (loading) return <LoadingSpinner text="Đang tải cảnh báo..." />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={fetchAlerts} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Thử lại
        </button>
      </div>
    );
  }

  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.type === filter);
  const redCount = filtered.filter((a) => a.level === "red").length;
  const yellowCount = filtered.filter((a) => a.level === "yellow").length;

  return (
    <div>
      <PageHeader
        title="⚠️ Cảnh báo khách hàng"
        subtitle="Phát hiện sớm vấn đề cần xử lý"
        action={
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span>Tự động quét mỗi 60 giây</span>
            {lastUpdated && (
              <span className="text-slate-500 font-medium">
                — {lastUpdated.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        }
      />

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Đơn bị kẹt", value: summary.stuckOrders, icon: "📦" },
            { label: "Chưa cân", value: summary.missingWeight, icon: "⚖️" },
            { label: "Chưa tracking", value: summary.missingTracking, icon: "🔍" },
            { label: "Nợ chưa trả", value: summary.unpaidDebt, icon: "💰" },
            { label: "TB gửi lỗi", value: summary.notifFailures, icon: "🔔" },
          ].map((card) => (
            <div
              key={card.label}
              className={`flex items-center gap-2 p-3 rounded-xl border ${
                card.value > 0
                  ? "border-amber-200 bg-amber-50"
                  : "border-green-200 bg-green-50"
              }`}
            >
              <span className="text-lg">{card.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-slate-500 truncate">{card.label}</div>
                <div className="text-base font-bold text-slate-900">{card.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filter === opt.key
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Status line */}
      <div className="flex items-center gap-3 mb-4 text-xs text-slate-500">
        <span>{filtered.length} cảnh báo</span>
        {redCount > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {redCount} nghiêm trọng
          </span>
        )}
        {yellowCount > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {yellowCount} cần chú ý
          </span>
        )}
      </div>

      {/* Alert list */}
      {filtered.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center text-sm text-green-700">
          Không có cảnh báo — hệ thống hoạt động bình thường
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((alert) => {
            const config = TYPE_CONFIG[alert.type];
            return (
              <Link
                key={alert.id}
                href={alert.href}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all hover:shadow-md ${
                  alert.level === "red"
                    ? "border-red-200 bg-red-50/50 hover:bg-red-50"
                    : "border-amber-200 bg-amber-50/50 hover:bg-amber-50"
                }`}
              >
                <span className="text-base mt-0.5">{config?.icon || "⚠️"}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        alert.level === "red" ? "bg-red-500 animate-pulse" : "bg-amber-500"
                      }`}
                    />
                    <span className="text-sm font-semibold text-slate-800 truncate">{alert.title}</span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        alert.level === "red"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {config?.label || alert.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{alert.detail}</p>
                </div>
                <span className="text-[10px] text-slate-400 flex-shrink-0 mt-1">Xem →</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
