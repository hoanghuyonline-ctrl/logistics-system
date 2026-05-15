"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  const inFlightRef = useRef(false);
  const mountedRef = useRef(false);

  const fetchAll = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const [qv, topups, stuck, notifs, issueData] = await Promise.all([
        fetch("/api/admin/quick-views").then((r) => r.json()),
        fetch("/api/admin/topup-requests").then((r) => r.json()),
        fetch("/api/admin/stuck-shipments").then((r) => r.json()),
        fetch("/api/admin/notifications/failures?filter=unresolved").then((r) => r.json()),
        fetch("/api/admin/customer-issues?status=NEW").then((r) => r.json()),
      ]);
      setQuickViews(qv);
      setPendingTopUps(Array.isArray(topups) ? topups.filter((t: TopUpRequest) => t.status === "PENDING") : []);
      setStuckCategories(stuck.categories || []);
      setNotifFailures(notifs.failures?.slice(0, 10) || []);
      setUnresolvedNotifCount(notifs.unresolved || 0);
      setIssues(issueData.issues?.slice(0, 10) || []);
      setIssueCounts(issueData.statusCounts || {});
      setLastUpdated(new Date());
      setLoading(false);
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
          SECTION 1: VIỆC CẦN LÀM NGAY (Urgent)
          ═══════════════════════════════════════════ */}
      <section className="mb-6">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
          🔴 Việc cần làm ngay
          {urgentCount > 0 ? (
            <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full animate-pulse">
              {urgentCount} việc
            </span>
          ) : (
            <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Không có việc khẩn
            </span>
          )}
        </h2>

        {quickViews && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Nạp tiền chờ duyệt", value: quickViews.pendingDeposits, icon: "💳", href: "/admin/finance" },
              { label: "Đơn chưa thanh toán", value: quickViews.unpaidOrders, icon: "💰", href: "/admin/orders" },
              { label: "Khiếu nại chưa xử lý", value: quickViews.unresolvedIssues, icon: "⚠️", href: "/admin/customer-issues" },
              { label: "Thông báo lỗi", value: quickViews.notifFailures, icon: "🔔", href: "/admin/notification-failures" },
              { label: "Đơn hàng bị kẹt", value: quickViews.staleOrders, icon: "📦", href: "/admin/stuck-shipments" },
            ].map((card) => {
              const badge = urgencyBadge(card.value);
              return (
                <Link
                  key={card.label}
                  href={card.href}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all hover:shadow-md ${
                    card.value > 0 ? "border-red-200 bg-red-50 hover:bg-red-100/50" : "border-green-200 bg-green-50 hover:bg-green-100/50"
                  }`}
                >
                  <span className="text-lg">{card.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-slate-500 truncate">{card.label}</div>
                    <div className="text-base font-bold text-slate-900">{card.value}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badge.cls}`}>
                    {card.value > 0 ? "Cần xử lý" : "OK"}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

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
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            💳 Nạp tiền chờ duyệt
            {pendingTopUps.length > 0 ? (
              <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {pendingTopUps.length} yêu cầu
              </span>
            ) : (
              <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Đã duyệt hết
              </span>
            )}
          </h2>
          <Link href="/admin/finance" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            Duyệt nạp tiền →
          </Link>
        </div>
        {pendingTopUps.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-sm text-green-700">
            ✅ Tất cả yêu cầu nạp tiền đã được duyệt
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="divide-y divide-slate-100">
              {pendingTopUps.slice(0, 5).map((req) => (
                <div key={req.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900">{req.customer.fullName}</div>
                    <div className="text-xs text-slate-500">
                      <span className="font-semibold text-emerald-600">{parseFloat(req.amount).toLocaleString()} VND</span>
                      {" — "}Ref: {req.transferReference}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                      ⏳ Chờ duyệt
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Kho TQ bị kẹt", value: quickViews.stuckChina, icon: "🏭", level: quickViews.stuckChina > 0 ? "yellow" : "green" },
              { label: "Kho VN bị kẹt", value: quickViews.stuckVietnam, icon: "🏗️", level: quickViews.stuckVietnam > 0 ? "yellow" : "green" },
              { label: "Câu hỏi chưa trả lời", value: quickViews.unansweredQuestions, icon: "❓", level: quickViews.unansweredQuestions > 0 ? "yellow" : "green" },
              { label: "Ghi chú chưa xử lý", value: quickViews.unresolvedNotes, icon: "🔖", level: quickViews.unresolvedNotes > 0 ? "yellow" : "green" },
            ].map((w) => (
              <div key={w.label} className={`flex items-center gap-3 p-3 rounded-xl border ${levelBorder(w.level)}`}>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Xem đơn hàng", href: "/admin/orders", icon: "📦", color: "bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700" },
            { label: "Duyệt nạp tiền", href: "/admin/finance", icon: "💳", color: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700" },
            { label: "Quét kho", href: "/scanner", icon: "📷", color: "bg-violet-50 border-violet-200 hover:bg-violet-100 text-violet-700" },
            { label: "Xem khiếu nại", href: "/admin/customer-issues", icon: "⚠️", color: "bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-700" },
            { label: "Xem lỗi thông báo", href: "/admin/notification-failures", icon: "🔔", color: "bg-red-50 border-red-200 hover:bg-red-100 text-red-700" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-2.5 p-3.5 rounded-xl border font-medium text-sm transition-all hover:shadow-md ${action.color}`}
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
