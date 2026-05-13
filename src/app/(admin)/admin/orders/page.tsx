"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
}

export default function AdminOrdersPage() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (status) params.set("status", status);
    if (search) params.set("search", search);

    fetch(`/api/orders?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setOrders(d.orders || []);
        setTotalPages(d.totalPages || 1);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page, status, search]);

  return (
    <div>
      <PageHeader title={t("orders.adminTitle")} subtitle={t("orders.adminSubtitle")} />

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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <Link href={`/admin/orders/${order.id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                            {order.orderCode}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900">{order.user.fullName}</div>
                          <div className="text-xs text-slate-400">{order.user.email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate">{order.productName}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={order.status} />
                          {order.customStatusNote && (
                            <p className="text-xs text-amber-600 mt-1 truncate max-w-[150px]" title={order.customStatusNote}>{order.customStatusNote}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{parseFloat(order.totalCostVND).toLocaleString()} VND</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
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
