"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Card from "@/components/ui/Card";
import MobileDataCard from "@/components/ui/MobileDataCard";
import { useI18n } from "@/lib/i18n";

interface Order {
  id: string;
  orderCode: string;
  productName: string;
  quantity: number;
  status: string;
  totalCostVND: string;
  confirmedTotalCost: string | null;
  createdAt: string;
  updatedAt: string;
  packageId: string | null;
  priority: string;
  statusLogs: Array<{ createdAt: string; toStatus: string }>;
}

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

const STATUS_STEP: Record<string, number> = {
  PENDING: 1,
  PURCHASED: 2,
  SELLER_SHIPPED: 3,
  ARRIVED_CHINA_WH: 4,
  PACKING: 5,
  SHIPPING_TO_VIETNAM: 6,
  ARRIVED_VIETNAM_WH: 7,
  OUT_FOR_DELIVERY: 8,
  COMPLETED: 8,
  CANCELLED: 0,
};

const HIGHLIGHT_STATUSES: Record<string, string> = {
  ARRIVED_VIETNAM_WH: "border-l-4 border-l-teal-400",
  COMPLETED: "border-l-4 border-l-green-400",
  CANCELLED: "border-l-4 border-l-red-400",
};

function formatTimeAgo(dateStr: string, now: number, t: (key: string) => string): string {
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t("orders.justNow");
  if (minutes < 60) return `${minutes} ${t("orders.minutesAgo")}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${t("orders.hoursAgo")}`;
  const days = Math.floor(hours / 24);
  return `${days} ${t("orders.daysAgo")}`;
}

export default function OrdersPage() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: "10" });
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
      <PageHeader
        title={t("orders.myTitle")}
        subtitle={t("orders.mySubtitle")}
        action={
          <Link href="/orders/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            + {t("orders.newOrder")}
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder={t("orders.searchPlaceholder")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
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

      {loading ? (
        <LoadingSpinner text={t("orders.loading")} />
      ) : (
        <Card noPadding>
          {orders.length === 0 ? (
            <EmptyState icon="📦" title={t("orders.empty")} description={t("orders.emptyAdjust")} />
          ) : (
            <>
              {/* Mobile card view */}
              <div className="md:hidden flex flex-col gap-2 p-2">
                {orders.map((order) => {
                  const step = STATUS_STEP[order.status] ?? 0;
                  const highlightClass = HIGHLIGHT_STATUSES[order.status] ?? "";
                  const price = order.confirmedTotalCost
                    ? parseFloat(order.confirmedTotalCost).toLocaleString() + " ₫"
                    : "~" + parseFloat(order.totalCostVND).toLocaleString() + " ₫";
                  return (
                    <Link key={order.id} href={`/orders/${order.id}`}>
                      <MobileDataCard
                        highlight={highlightClass}
                        header={
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT_COLORS[order.status] || "bg-slate-300"}`} />
                              <span className="text-sm font-semibold text-blue-600">{order.orderCode}</span>
                            </div>
                            <StatusBadge status={order.status} />
                          </div>
                        }
                        fields={[
                          { label: t("orderDetail.product"), value: <span className="truncate block max-w-[200px]">{order.productName}</span>, fullWidth: true },
                          { label: t("orders.totalCost"), value: <span className="font-semibold">{price}</span> },
                          { label: t("orders.progress"), value: order.status !== "CANCELLED" ? `${step}/8` : t("orders.orderCancelled") },
                          { label: t("common.date"), value: new Date(order.createdAt).toLocaleDateString() },
                        ]}
                      />
                    </Link>
                  );
                })}
              </div>

              {/* Desktop table view */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("orders.orderCode")}</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("orderDetail.product")}</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.status")}</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("orders.totalCost")}</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("orders.progress")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {orders.map((order) => {
                      const step = STATUS_STEP[order.status] ?? 0;
                      const lastLog = order.statusLogs?.[0];
                      const highlightClass = HIGHLIGHT_STATUSES[order.status] ?? "";
                      const daysSinceCreated = Math.floor((now - new Date(order.createdAt).getTime()) / 86400000);
                      const isLongPending = order.status === "PENDING" && daysSinceCreated > 3;

                      return (
                        <tr key={order.id} className={`hover:bg-slate-50/50 transition-colors ${highlightClass}`}>
                          <td className="px-3 sm:px-6 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT_COLORS[order.status] || "bg-slate-300"}`} />
                              <Link href={`/orders/${order.id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap">
                                {order.orderCode}
                              </Link>
                            </div>
                            {order.packageId && (
                              <span className="inline-flex items-center text-[10px] text-purple-600 mt-0.5">📦 {t("orders.hasPackage")}</span>
                            )}
                          </td>

                          <td className="px-3 sm:px-6 py-3 text-sm text-slate-700 max-w-xs truncate">
                            <div className="truncate">{order.productName}</div>
                            <div className="text-xs text-slate-400 mt-0.5">×{order.quantity}</div>
                          </td>

                          {/* Status */}
                          <td className="px-3 sm:px-6 py-3">
                            <StatusBadge status={order.status} />
                            {isLongPending && (
                              <span className="block text-[10px] text-amber-600 font-medium mt-1">⚠ {t("orders.longPending")}</span>
                            )}
                            {order.status === "ARRIVED_VIETNAM_WH" && (
                              <span className="block text-[10px] text-teal-600 font-medium mt-1">🏠 {t("orders.arrivedVN")}</span>
                            )}
                            {order.status === "COMPLETED" && (
                              <span className="block text-[10px] text-green-600 font-medium mt-1">✓ {t("orders.delivered")}</span>
                            )}
                          </td>

                          {/* Cost + date */}
                          <td className="px-3 sm:px-6 py-3">
                            <div className="text-sm font-medium text-slate-900 whitespace-nowrap">
                              {order.confirmedTotalCost
                                ? <>{parseFloat(order.confirmedTotalCost).toLocaleString()} ₫</>
                                : <><span className="text-slate-400">{parseFloat(order.totalCostVND).toLocaleString()} ₫</span><span className="text-[10px] text-amber-500 ml-1">~</span></>}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</div>
                          </td>

                          <td className="px-3 sm:px-6 py-3">
                            {order.status !== "CANCELLED" ? (
                              <div>
                                <div className="flex items-center gap-1 mb-1">
                                  {Array.from({ length: 8 }).map((_, i) => (
                                    <div
                                      key={i}
                                      className={`h-1.5 flex-1 rounded-full ${i < step ? STATUS_DOT_COLORS[order.status] || "bg-blue-400" : "bg-slate-200"}`}
                                    />
                                  ))}
                                </div>
                                <span className="text-[11px] text-slate-500">{t(`orders.step`)} {step}/8</span>
                                {lastLog && (
                                  <span className="block text-[10px] text-slate-400 mt-0.5">
                                    {formatTimeAgo(lastLog.createdAt, now, t)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-red-500">{t("orders.orderCancelled")}</span>
                            )}
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
