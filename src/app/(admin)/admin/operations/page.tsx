"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { useAutoRefresh } from "@/lib/useAutoRefresh";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";

/* ─── types ─── */

interface QuickViewCounts {
  unpaidOrders: number;
  stuckChina: number;
  stuckVietnam: number;
  staleOrders: number;
  unresolvedIssues: number;
  notifFailures: number;
  unansweredQuestions: number;
  unresolvedNotes: number;
  pendingDeposits: number;
}

interface TopUpRequest {
  id: string;
  amount: string;
  transferReference: string;
  status: string;
  createdAt: string;
  customer: { fullName: string; email: string };
}

interface StuckCategory {
  key: string;
  label: string;
  level: string;
  items: Array<{
    id: string;
    orderCode?: string;
    packageCode?: string;
    productName?: string;
    updatedAt?: string;
    createdAt?: string;
    status?: string;
    user?: { fullName: string };
  }>;
}

interface NotifFailure {
  id: string;
  channel: string;
  recipient: string | null;
  shortReason: string | null;
  resolved: boolean;
  createdAt: string;
  retryCount: number;
}

interface CustomerIssue {
  id: string;
  issueType: string;
  description: string;
  status: string;
  orderCode: string | null;
  priority: string;
  createdAt: string;
  customer: { fullName: string };
  assignee: { fullName: string } | null;
}

/* ─── helpers ─── */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "< 1 giờ";
  if (hours < 24) return `${hours} giờ`;
  const days = Math.floor(hours / 24);
  return `${days} ngày`;
}

function levelColor(level: string) {
  if (level === "red") return "border-red-500/30 bg-red-500/5";
  if (level === "yellow") return "border-amber-500/30 bg-amber-500/5";
  return "border-green-500/30 bg-green-500/5";
}

function levelDot(level: string) {
  if (level === "red") return "bg-red-500";
  if (level === "yellow") return "bg-amber-500";
  return "bg-green-500";
}

const ISSUE_TYPE_LABELS: Record<string, string> = {
  THIEU_HANG: "Thiếu hàng",
  GIAO_CHAM: "Giao chậm",
  SAI_CAN: "Sai cân",
  HONG_HANG: "Hỏng hàng",
  CHUA_NHAN: "Chưa nhận",
  PHI_SAI: "Phí sai",
  CHATBOT: "Chatbot",
  KHAC: "Khác",
};

/* ─── main component ─── */

