"use client";

import { useEffect, useState, useCallback } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

interface Failure {
  id: string;
  channel: string;
  orderCode: string | null;
  customerId: string | null;
  recipient: string | null;
  failureCategory: string | null;
  shortReason: string | null;
  payloadSummary: string | null;
  retryCount: number;
  lastRetryAt: string | null;
  resolved: boolean;
  createdAt: string;
}

interface FailureData {
  failures: Failure[];
  total: number;
  unresolved: number;
  resolved: number;
  page: number;
  totalPages: number;
}

const NON_RETRYABLE = new Set([
  "INVALID_RECIPIENT", "CONFIG_MISSING",
  "TELEGRAM_NOT_BOUND", "ZALO_NOT_BOUND",
]);

function isNonRetryable(f: Failure): boolean {
  return NON_RETRYABLE.has(f.failureCategory || "") || NON_RETRYABLE.has(f.shortReason || "");
}

const CHANNEL_LABELS: Record<string, string> = {
  TELEGRAM: "Telegram",
  ZALO: "Zalo OA",
  EMAIL: "Email",
  MESSENGER: "Messenger",
};

const CATEGORY_LABELS: Record<string, string> = {
  TOKEN_EXPIRED: "Token hết hạn",
  INVALID_RECIPIENT: "Người nhận không hợp lệ",
  PERMISSION_DENIED: "Không có quyền",
  NETWORK_ERROR: "Lỗi mạng",
  CONFIG_MISSING: "Chưa cấu hình",
  UNKNOWN: "Không xác định",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

function timeSince(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export default function NotificationFailuresPage() {
  const [data, setData] = useState<FailureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("unresolved");
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/notifications/failures?filter=${filter}&page=${page}&limit=50`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [filter]);

  const handleAction = async (failureId: string, action: "retry" | "resolve") => {
    setRetryingId(failureId);
    try {
      const res = await fetch("/api/admin/notifications/failures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, failureId }),
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.error || "Lỗi khi xử lý");
      }
      fetchData();
    } catch {
      alert("Lỗi kết nối");
    } finally {
      setRetryingId(null);
    }
  };

  if (loading && !data) return <LoadingSpinner text="Đang tải lỗi thông báo..." />;

  return (
    <div>
      <PageHeader
        title="Lỗi Gửi Thông Báo"
        subtitle={data ? `${data.unresolved} chưa xử lý / ${data.total} tổng` : ""}
      />

      {/* Summary + filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {["unresolved", "resolved", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f === "unresolved" ? `Chưa xử lý (${data?.unresolved ?? 0})` : f === "resolved" ? `Đã xử lý (${data?.resolved ?? 0})` : `Tất cả (${data?.total ?? 0})`}
          </button>
        ))}
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {/* Failure list */}
      {data && data.failures.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                  <th className="pb-2 font-medium">Kênh</th>
                  <th className="pb-2 font-medium">Mã đơn</th>
                  <th className="pb-2 font-medium">Lý do</th>
                  <th className="pb-2 font-medium">Thời gian</th>
                  <th className="pb-2 font-medium">Retry</th>
                  <th className="pb-2 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data.failures.map((f) => (
                  <tr key={f.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                        f.channel === "ZALO" ? "bg-blue-100 text-blue-700" :
                        f.channel === "TELEGRAM" ? "bg-sky-100 text-sky-700" :
                        f.channel === "EMAIL" ? "bg-purple-100 text-purple-700" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {CHANNEL_LABELS[f.channel] || f.channel}
                      </span>
                    </td>
                    <td className="py-3">
                      {f.orderCode ? (
                        <a href={`/admin/orders?search=${f.orderCode}`} className="text-blue-600 hover:underline font-medium">
                          {f.orderCode}
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 max-w-[250px]">
                      <div className="text-slate-700 truncate" title={f.shortReason || ""}>
                        {f.failureCategory && (
                          <span className="text-xs text-red-600 font-medium mr-1">
                            {CATEGORY_LABELS[f.failureCategory] || f.failureCategory}:
                          </span>
                        )}
                        {f.shortReason || "—"}
                      </div>
                      {f.payloadSummary && (
                        <div className="text-xs text-slate-400 truncate mt-0.5" title={f.payloadSummary}>
                          {f.payloadSummary}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-xs text-slate-500 whitespace-nowrap">
                      {timeSince(f.createdAt)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-medium ${f.retryCount >= 3 ? "text-red-600" : "text-slate-500"}`}>
                          {f.retryCount}/3
                        </span>
                        {f.lastRetryAt && (
                          <span className="text-[10px] text-slate-400">
                            ({timeSince(f.lastRetryAt)})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      {f.resolved ? (
                        <span className="text-xs text-emerald-600 font-medium">Đã xử lý</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          {!isNonRetryable(f) && (
                          <button
                            onClick={() => handleAction(f.id, "retry")}
                            disabled={retryingId === f.id || f.retryCount >= 3}
                            className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-40 transition-colors"
                          >
                            {retryingId === f.id ? "..." : "Thử lại"}
                          </button>
                          )}
                          <button
                            onClick={() => handleAction(f.id, "resolve")}
                            disabled={retryingId === f.id}
                            className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-40 transition-colors"
                          >
                            Bỏ qua
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            Trang trước
          </button>
          <span className="text-sm text-slate-500">
            Trang {data.page} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            Trang sau
          </button>
        </div>
      )}

      {data && data.failures.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <div className="text-4xl mb-3">✅</div>
          <div className="text-lg font-medium">
            {filter === "unresolved" ? "Không có lỗi chưa xử lý" : "Không có dữ liệu"}
          </div>
          <div className="text-sm mt-1">Tất cả thông báo đang gửi bình thường</div>
        </div>
      ) : null}
    </div>
  );
}
