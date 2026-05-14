"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

interface HealthData {
  system: {
    appOnline: boolean;
    database: string;
    serverTime: string;
    environment: string;
  };
  chatbot: {
    telegram: string;
    zalo: string;
    messenger: string;
  };
  operational: {
    unansweredQuestions: number;
    stuckPending: number;
    stuckDelivery: number;
    lastChatbotActivity: { time: string; channel: string } | null;
  };
}

function StatusDot({ status }: { status: "green" | "yellow" | "red" }) {
  const colors = {
    green: "bg-emerald-500",
    yellow: "bg-amber-500",
    red: "bg-red-500",
  };
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status]}`} />
  );
}

function StatusRow({ label, value, status }: { label: string; value: string; status: "green" | "yellow" | "red" }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        <StatusDot status={status} />
        <span className="text-sm font-medium text-slate-900">{value}</span>
      </div>
    </div>
  );
}

function MetricRow({ label, value, alert }: { label: string; value: number | string; alert?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`text-sm font-semibold ${alert ? "text-red-600" : "text-slate-900"}`}>
        {value}
      </span>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

function timeSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

export default function SystemHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchHealth = () => {
    setLoading(true);
    setError(false);
    fetch("/api/admin/system-health")
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLastRefresh(new Date());
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => { fetchHealth(); }, []);

  if (loading && !data) return <LoadingSpinner text="Đang kiểm tra hệ thống..." />;

  return (
    <div>
      <PageHeader
        title="Tình Trạng Hệ Thống"
        subtitle="Tổng quan sức khỏe hệ thống và vận hành"
      />

      {/* Refresh button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Đang tải..." : "Làm mới"}
        </button>
        <span className="text-xs text-slate-400">
          Cập nhật lúc: {lastRefresh.toLocaleTimeString("vi-VN")}
        </span>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          Không thể kết nối API. Kiểm tra lại hệ thống.
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* System Health */}
          <Card title="Hệ Thống">
            <StatusRow
              label="Ứng dụng"
              value={data.system.appOnline ? "Đang chạy" : "Ngừng"}
              status={data.system.appOnline ? "green" : "red"}
            />
            <StatusRow
              label="Database"
              value={data.system.database === "connected" ? "Kết nối OK" : "Mất kết nối"}
              status={data.system.database === "connected" ? "green" : "red"}
            />
            <StatusRow
              label="Môi trường"
              value={data.system.environment === "production" ? "Production" : "Development"}
              status={data.system.environment === "production" ? "green" : "yellow"}
            />
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-600">Giờ server</span>
              <span className="text-sm font-medium text-slate-900">
                {formatTime(data.system.serverTime)}
              </span>
            </div>
          </Card>

          {/* Chatbot Health */}
          <Card title="Kênh Chatbot">
            <StatusRow
              label="Zalo OA"
              value={data.chatbot.zalo === "enabled" ? "Bật" : "Tắt"}
              status={data.chatbot.zalo === "enabled" ? "green" : "red"}
            />
            <StatusRow
              label="Telegram"
              value={data.chatbot.telegram === "enabled" ? "Bật" : "Tắt"}
              status={data.chatbot.telegram === "enabled" ? "green" : "red"}
            />
            <StatusRow
              label="Messenger"
              value={data.chatbot.messenger === "enabled" ? "Bật" : "Tắt"}
              status={data.chatbot.messenger === "enabled" ? "green" : "red"}
            />
            {data.operational.lastChatbotActivity && (
              <div className="flex items-center justify-between py-3 mt-1 border-t border-slate-100">
                <span className="text-xs text-slate-400">Hoạt động cuối</span>
                <span className="text-xs text-slate-500">
                  {data.operational.lastChatbotActivity.channel} — {timeSince(data.operational.lastChatbotActivity.time)}
                </span>
              </div>
            )}
          </Card>

          {/* Operational Indicators */}
          <Card title="Chỉ Số Vận Hành">
            <MetricRow
              label="Câu hỏi chưa trả lời"
              value={data.operational.unansweredQuestions}
              alert={data.operational.unansweredQuestions > 10}
            />
            <MetricRow
              label="Đơn PENDING > 3 ngày"
              value={data.operational.stuckPending}
              alert={data.operational.stuckPending > 0}
            />
            <MetricRow
              label="Đơn giao > 2 ngày"
              value={data.operational.stuckDelivery}
              alert={data.operational.stuckDelivery > 0}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
