"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import MobileDataCard from "@/components/ui/MobileDataCard";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n";

const TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PURCHASED", "CANCELLED"],
  PURCHASED: ["SELLER_SHIPPED", "CANCELLED"],
  SELLER_SHIPPED: ["ARRIVED_CHINA_WH"],
  ARRIVED_CHINA_WH: ["PACKING"],
  PACKING: ["SHIPPING_TO_VIETNAM"],
  SHIPPING_TO_VIETNAM: ["ARRIVED_VIETNAM_WH"],
  ARRIVED_VIETNAM_WH: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["COMPLETED"],
};

const ORDER_TYPE_BADGES: Record<string, { label: string; icon: string; color: string }> = {
  ECOMMERCE: { label: "TMDT", icon: "🛒", color: "bg-blue-50 text-blue-600" },
  ENTRUST: { label: "Ủy thác", icon: "📦", color: "bg-emerald-50 text-emerald-600" },
  CONSIGNMENT: { label: "Ký gửi", icon: "🚚", color: "bg-orange-50 text-orange-600" },
};

interface Order {
  id: string;
  orderCode: string;
  orderType: string;
  productName: string;
  quantity: number;
  status: string;
  customStatusNote: string | null;
  totalCostVND: string;
  createdAt: string;
  updatedAt: string;
  priority: string;
  weightKg: string | null;
  trackingCodeChina: string | null;
  trackingCodeIntl: string | null;
  packageId: string | null;
  user: { id: string; fullName: string; email: string; phone: string | null };
  package: { totalWeightKg: string | null; barcode: string | null } | null;
  orderNotes: Array<{ content: string; createdAt: string; user: { fullName: string; role: string } }>;
  statusLogs: Array<{ createdAt: string; toStatus: string; changer: { fullName: string; role: string } }>;
}

const ACTIVE_STATUSES = ["PENDING", "PURCHASED", "SELLER_SHIPPED", "ARRIVED_CHINA_WH", "PACKING", "SHIPPING_TO_VIETNAM", "ARRIVED_VIETNAM_WH", "OUT_FOR_DELIVERY"];
const POST_CHINA_STATUSES = ["ARRIVED_CHINA_WH", "PACKING", "SHIPPING_TO_VIETNAM", "ARRIVED_VIETNAM_WH", "OUT_FOR_DELIVERY"];
const POST_SHIPPED_STATUSES = ["SELLER_SHIPPED", "ARRIVED_CHINA_WH", "PACKING", "SHIPPING_TO_VIETNAM", "ARRIVED_VIETNAM_WH", "OUT_FOR_DELIVERY"];
const STALE_DAYS = 5;

const STATUS_DOT_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-400",
  PURCHASED: "bg-blue-400",
  SELLER_SHIPPED: "bg-indigo-400",
  ARRIVED_CHINA_WH: "bg-purple-400",
  PACKING: "bg-orange-400",
  SHIPPING_TO_VIETNAM: "bg-cyan-400",
  ARRIVED_VIETNAM_WH: "bg-teal-400",
  OUT_FOR_DELIVERY: "bg-lime-500",
  COMPLETED: "bg-green-500",
  CANCELLED: "bg-red-500",
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  HIGH: { label: "Ưu tiên", className: "bg-amber-100 text-amber-700 border-amber-200" },
  URGENT: { label: "Khẩn cấp", className: "bg-red-100 text-red-700 border-red-200" },
};

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <AdminOrdersContent />
    </Suspense>
  );
}

