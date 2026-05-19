"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { playAlertBeep, triggerVibration, isAlertEnabled, setAlertEnabled as persistAlertEnabled } from "@/lib/alertSound";

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
  ordersMissingTracking: number;
  allAtVietnamWh: number;
  newOrdersToday: number;
  highPriorityActive: number;
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

interface SlaOrder {
  id: string;
  orderCode: string;
  productName: string;
  customer: string;
  status: string;
  daysSince: number;
  totalCostVND: number;
}

interface SlaAlert {
  key: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  count: number;
  orders: SlaOrder[];
}

interface SlaData {
  alerts: SlaAlert[];
  totalAlerts: number;
}

interface InboxItem {
  type: string;
  title: string;
  reason: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  time: string;
  href: string;
}

interface InboxData {
  items: InboxItem[];
  total: number;
}

/* ─── helpers ─── */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ`;
  const days = Math.floor(hours / 24);
  return `${days} ngày`;
}

function levelBorder(level: string) {
  if (level === "red") return "border-red-500/30 bg-red-500/5";
  if (level === "yellow") return "border-amber-500/30 bg-amber-500/5";
  return "border-green-500/30 bg-green-500/5";
}

function levelDot(level: string) {
  if (level === "red") return "bg-red-500";
  if (level === "yellow") return "bg-amber-500";
  return "bg-green-500";
}

function urgencyBadge(count: number, thresholdRed = 1, thresholdYellow = 0) {
  if (count >= thresholdRed) return { text: `${count}`, cls: "bg-red-100 text-red-700" };
  if (count > thresholdYellow) return { text: `${count}`, cls: "bg-amber-100 text-amber-700" };
  return { text: "0", cls: "bg-green-100 text-green-700" };
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

/* ─── alert helpers ─── */

/* ─── main component ─── */

export default function AdminOperationsPage() {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [quickViews, setQuickViews] = useState<QuickViewCounts | null>(null);
  const [pendingTopUps, setPendingTopUps] = useState<TopUpRequest[]>([]);
  const [stuckCategories, setStuckCategories] = useState<StuckCategory[]>([]);
  const [notifFailures, setNotifFailures] = useState<NotifFailure[]>([]);
  const [unresolvedNotifCount, setUnresolvedNotifCount] = useState(0);
  const [issues, setIssues] = useState<CustomerIssue[]>([]);
  const [issueCounts, setIssueCounts] = useState<Record<string, number>>({});
  const [slaData, setSlaData] = useState<SlaData | null>(null);
  const [inbox, setInbox] = useState<InboxData | null>(null);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(false);
  const prevUrgentRef = useRef<number | null>(null);
  const alertEnabledRef = useRef(true);

  /* alert toggle */
  const [alertEnabled, setAlertEnabled] = useState(() => isAlertEnabled());

  useEffect(() => {
    alertEnabledRef.current = alertEnabled;
  }, [alertEnabled]);

  const toggleAlert = useCallback(() => {
    setAlertEnabled((prev) => {
      const next = !prev;
      persistAlertEnabled(next);
      return next;
    });
  }, []);

  const fetchAll = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const safeFetch = async (url: string) => {
        try {
          const r = await fetch(url);
          if (!r.ok) return null;
          return await r.json();
        } catch { return null; }
      };
      const [qv, topups, stuck, notifs, issueData, sla, inboxData] = await Promise.all([
        safeFetch("/api/admin/quick-views"),
        safeFetch("/api/admin/topup-requests"),
        safeFetch("/api/admin/stuck-shipments"),
        safeFetch("/api/admin/notifications/failures?filter=unresolved"),
        safeFetch("/api/admin/customer-issues?status=NEW"),
        safeFetch("/api/admin/sla-alerts"),
        safeFetch("/api/admin/daily-inbox"),
      ]);
      if (qv) setQuickViews(qv);
      setPendingTopUps(Array.isArray(topups) ? topups.filter((t: TopUpRequest) => t.status === "PENDING") : []);
      setStuckCategories(stuck?.categories || []);
      setNotifFailures(notifs?.failures?.slice(0, 10) || []);
      setUnresolvedNotifCount(notifs?.unresolved || 0);
      setIssues(issueData?.issues?.slice(0, 10) || []);
      setIssueCounts(issueData?.statusCounts || {});
      if (sla) setSlaData(sla);
      if (inboxData) setInbox(inboxData);
      setLastUpdated(new Date());
      setLoading(false);

      const stuckTotal = (stuck?.categories || []).reduce(
        (s: number, c: StuckCategory) => s + c.items.length, 0
      );
      const newUrgent =
        (qv?.pendingDeposits || 0) +
        (qv?.unresolvedIssues || 0) +
        (qv?.notifFailures || 0) +
        stuckTotal;

      if (prevUrgentRef.current !== null && newUrgent > prevUrgentRef.current && alertEnabledRef.current) {
        playAlertBeep();
        triggerVibration();
      }
      prevUrgentRef.current = newUrgent;
    } catch {
      setLoading(false);
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  /* initial load + auto-refresh every 30s */
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      fetchAll();
    }
  }, [fetchAll]);

  useEffect(() => {
    const id = setInterval(fetchAll, 30000);
    return () => clearInterval(id);
  }, [fetchAll]);

  if (loading) return <LoadingSpinner text="Đang tải dữ liệu..." />;

  const totalStuck = stuckCategories.reduce((sum, c) => sum + c.items.length, 0);
  const activeStuck = stuckCategories.filter((c) => c.items.length > 0);

  /* compute urgent items count for "Việc cần làm ngay" */
  const urgentCount =
    (quickViews?.pendingDeposits || 0) +
    (quickViews?.unresolvedIssues || 0) +
    (quickViews?.notifFailures || 0) +
    totalStuck;

  return (
    <div>
      <PageHeader
        title="🏠 Trung tâm điều hành"
        subtitle="Trang chủ làm việc hàng ngày cho Admin"
        action={
          <div className="flex items-center gap-3">
            {/* Alert toggle */}
            <button
              onClick={toggleAlert}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                alertEnabled
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                  : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
              }`}
              title={alertEnabled ? "Tắt âm báo khi có việc khẩn" : "Bật âm báo khi có việc khẩn"}
            >
              <span>{alertEnabled ? "🔔" : "🔕"}</span>
              <span>{alertEnabled ? "Âm báo: Bật" : "Âm báo: Tắt"}</span>
            </button>
            {/* Last updated time */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span>Tự động cập nhật</span>
              {lastUpdated && (
                <span className="text-slate-500 font-medium">
                  — Cập nhật lúc {lastUpdated.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>
        }
      />

      {/* ═══════════════════════════════════════════
          SECTION 0: VIỆC CẦN XỬ LÝ HÔM NAY (Inbox)
          ═══════════════════════════════════════════ */}
      {inbox && inbox.items.length > 0 && (
        <section className="mb-5 sm:mb-6">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            📥 Việc cần xử lý hôm nay
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              inbox.items.some((i) => i.severity === "URGENT")
                ? "bg-red-600 text-white animate-pulse"
                : inbox.items.some((i) => i.severity === "HIGH")
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
            }`}>
              {inbox.total} việc
            </span>
          </h2>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="divide-y divide-slate-100">
              {inbox.items.map((item, idx) => {
                const sevStyle: Record<string, { dot: string; badge: string; bg: string }> = {
                  URGENT: { dot: "bg-red-500 animate-pulse", badge: "bg-red-600 text-white", bg: "bg-red-50/50" },
                  HIGH: { dot: "bg-red-400", badge: "bg-red-100 text-red-700", bg: "bg-red-50/30" },
                  MEDIUM: { dot: "bg-amber-400", badge: "bg-amber-100 text-amber-700", bg: "" },
                  LOW: { dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600", bg: "" },
                };
                const s = sevStyle[item.severity] || sevStyle.LOW;
                const typeIcon: Record<string, string> = {
                  topup: "💳", issue: "⚠️", sla: "⏰",
                  notif_failure: "🔔", missing_tracking: "🔍", missing_weight: "⚖️",
                };
                return (
                  <Link
                    key={`${item.type}-${idx}`}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 transition-colors hover:bg-slate-50 ${s.bg}`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                    <span className="text-base shrink-0">{typeIcon[item.type] || "📋"}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-900 truncate">{item.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{item.reason}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400 hidden sm:block">{timeAgo(item.time)}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${s.badge}`}>
                        {item.severity === "URGENT" ? "Khẩn!" : item.severity === "HIGH" ? "Cao" : item.severity === "MEDIUM" ? "TB" : "Thấp"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
            {inbox.total > inbox.items.length && (
              <div className="px-3 sm:px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
                <span className="text-[11px] text-slate-400">
                  Hiển thị {inbox.items.length}/{inbox.total} việc — xem từng mục để xử lý
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          SECTION 1: VIỆC CẦN LÀM NGAY (Urgent)
          ═══════════════════════════════════════════ */}
      <section className="mb-5 sm:mb-6">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
          🔴 Việc cần làm ngay
          {urgentCount > 0 ? (
            <span className="text-[10px] font-bold bg-red-600 text-white px-2.5 py-0.5 rounded-full animate-pulse shadow-sm">
              {urgentCount} việc khẩn
            </span>
          ) : (
            <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Không có việc khẩn
            </span>
          )}
        </h2>

        {quickViews && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {[
              { label: "Nạp tiền chờ duyệt", value: quickViews.pendingDeposits, icon: "💳", href: "/admin/finance", critical: true },
              { label: "Đơn chờ mua hàng", value: quickViews.unpaidOrders, icon: "🛒", href: "/admin/orders", critical: false },
              { label: "Khiếu nại chưa xử lý", value: quickViews.unresolvedIssues, icon: "⚠️", href: "/admin/customer-issues", critical: true },
              { label: "Gửi thông báo lỗi", value: quickViews.notifFailures, icon: "🔔", href: "/admin/notification-failures", critical: false },
              { label: "Đơn kẹt >5 ngày", value: quickViews.staleOrders, icon: "⏰", href: "/admin/stuck-shipments", critical: true },
            ].map((card) => {
              const isUrgent = card.value > 0 && card.critical;
              return (
                <Link
                  key={card.label}
                  href={card.href}
                  className={`flex items-center gap-2 p-2.5 sm:p-3 rounded-xl border transition-all hover:shadow-md ${
                    isUrgent
                      ? "border-red-300 bg-red-50 hover:bg-red-100/60 ring-1 ring-red-200"
                      : card.value > 0
                        ? "border-amber-200 bg-amber-50 hover:bg-amber-100/50"
                        : "border-green-200 bg-green-50 hover:bg-green-100/50"
                  }`}
                >
                  <span className="text-lg">{card.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-slate-500 truncate">{card.label}</div>
                    <div className={`text-base font-bold ${
                      isUrgent ? "text-red-700" : "text-slate-900"
                    }`}>{card.value}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isUrgent
                      ? "bg-red-600 text-white"
                      : card.value > 0
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                  }`}>
                    {isUrgent ? "Khẩn!" : card.value > 0 ? "Cần xử lý" : "OK"}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 1.5: BẢNG KIỂM VẬN HÀNH HÀNG NGÀY
          ═══════════════════════════════════════════ */}
      {quickViews && (
        <section className="mb-6">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            📋 Bảng kiểm vận hành hàng ngày
          </h2>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="divide-y divide-slate-100">
              {[
                {
                  label: "Nạp tiền chờ duyệt",
                  value: quickViews.pendingDeposits,
                  icon: "💳",
                  href: "/admin/finance",
                  desc: "Khách đã chuyển khoản, chờ admin xác nhận",
                  urgent: true,
                },
                {
                  label: "Đơn mới — cần mua hàng",
                  value: quickViews.unpaidOrders,
                  icon: "🛒",
                  href: "/admin/orders",
                  desc: "Đơn PENDING chờ đặt mua từ nhà cung cấp",
                  urgent: false,
                },
                {
                  label: "Đơn thiếu mã vận đơn",
                  value: quickViews.ordersMissingTracking,
                  icon: "🔍",
                  href: "/admin/stuck-shipments",
                  desc: "Đã mua nhưng chưa nhập tracking TQ",
                  urgent: false,
                },
                {
                  label: "Đơn kẹt quá 5 ngày",
                  value: quickViews.staleOrders,
                  icon: "⏰",
                  href: "/admin/stuck-shipments",
                  desc: "Không cập nhật trạng thái >5 ngày — cần kiểm tra",
                  urgent: true,
                },
                {
                  label: "Đã về kho VN — chờ giao",
                  value: quickViews.allAtVietnamWh,
                  icon: "🏗️",
                  href: "/admin/orders",
                  desc: "Hàng đã đến kho VN, cần sắp xếp giao khách",
                  urgent: false,
                },
                {
                  label: "Đơn ưu tiên cao / Khẩn",
                  value: quickViews.highPriorityActive,
                  icon: "🔴",
                  href: "/admin/orders",
                  desc: "Đơn HIGH hoặc URGENT đang xử lý",
                  urgent: true,
                },
              ].map((item) => {
                const hasItems = item.value > 0;
                const isRed = hasItems && item.urgent;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 sm:px-4 py-3 transition-colors ${
                      isRed ? "bg-red-50/50 hover:bg-red-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-lg shrink-0">{item.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-900">{item.label}</div>
                      <div className="text-[11px] text-slate-400 hidden sm:block">{item.desc}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-base font-bold ${
                        isRed ? "text-red-700" : hasItems ? "text-slate-900" : "text-green-600"
                      }`}>{item.value}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isRed
                          ? "bg-red-600 text-white"
                          : hasItems
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                      }`}>
                        {isRed ? "Khẩn!" : hasItems ? "Cần xem" : "OK"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="px-3 sm:px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Đơn mới hôm nay: <span className="font-semibold text-slate-600">{quickViews.newOrdersToday}</span>
              </span>
              <Link href="/admin/orders" className="text-[11px] text-blue-600 hover:underline">
                Xem tất cả đơn hàng →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          SECTION 1.8: CẢNH BÁO SLA VẬN HÀNH
          ═══════════════════════════════════════════ */}
      {slaData && slaData.alerts.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            🎯 Cảnh báo SLA vận hành
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              slaData.alerts.some((a) => a.severity === "URGENT")
                ? "bg-red-600 text-white animate-pulse"
                : slaData.alerts.some((a) => a.severity === "HIGH")
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
            }`}>
              {slaData.totalAlerts} đơn cần chú ý
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {slaData.alerts.map((alert) => {
              const sevColors: Record<string, { border: string; bg: string; badge: string; dot: string }> = {
                URGENT: { border: "border-red-300", bg: "bg-red-50", badge: "bg-red-600 text-white", dot: "bg-red-500 animate-pulse" },
                HIGH: { border: "border-red-200", bg: "bg-red-50/50", badge: "bg-red-100 text-red-700", dot: "bg-red-400" },
                MEDIUM: { border: "border-amber-200", bg: "bg-amber-50/50", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-400" },
                LOW: { border: "border-slate-200", bg: "bg-slate-50", badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
              };
              const c = sevColors[alert.severity] || sevColors.LOW;
              const sevLabel: Record<string, string> = { URGENT: "Khẩn cấp", HIGH: "Cao", MEDIUM: "Trung bình", LOW: "Thấp" };
              return (
                <div key={alert.key} className={`rounded-xl border p-3 ${c.border} ${c.bg}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                    <span className="text-xs font-semibold text-slate-800 flex-1 truncate">{alert.title}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${c.badge}`}>
                      {alert.count} · {sevLabel[alert.severity]}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">{alert.description}</p>
                  <div className="space-y-1">
                    {alert.orders.slice(0, 4).map((o) => (
                      <Link
                        key={o.id}
                        href={`/admin/orders/${o.id}`}
                        className="flex items-center gap-2 text-[11px] text-slate-600 hover:text-blue-600 transition-colors"
                      >
                        <span className="font-medium text-blue-600">{o.orderCode}</span>
                        <span className="text-slate-400 truncate flex-1">— {o.customer}</span>
                        <span className="text-slate-400 shrink-0">{o.daysSince}d</span>
                        {o.totalCostVND >= 5000000 && (
                          <span className="text-[9px] font-bold bg-purple-100 text-purple-700 px-1 py-0.5 rounded shrink-0">
                            {(o.totalCostVND / 1000000).toFixed(1)}M
                          </span>
                        )}
                      </Link>
                    ))}
                    {alert.orders.length > 4 && (
                      <div className="text-[10px] text-slate-400 pt-0.5">
                        +{alert.orders.length - 4} đơn khác
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          SECTION 2: ĐƠN HÀNG CẦN XỬ LÝ (Stuck)
          ═══════════════════════════════════════════ */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            🚚 Đơn hàng cần xử lý
            {totalStuck > 0 ? (
              <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {totalStuck} đơn
              </span>
            ) : (
              <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Tất cả bình thường
              </span>
            )}
          </h2>
          <Link href="/admin/stuck-shipments" className="text-xs text-blue-600 hover:underline">
            Xem chi tiết →
          </Link>
        </div>
        {activeStuck.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-sm text-green-700">
            ✅ Không có đơn hàng bị kẹt — vận hành bình thường
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {activeStuck.map((cat) => (
              <div key={cat.key} className={`rounded-xl border p-3 ${levelBorder(cat.level)}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${levelDot(cat.level)} ${cat.level === "red" ? "animate-pulse" : ""}`} />
                  <span className="text-xs font-semibold text-slate-700">{cat.label}</span>
                  <span className={`text-[10px] font-bold ml-auto px-1.5 py-0.5 rounded-full ${
                    cat.level === "red" ? "bg-red-100 text-red-700" : cat.level === "yellow" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                  }`}>{cat.items.length}</span>
                </div>
                <div className="space-y-1">
                  {cat.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="text-[11px] text-slate-600 truncate">
                      <span className="font-medium">{item.orderCode || item.packageCode}</span>
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

      {/* ═══════════════════════════════════════════
          SECTION 3: NẠP TIỀN CHỜ DUYỆT
          ═══════════════════════════════════════════ */}
      <section className={`mb-5 sm:mb-6 ${
        pendingTopUps.length > 0 ? "rounded-xl ring-2 ring-red-200 p-3 sm:p-4 bg-red-50/30" : ""
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            💳 Nạp tiền chờ duyệt
            {pendingTopUps.length > 0 ? (
              <span className="text-[10px] font-bold bg-red-600 text-white px-2.5 py-0.5 rounded-full animate-pulse shadow-sm">
                {pendingTopUps.length} chờ duyệt!
              </span>
            ) : (
              <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Đã duyệt hết
              </span>
            )}
          </h2>
          <Link href="/admin/finance" className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1">
            Duyệt ngay →
          </Link>
        </div>
        {pendingTopUps.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-sm text-green-700">
            Tất cả yêu cầu nạp tiền đã được duyệt
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="divide-y divide-slate-100">
              {pendingTopUps.slice(0, 5).map((req) => (
                <div key={req.id} className="flex items-center justify-between px-3 sm:px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900">{req.customer.fullName}</div>
                    <div className="text-xs text-slate-500">
                      <span className="font-bold text-red-600">{parseFloat(req.amount).toLocaleString()} VND</span>
                      <span className="hidden sm:inline">{" — "}Ref: {req.transferReference}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded">
                      Chờ duyệt
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

      {/* ═══════════════════════════════════════════
          SECTION 4: CẢNH BÁO VẬN HÀNH (Warnings)
          ═══════════════════════════════════════════ */}
      {quickViews && (
        <section className="mb-6">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            🟡 Cảnh báo vận hành
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {[
              { label: "Kho TQ kẹt >5 ngày", value: quickViews.stuckChina, icon: "🏭", level: quickViews.stuckChina > 0 ? "yellow" : "green" },
              { label: "Kho VN kẹt >3 ngày", value: quickViews.stuckVietnam, icon: "🏗️", level: quickViews.stuckVietnam > 0 ? "yellow" : "green" },
              { label: "Chatbot chưa trả lời", value: quickViews.unansweredQuestions, icon: "❓", level: quickViews.unansweredQuestions > 0 ? "yellow" : "green" },
              { label: "Ghi chú nội bộ chờ xử lý", value: quickViews.unresolvedNotes, icon: "🔖", level: quickViews.unresolvedNotes > 0 ? "yellow" : "green" },
            ].map((w) => (
              <div key={w.label} className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border ${levelBorder(w.level)}`}>
                <span className="text-lg">{w.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-slate-500">{w.label}</div>
                  <div className="text-base font-bold text-slate-900">{w.value}</div>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ${levelDot(w.level)} ${w.level === "yellow" ? "animate-pulse" : ""}`} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          SECTION 5: KHIẾU NẠI KHÁCH HÀNG
          ═══════════════════════════════════════════ */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            ⚠️ Khiếu nại khách hàng
            {(issueCounts["NEW"] || 0) > 0 && (
              <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full animate-pulse">
                {issueCounts["NEW"]} mới
              </span>
            )}
            {(issueCounts["IN_PROGRESS"] || 0) > 0 && (
              <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {issueCounts["IN_PROGRESS"]} đang xử lý
              </span>
            )}
            {!issueCounts["NEW"] && !issueCounts["IN_PROGRESS"] && (
              <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Không có khiếu nại
              </span>
            )}
          </h2>
          <Link href="/admin/customer-issues" className="text-xs text-blue-600 hover:underline">
            Xem khiếu nại →
          </Link>
        </div>
        {issues.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-sm text-green-700">
            ✅ Không có khiếu nại mới cần xử lý
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="divide-y divide-slate-100">
              {issues.slice(0, 5).map((issue) => (
                <div key={issue.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-900">{issue.customer.fullName}</span>
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {ISSUE_TYPE_LABELS[issue.issueType] || issue.issueType}
                      </span>
                      {issue.priority === "HIGH" && (
                        <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                          🔴 Ưu tiên cao
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[400px]">
                      {issue.orderCode && <span className="text-slate-500 font-medium">[{issue.orderCode}]</span>}{" "}
                      {issue.description}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      issue.status === "NEW" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {issue.status === "NEW" ? "🔴 Mới" : "🟡 Đang xử lý"}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">{timeAgo(issue.createdAt)} trước</div>
                  </div>
                </div>
              ))}
            </div>
            {issues.length > 5 && (
              <div className="px-4 py-2 bg-slate-50 text-center">
                <Link href="/admin/customer-issues" className="text-xs text-blue-600 hover:underline">
                  +{issues.length - 5} khiếu nại khác →
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 6: LỖI THÔNG BÁO
          ═══════════════════════════════════════════ */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            🔔 Lỗi thông báo
            {unresolvedNotifCount > 0 ? (
              <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {unresolvedNotifCount} chưa xử lý
              </span>
            ) : (
              <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Không có lỗi
              </span>
            )}
          </h2>
          <Link href="/admin/notification-failures" className="text-xs text-blue-600 hover:underline">
            Xem lỗi thông báo →
          </Link>
        </div>
        {notifFailures.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-sm text-green-700">
            ✅ Tất cả thông báo gửi thành công
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="divide-y divide-slate-100">
              {notifFailures.slice(0, 5).map((f) => (
                <div key={f.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        f.channel === "TELEGRAM" ? "bg-blue-100 text-blue-700"
                        : f.channel === "ZALO" ? "bg-emerald-100 text-emerald-700"
                        : "bg-purple-100 text-purple-700"
                      }`}>
                        {f.channel}
                      </span>
                      <span className="text-xs text-slate-500 truncate max-w-[180px]">
                        {f.recipient || "—"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[300px]">
                      {f.shortReason || "Không rõ lỗi"}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                      Retry {f.retryCount}/3
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">{timeAgo(f.createdAt)} trước</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════
          QUICK ACTION BUTTONS
          ═══════════════════════════════════════════ */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-slate-900 mb-3">⚡ Hành động nhanh</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: "Quản lý đơn hàng", href: "/admin/orders", icon: "📦", color: "bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700" },
            { label: "Duyệt nạp tiền", href: "/admin/finance", icon: "💳", color: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700" },
            { label: "Đơn kẹt / Tracking", href: "/admin/stuck-shipments", icon: "🚚", color: "bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-700" },
            { label: "Quét kho", href: "/scanner", icon: "📷", color: "bg-violet-50 border-violet-200 hover:bg-violet-100 text-violet-700" },
            { label: "Khiếu nại khách", href: "/admin/customer-issues", icon: "⚠️", color: "bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-700" },
            { label: "Lỗi thông báo", href: "/admin/notification-failures", icon: "🔔", color: "bg-red-50 border-red-200 hover:bg-red-100 text-red-700" },
            { label: "Quản lý khách hàng", href: "/admin/users", icon: "👥", color: "bg-cyan-50 border-cyan-200 hover:bg-cyan-100 text-cyan-700" },
            { label: "Quản lý kiện hàng", href: "/admin/packages", icon: "📋", color: "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-2 sm:gap-2.5 p-3 sm:p-3.5 rounded-xl border font-medium text-sm transition-all hover:shadow-md ${action.color}`}
            >
              <span className="text-xl">{action.icon}</span>
              <span>{action.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
