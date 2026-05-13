"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { useI18n } from "@/lib/i18n";

interface Order {
  id: string;
  orderCode: string;
  productName: string;
  quantity: number;
  status: string;
  customStatusNote: string | null;
  totalCostVND: string;
  createdAt: string;
  user: { fullName: string; email: string };
  orderNotes: Array<{ content: string; createdAt: string; user: { fullName: string; role: string } }>;
  statusLogs: Array<{ createdAt: string; toStatus: string; changer: { fullName: string; role: string } }>;
}

export default function AdminOrdersPage() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(() => parseInt(searchParams.get("page") || "1"));
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState(() => searchParams.get("status") || "");
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [filter, setFilter] = useState(() => searchParams.get("filter") || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams();
    if (page > 1) urlParams.set("page", String(page));
    if (status) urlParams.set("status", status);
    if (search) urlParams.set("search", search);
    if (filter) urlParams.set("filter", filter);
    const qs = urlParams.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [page, status, search, filter]);

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

    fetch(`/api/orders?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setOrders(d.orders || []);
        setTotalPages(d.totalPages || 1);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page, status, search, filter]);

  return (
    <div>
      <PageHeader title={t("orders.adminTitle")} subtitle={t("orders.adminSubtitle")} />

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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("orders.order")}</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("orders.customer")}</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("orderDetail.product")}</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.status")}</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.total")}</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.date")}</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Hoạt động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {orders.map((order) => {
                      const isCancelled = order.status === "CANCELLED";
                      const daysSinceCreated = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                      const isLongPending = order.status === "PENDING" && daysSinceCreated >= 3;
                      const hasNotes = order.orderNotes.length > 0;
                      const hasCustomNote = !!order.customStatusNote;

                      return (
                      <tr key={order.id} className={`transition-colors cursor-pointer ${isCancelled ? "bg-red-50/50 hover:bg-red-50" : "hover:bg-slate-50/50"}`} onClick={(e) => handleRowClick(e, order.id)} onAuxClick={(e) => { if (e.button === 1) handleRowClick(e, order.id); }}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <Link href={`/admin/orders/${order.id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700" onClick={(e) => e.stopPropagation()}>
                              {order.orderCode}
                            </Link>
                            {hasNotes && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" title="Có ghi chú" />
                            )}
                            {hasCustomNote && (
                              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Có ghi chú trạng thái" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900">{order.user.fullName}</div>
                          <div className="text-xs text-slate-400">{order.user.email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate">{order.productName}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <StatusBadge status={order.status} />
                            {isLongPending && (
                              <span className="text-amber-500 text-xs" title={`Chờ xử lý ${daysSinceCreated} ngày`}>⏳</span>
                            )}
                          </div>
                          {order.customStatusNote && (
                            <p className="text-xs text-amber-600 mt-1 truncate max-w-[150px]" title={order.customStatusNote}>{order.customStatusNote}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{parseFloat(order.totalCostVND).toLocaleString()} VND</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 max-w-[200px]">
                          {(() => {
                            const noteActivity = order.orderNotes[0] ? { at: new Date(order.orderNotes[0].createdAt), name: order.orderNotes[0].user.fullName, role: order.orderNotes[0].user.role } : null;
                            const logActivity = order.statusLogs[0] ? { at: new Date(order.statusLogs[0].createdAt), name: order.statusLogs[0].changer.fullName, role: order.statusLogs[0].changer.role } : null;
                            const latest = noteActivity && logActivity
                              ? (noteActivity.at > logActivity.at ? noteActivity : logActivity)
                              : noteActivity || logActivity;
                            if (!latest) return <span className="text-slate-300">—</span>;
                            const roleLabels: Record<string, string> = { ADMIN: "Admin", CUSTOMER: "KH", WAREHOUSE_CN: "Kho TQ", WAREHOUSE_VN: "Kho VN", ACCOUNTANT: "Kế toán" };
                            const ago = Math.floor((Date.now() - latest.at.getTime()) / 60000);
                            const timeStr = ago < 1 ? "vừa xong" : ago < 60 ? `${ago} phút trước` : ago < 1440 ? `${Math.floor(ago / 60)} giờ trước` : `${Math.floor(ago / 1440)} ngày trước`;
                            return <span className="truncate block" title={`${latest.name} • ${latest.at.toLocaleString()}`}>{roleLabels[latest.role] || latest.role} • {timeStr}</span>;
                          })()}
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