function AdminOrdersContent() {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();

  function copyToClipboard(value: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      toast(t("orders.copied", "\u0110\u00e3 sao ch\u00e9p"), "success");
    });
  }
  const searchParams = useSearchParams();  
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(() => parseInt(searchParams.get("page") || "1"));
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState(() => searchParams.get("status") || "");
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [filter, setFilter] = useState(() => searchParams.get("filter") || "");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{ statusCounts: Record<string, number>; urgentCount: number } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const urlParams = new URLSearchParams();
    if (page > 1) urlParams.set("page", String(page));
    if (status) urlParams.set("status", status);
    if (search) urlParams.set("search", search);
    if (filter) urlParams.set("filter", filter);
    const qs = urlParams.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [page, status, search, filter]);

  const quickUpdateStatus = useCallback(async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      toast(`Đã chuyển trạng thái`, "success");
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
    } else {
      const data = await res.json();
      toast(data.error || "Không thể cập nhật", "error");
    }
    setUpdatingId(null);
  }, [toast]);

  const handleRowClick = useCallback((e: React.MouseEvent, orderId: string) => {
    const url = `/admin/orders/${orderId}`;
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      window.open(url, "_blank");
    } else {
      router.push(url);
    }
  }, [router]);

  const filters = [
    { key: "hasNotes", label: "Có ghi chú", icon: "📝" },
    { key: "hasCustomNote", label: "Có cập nhật khách hàng", icon: "📢" },
    { key: "longPending", label: "Đang chờ lâu", icon: "⏳" },
    { key: "cancelled", label: "Đã huỷ", icon: "❌" },
    { key: "today", label: "Hôm nay", icon: "📅" },
    { key: "notCompleted", label: "Chưa hoàn thành", icon: "📦" },
  ];

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    if (filter) params.set("filter", filter);

    params.set("summary", "1");
    fetch(`/api/orders?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setOrders(d.orders || []);
        setTotalPages(d.totalPages || 1);
        if (d.summary) setSummary(d.summary);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page, status, search, filter]);

  return (
    <div>
      <PageHeader 
        title={t("orders.adminTitle")} 
        subtitle={t("orders.adminSubtitle")} 
        action={
          <Link href="/orders/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            + {t("orders.newOrder", "Tạo đơn mới")}
          </Link>
        }
      />

      {summary && (
        <div className="flex flex-wrap gap-2 mb-4">
          {([
            { key: "PENDING", label: "Chờ mua", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
            { key: "PURCHASED", label: "Đã mua", color: "bg-blue-50 text-blue-700 border-blue-200" },
            { key: "SHIPPING_TO_VIETNAM", label: "Đang vận chuyển", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
            { key: "ARRIVED_VIETNAM_WH", label: "Tới kho VN", color: "bg-teal-50 text-teal-700 border-teal-200" },
            { key: "COMPLETED", label: "Hoàn thành", color: "bg-green-50 text-green-700 border-green-200" },
          ] as const).map((s) => {
            const count = summary.statusCounts[s.key] || 0;
            const isActive = status === s.key;
            return (
              <button key={s.key} onClick={() => { setStatus(isActive ? "" : s.key); setPage(1); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${isActive ? "ring-2 ring-offset-1 ring-blue-400" : ""} ${s.color}`}>
                {s.label} <span className="font-bold">{count}</span>
              </button>
            );
          })}
          {summary.urgentCount > 0 && (
            <button onClick={() => { setFilter(filter === "urgent" ? "" : "urgent"); setPage(1); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors bg-red-50 text-red-700 border-red-200 ${filter === "urgent" ? "ring-2 ring-offset-1 ring-red-400" : ""}`}>
              Khẩn cấp <span className="font-bold">{summary.urgentCount}</span>
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(filter === f.key ? "" : f.key); setPage(1); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              filter === f.key
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span>{f.icon}</span>
            {f.label}
          </button>
        ))}
        {filter && (
          <button
            onClick={() => { setFilter(""); setPage(1); }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input type="text" placeholder={t("orders.adminSearchPlaceholder")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
          <option value="">{t("orders.allStatuses")}</option>
          <option value="PENDING">{t("status.PENDING")}</option>
          <option value="PURCHASED">{t("status.PURCHASED")}</option>
          <option value="SELLER_SHIPPED">{t("status.SELLER_SHIPPED")}</option>
          <option value="ARRIVED_CHINA_WH">{t("status.ARRIVED_CHINA_WH")}</option>
          <option value="SHIPPING_TO_VIETNAM">{t("status.SHIPPING_TO_VIETNAM")}</option>
          <option value="ARRIVED_VIETNAM_WH">{t("status.ARRIVED_VIETNAM_WH")}</option>
          <option value="OUT_FOR_DELIVERY">{t("status.OUT_FOR_DELIVERY")}</option>
          <option value="COMPLETED">{t("status.COMPLETED")}</option>
          <option value="CANCELLED">{t("status.CANCELLED")}</option>
        </select>
      </div>

      {loading ? <LoadingSpinner text={t("orders.loading")} /> : (
        <Card noPadding>
          {orders.length === 0 ? (
            <EmptyState icon="📦" title={t("orders.empty")} description={t("orders.emptyAdjust")} />
          ) : (
            <>
              {/* Mobile card view */}
              <div className="md:hidden flex flex-col gap-2 p-2">
                {orders.map((order) => {
                  const isCancelled = order.status === "CANCELLED";
                  const nextStatuses = (TRANSITIONS[order.status] || []).filter((s) => s !== "CANCELLED");
                  return (
                    <MobileDataCard
                      key={order.id}
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                      highlight={isCancelled ? "border-l-4 border-l-red-400" : ""}
                      header={
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT_COLORS[order.status] || "bg-slate-400"}`} />
                              <span className="text-sm font-semibold text-blue-600">{order.orderCode}</span>
                              {priorityConfig[order.priority] && (
                                <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border ${priorityConfig[order.priority].className}`}>
                                  {priorityConfig[order.priority].label}
                                </span>
                              )}
                            </div>
                            <StatusBadge status={order.status} />
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-sm text-slate-600">{order.user.fullName}</span>
                            {(() => { const b = ORDER_TYPE_BADGES[order.orderType]; return b ? <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${b.color}`}>{b.icon} {b.label}</span> : null; })()}
                          </div>
                          <p className="text-sm font-bold text-slate-900 mt-1 break-all">{order.productName}</p>
                        </div>
                      }
                      fields={[
                        { label: "Tổng", value: <span className="font-semibold">{parseFloat(order.totalCostVND).toLocaleString()} VND</span> },
                        { label: "Ngày", value: new Date(order.createdAt).toLocaleDateString() },
                      ]}
                      actions={nextStatuses.length > 0 ? (
                        <>
                          {nextStatuses.map((s) => (
                            <button key={s} disabled={updatingId === order.id} onClick={() => quickUpdateStatus(order.id, s)}
                              className="px-2 py-1 text-[11px] font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50 whitespace-nowrap">
                              {updatingId === order.id ? "\u2026" : `\u2192 ${t(`status.${s}`, s)}`}
                            </button>
                          ))}
                        </>
                      ) : undefined}
                    />
                  );
                })}
              </div>

              {/* Desktop table view */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[14%]" />
                    <col className="w-[14%]" />
                    <col className="w-[18%]" />
                    <col className="w-[16%]" />
                    <col className="w-[9%]" />
                    <col className="w-[8%]" />
                    <col className="w-[10%]" />
                    <col className="w-[11%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("orders.order")}</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("orders.customer")}</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("orderDetail.product")}</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.status")}</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.total")}</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.date")}</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Hoạt động</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {orders.map((order) => {
                      const isCancelled = order.status === "CANCELLED";
                      const daysSinceCreated = Math.floor((now - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                      const isLongPending = order.status === "PENDING" && daysSinceCreated >= 3;
                      const hasNotes = order.orderNotes.length > 0;
                      const hasCustomNote = !!order.customStatusNote;

                      return (
                      <tr key={order.id} className={`transition-colors cursor-pointer ${isCancelled ? "bg-red-50/50 hover:bg-red-50" : "hover:bg-slate-50/50"}`} onClick={(e) => handleRowClick(e, order.id)} onAuxClick={(e) => { if (e.button === 1) handleRowClick(e, order.id); }}>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT_COLORS[order.status] || "bg-slate-400"}`} title={t(`status.${order.status}`)} />
                            <Link href={`/admin/orders/${order.id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700" onClick={(e) => e.stopPropagation()}>
                              {order.orderCode}
                            </Link>
                            <button onClick={(e) => copyToClipboard(order.orderCode, e)}
                              className="text-slate-400 hover:text-blue-500 transition-colors shrink-0" title={t("orders.copyOrderCode", "Sao ch\u00e9p m\u00e3 \u0111\u01a1n")}>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                            </button>
                            {priorityConfig[order.priority] && (
                              <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border ${priorityConfig[order.priority].className}`}>
                                {priorityConfig[order.priority].label}
                              </span>
                            )}
                            {hasNotes && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" title="C\u00f3 ghi ch\u00fa" />
                            )}
                            {hasCustomNote && (
                              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="C\u00f3 ghi ch\u00fa tr\u1ea1ng th\u00e1i" />
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1 min-w-0">
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-slate-900 truncate">{order.user.fullName}</div>
                              <div className="text-xs text-slate-400 truncate">{order.user.email}</div>
                            </div>
                            <div className="flex items-center gap-0.5 ml-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {order.user.phone && (
                                <button onClick={(e) => copyToClipboard(order.user.phone!, e)}
                                  className="text-slate-400 hover:text-emerald-500 transition-colors p-0.5" title={`${t("orders.copyPhone", "Sao ch\u00e9p S\u0110T")}: ${order.user.phone}`}>
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-700">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="truncate block">{order.productName}</span>
                            {(() => { const b = ORDER_TYPE_BADGES[order.orderType]; return b && order.orderType !== "ECOMMERCE" ? <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${b.color}`}>{b.icon} {b.label}</span> : null; })()}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            <StatusBadge status={order.status} />
                            {isLongPending && (
                              <span className="text-amber-500 text-xs" title={`Chờ xử lý ${daysSinceCreated} ngày`}>⏳</span>
                            )}
                          </div>
                          {order.customStatusNote && (
                            <p className="text-xs text-amber-600 mt-1 truncate max-w-[150px]" title={order.customStatusNote}>{order.customStatusNote}</p>
                          )}
                          {(() => {
                            const warnings: Array<{ text: string; cls: string; tip: string }> = [];
                            const isActive = ACTIVE_STATUSES.includes(order.status);
                            const lastLogDate = order.statusLogs[0] ? new Date(order.statusLogs[0].createdAt).getTime() : new Date(order.createdAt).getTime();
                            const daysSinceUpdate = Math.floor((now - lastLogDate) / (1000 * 60 * 60 * 24));
                            if (isActive && daysSinceUpdate >= STALE_DAYS) {
                              warnings.push({ text: t("shipment.notUpdated"), cls: "bg-orange-100 text-orange-700", tip: `${daysSinceUpdate} ${t("shipment.daysNoUpdate")}` });
                            }
                            if (POST_CHINA_STATUSES.includes(order.status) && !order.weightKg && (!order.package || !order.package.totalWeightKg)) {
                              warnings.push({ text: t("shipment.missingData"), cls: "bg-red-100 text-red-600", tip: t("shipment.missingWeight") });
                            }
                            if (POST_SHIPPED_STATUSES.includes(order.status) && !order.trackingCodeChina && !order.trackingCodeIntl) {
                              warnings.push({ text: t("shipment.needsCheck"), cls: "bg-amber-100 text-amber-700", tip: t("shipment.missingTracking") });
                            }
                            if (order.customStatusNote) {
                              warnings.push({ text: t("shipment.awaitingCustomer"), cls: "bg-blue-100 text-blue-600", tip: order.customStatusNote });
                            }
                            if (warnings.length === 0) return null;
                            return (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {warnings.map((w, i) => (
                                  <span key={i} className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${w.cls}`} title={w.tip}>
                                    {w.text}
                                  </span>
                                ))}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-3 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">{parseFloat(order.totalCostVND).toLocaleString()} ₫</td>
                        <td className="px-3 py-3 text-sm text-slate-500 whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-3 py-3 text-sm text-slate-500">
                          {(() => {
                            const noteActivity = order.orderNotes[0] ? { at: new Date(order.orderNotes[0].createdAt), name: order.orderNotes[0].user.fullName, role: order.orderNotes[0].user.role } : null;
                            const logActivity = order.statusLogs[0] ? { at: new Date(order.statusLogs[0].createdAt), name: order.statusLogs[0].changer.fullName, role: order.statusLogs[0].changer.role } : null;
                            const latest = noteActivity && logActivity
                              ? (noteActivity.at > logActivity.at ? noteActivity : logActivity)
                              : noteActivity || logActivity;
                            if (!latest) return <span className="text-slate-300">—</span>;
                            const roleLabels: Record<string, string> = { ADMIN: "Admin", CUSTOMER: "KH", WAREHOUSE_CN: "Kho TQ", WAREHOUSE_VN: "Kho VN", ACCOUNTANT: "Kế toán" };
                            const ago = Math.floor((now - latest.at.getTime()) / 60000);
                            const timeStr = ago < 1 ? "vừa xong" : ago < 60 ? `${ago} phút trước` : ago < 1440 ? `${Math.floor(ago / 60)} giờ trước` : `${Math.floor(ago / 1440)} ngày trước`;
                            return <span className="truncate block" title={`${latest.name} • ${latest.at.toLocaleString()}`}>{roleLabels[latest.role] || latest.role} • {timeStr}</span>;
                          })()}
                        </td>
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-wrap gap-1">
                            <Link href={`/admin/orders/${order.id}`} onClick={(e) => e.stopPropagation()}
                              className="p-1 text-slate-400 hover:text-blue-600 transition-colors" title={t("orders.openDetail", "Xem chi ti\u1ebft")}>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </Link>
                            {(() => {
                              const nextStatuses = (TRANSITIONS[order.status] || []).filter((s) => s !== "CANCELLED");
                              if (nextStatuses.length === 0) return null;
                              const isUpdating = updatingId === order.id;
                              return nextStatuses.map((s) => (
                                <button key={s} disabled={isUpdating} onClick={() => quickUpdateStatus(order.id, s)}
                                  className="px-2 py-1 text-[11px] font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50 whitespace-nowrap">
                                  {isUpdating ? "\u2026" : `\u2192 ${t(`status.${s}`, s)}`}
                                </button>
                              ));
                            })()}
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </Card>
      )}
    </div>
  );
}