export default function AdminOperationsPage() {
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [quickViews, setQuickViews] = useState<QuickViewCounts | null>(null);
  const [pendingTopUps, setPendingTopUps] = useState<TopUpRequest[]>([]);
  const [stuckCategories, setStuckCategories] = useState<StuckCategory[]>([]);
  const [notifFailures, setNotifFailures] = useState<NotifFailure[]>([]);
  const [unresolvedNotifCount, setUnresolvedNotifCount] = useState(0);
  const [issues, setIssues] = useState<CustomerIssue[]>([]);
  const [issueCounts, setIssueCounts] = useState<Record<string, number>>({});

  /* initial load */
  useEffect(() => {
    Promise.all([
      fetch("/api/admin/quick-views").then((r) => r.json()),
      fetch("/api/admin/topup-requests").then((r) => r.json()),
      fetch("/api/admin/stuck-shipments").then((r) => r.json()),
      fetch("/api/admin/notifications/failures?filter=unresolved").then((r) => r.json()),
      fetch("/api/admin/customer-issues?status=NEW").then((r) => r.json()),
    ])
      .then(([qv, topups, stuck, notifs, issueData]) => {
        setQuickViews(qv);
        setPendingTopUps(Array.isArray(topups) ? topups.filter((t: TopUpRequest) => t.status === "PENDING") : []);
        setStuckCategories(stuck.categories || []);
        setNotifFailures(notifs.failures?.slice(0, 10) || []);
        setUnresolvedNotifCount(notifs.unresolved || 0);
        setIssues(issueData.issues?.slice(0, 10) || []);
        setIssueCounts(issueData.statusCounts || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* auto-refresh quick-views every 30s */
  const refreshFetcher = useCallback(async () => {
    const res = await fetch("/api/admin/quick-views");
    if (!res.ok) throw new Error("fetch failed");
    return res.json() as Promise<QuickViewCounts>;
  }, []);

  const handleRefresh = useCallback((data: QuickViewCounts) => {
    setQuickViews(data);
  }, []);

  const { lastRefreshed } = useAutoRefresh(refreshFetcher, handleRefresh, 30000);

  if (loading) return <LoadingSpinner text={t("common.loading")} />;

  const totalStuck = stuckCategories.reduce((sum, c) => sum + c.items.length, 0);
  const activeStuck = stuckCategories.filter((c) => c.items.length > 0);

  return (
    <div>
      <PageHeader
        title="Trung tâm điều hành"
        subtitle="Tổng hợp công việc cần xử lý hàng ngày"
      />

      {/* Auto-refresh indicator */}
      <div className="flex items-center gap-1.5 mb-4 text-[11px] text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span>{"Tự động cập nhật"}</span>
        {lastRefreshed && (
          <span>{"—"} {lastRefreshed.toLocaleTimeString("vi-VN")}</span>
        )}
      </div>

      {/* ─── QUICK OVERVIEW CARDS ─── */}
      {quickViews && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Đơn chưa thanh toán", value: quickViews.unpaidOrders, icon: "💰", urgent: quickViews.unpaidOrders > 0 },
            { label: "Nạp tiền chờ xác nhận", value: quickViews.pendingDeposits, icon: "💳", urgent: quickViews.pendingDeposits > 0 },
            { label: "Vấn đề chưa giải quyết", value: quickViews.unresolvedIssues, icon: "⚠️", urgent: quickViews.unresolvedIssues > 0 },
            { label: "Thông báo lỗi", value: quickViews.notifFailures, icon: "🔔", urgent: quickViews.notifFailures > 0 },
            { label: "Đơn bị kẹt", value: quickViews.staleOrders, icon: "📦", urgent: quickViews.staleOrders > 0 },
          ].map((card) => (
            <div
              key={card.label}
              className={`flex items-center gap-2 p-3 rounded-xl border ${
                card.urgent ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"
              }`}
            >
              <span className="text-lg">{card.icon}</span>
              <div className="min-w-0">
                <div className="text-xs text-slate-500 truncate">{card.label}</div>
                <div className="text-base font-bold text-slate-900">{card.value}</div>
              </div>
              {card.urgent && (
                <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                  Cần xử lý
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── PENDING TOP-UP CONFIRMATIONS ─── */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            💳 Nạp tiền chờ xác nhận
            {pendingTopUps.length > 0 && (
              <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {pendingTopUps.length}
              </span>
            )}
          </h2>
          <Link href="/admin/finance" className="text-xs text-blue-600 hover:underline">
            Xem tất cả →
          </Link>
        </div>
        {pendingTopUps.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-sm text-green-700">
            Không có yêu cầu nạp tiền chờ xác nhận
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="divide-y divide-slate-100">
              {pendingTopUps.slice(0, 5).map((req) => (
                <div key={req.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{req.customer.fullName}</div>
                    <div className="text-xs text-slate-500">
                      {parseFloat(req.amount).toLocaleString()} VND — Ref: {req.transferReference}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                      Chờ xác nhận
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">{timeAgo(req.createdAt)} trước</div>
                  </div>
                </div>
              ))}
            </div>
            {pendingTopUps.length > 5 && (
              <div className="px-4 py-2 bg-slate-50 text-center">
                <Link href="/admin/finance" className="text-xs text-blue-600 hover:underline">
                  +{pendingTopUps.length - 5} yêu cầu khác →
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ─── STUCK SHIPMENTS ─── */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            🚚 Đơn hàng bị kẹt
            {totalStuck > 0 && (
              <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {totalStuck}
              </span>
            )}
          </h2>
          <Link href="/admin/stuck-shipments" className="text-xs text-blue-600 hover:underline">
            Xem chi tiết →
          </Link>
        </div>
        {activeStuck.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-sm text-green-700">
            Không có đơn hàng bị kẹt
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {activeStuck.map((cat) => (
              <div key={cat.key} className={`rounded-xl border p-3 ${levelColor(cat.level)}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${levelDot(cat.level)}`} />
                  <span className="text-xs font-semibold text-slate-700">{cat.label}</span>
                  <span className="text-xs font-bold text-slate-900 ml-auto">{cat.items.length}</span>
                </div>
                <div className="space-y-1">
                  {cat.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="text-[11px] text-slate-600 truncate">
                      {item.orderCode || item.packageCode}
                      {item.user && <span className="text-slate-400"> — {item.user.fullName}</span>}
                      {(item.updatedAt || item.createdAt) && (
                        <span className="text-slate-400"> ({timeAgo(item.updatedAt || item.createdAt!)})</span>
                      )}
                    </div>
                  ))}
                  {cat.items.length > 3 && (
                    <div className="text-[10px] text-slate-400">+{cat.items.length - 3} đơn khác</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── NOTIFICATION FAILURES ─── */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            🔔 Thông báo gửi lỗi
            {unresolvedNotifCount > 0 && (
              <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {unresolvedNotifCount}
              </span>
            )}
          </h2>
          <Link href="/admin/notification-failures" className="text-xs text-blue-600 hover:underline">
            Xem tất cả →
          </Link>
        </div>
        {notifFailures.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-sm text-green-700">
            Không có thông báo lỗi chưa xử lý
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="divide-y divide-slate-100">
              {notifFailures.slice(0, 5).map((f) => (
                <div key={f.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        f.channel === "TELEGRAM" ? "bg-blue-100 text-blue-700"
                        : f.channel === "ZALO" ? "bg-emerald-100 text-emerald-700"
                        : "bg-purple-100 text-purple-700"
                      }`}>
                        {f.channel}
                      </span>
                      <span className="text-xs text-slate-500 truncate max-w-[200px]">
                        {f.recipient || "—"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[300px]">
                      {f.shortReason || "Không rõ lỗi"}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-[10px] text-slate-400">{timeAgo(f.createdAt)} trước</div>
                    <div className="text-[10px] text-slate-400">Retry: {f.retryCount}/3</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ─── CUSTOMER ISSUES ─── */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            ⚠️ Khiếu nại khách hàng
            {(issueCounts["NEW"] || 0) > 0 && (
              <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {issueCounts["NEW"]} mới
              </span>
            )}
            {(issueCounts["IN_PROGRESS"] || 0) > 0 && (
              <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {issueCounts["IN_PROGRESS"]} đang xử lý
              </span>
            )}
          </h2>
          <Link href="/admin/customer-issues" className="text-xs text-blue-600 hover:underline">
            Xem tất cả →
          </Link>
        </div>
        {issues.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-sm text-green-700">
            Không có khiếu nại mới
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="divide-y divide-slate-100">
              {issues.slice(0, 5).map((issue) => (
                <div key={issue.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">{issue.customer.fullName}</span>
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {ISSUE_TYPE_LABELS[issue.issueType] || issue.issueType}
                      </span>
                      {issue.priority === "HIGH" && (
                        <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                          Ưu tiên
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[400px]">
                      {issue.orderCode && <span className="text-slate-500">[{issue.orderCode}]</span>}{" "}
                      {issue.description}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      issue.status === "NEW" ? "bg-red-100 text-red-700"
                      : issue.status === "IN_PROGRESS" ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                    }`}>
                      {issue.status === "NEW" ? "Mới" : issue.status === "IN_PROGRESS" ? "Đang xử lý" : issue.status}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">{timeAgo(issue.createdAt)} trước</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ─── QUICK LINKS ─── */}
      <section className="mb-6">
        <h2 className="text-sm font-bold text-slate-900 mb-3">🔗 Truy cập nhanh</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Quét kho", href: "/scanner", icon: "📷" },
            { label: "Tài chính", href: "/admin/finance", icon: "💰" },
            { label: "Đơn hàng", href: "/admin/orders", icon: "📦" },
            { label: "Khiếu nại", href: "/admin/customer-issues", icon: "⚠️" },
            { label: "Thông báo lỗi", href: "/admin/notification-failures", icon: "🔔" },
            { label: "Đơn bị kẹt", href: "/admin/stuck-shipments", icon: "🚚" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <span className="text-lg">{link.icon}</span>
              <span className="text-xs font-medium text-slate-700">{link.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
