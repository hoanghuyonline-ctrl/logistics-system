"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useAutoRefresh } from "@/lib/useAutoRefresh";
import KPICard from "@/components/ui/KPICard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import MobileDataCard from "@/components/ui/MobileDataCard";

interface TransactionItem {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
  userName: string;
  userEmail: string;
  orderCode: string | null;
}

interface AccountantDashboardData {
  totalRevenue: number;
  estimatedProfit: number;
  totalServiceFees: number;
  completedOrderCount: number;
  pendingPayments: number;
  totalDebt: number;
  totalDeposits: number;
  totalDepositCount: number;
  monthDeposits: number;
  monthDepositCount: number;
  todayTransactions: number;
  recentTransactions: TransactionItem[];
  ordersByStatus: Array<{ status: string; count: number }>;
  customersWithDebt: number;
  negativeBalanceCount: number;
  todayRefunds: number;
  highValueOrdersToday: number;
}

const TX_TYPE_COLORS: Record<string, string> = {
  DEPOSIT: "bg-emerald-100 text-emerald-700",
  ORDER_PAYMENT: "bg-blue-100 text-blue-700",
  REFUND: "bg-amber-100 text-amber-700",
  ADJUSTMENT: "bg-violet-100 text-violet-700",
};

interface HealthIndicator {
  label: string;
  value: number;
  tag: string;
  tagClass: string;
  icon: string;
}

function HealthCard({ indicator }: { indicator: HealthIndicator }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
      <span className="text-xl shrink-0">{indicator.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-600 truncate">{indicator.label}</div>
        <div className="text-lg font-bold text-slate-900">{indicator.value}</div>
      </div>
      {indicator.value > 0 && (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap ${indicator.tagClass}`}>
          {indicator.tag}
        </span>
      )}
    </div>
  );
}

export default function AccountantDashboard() {
  const { t } = useI18n();
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AccountantDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refreshFetcher = useCallback(async () => {
    const res = await fetch("/api/accountant/dashboard");
    if (!res.ok) throw new Error("fetch failed");
    return res.json() as Promise<AccountantDashboardData>;
  }, []);

  const handleRefreshData = useCallback((d: AccountantDashboardData) => {
    setData(d);
  }, []);

  const { lastRefreshed } = useAutoRefresh(refreshFetcher, handleRefreshData, 30000);

  useEffect(() => {
    if (authStatus === "loading") return;
    const role = (session?.user as Record<string, unknown>)?.role as string;
    if (!session || (role !== "ACCOUNTANT" && role !== "ADMIN")) {
      router.replace("/login");
      return;
    }
    fetch("/api/accountant/dashboard")
      .then((r) => { if (!r.ok) throw new Error("API error"); return r.json(); })
      .then((d) => { setData(d); setLoading(false); })
      .catch((err) => { console.error("[accountant/dashboard] load failed:", err); setError(true); setLoading(false); });
  }, [session, authStatus, router]);

  if (authStatus === "loading" || loading) {
    return <LoadingSpinner text={t("common.loading")} />;
  }
  if (error || !data) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <span className="text-4xl">⚠️</span>
      <p className="text-sm text-slate-600">Không thể tải dữ liệu. Vui lòng thử lại.</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Tải lại</button>
    </div>
  );

  const healthIndicators: HealthIndicator[] = [
    {
      label: t("finance.customersWithDebt"),
      value: data.customersWithDebt,
      tag: t("finance.needsAction"),
      tagClass: data.customersWithDebt > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700",
      icon: "💳",
    },
    {
      label: t("finance.pendingDeposits"),
      value: data.pendingPayments,
      tag: t("finance.awaitingConfirm"),
      tagClass: data.pendingPayments > 0 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700",
      icon: "⏳",
    },
    {
      label: t("finance.todayRefunds"),
      value: data.todayRefunds,
      tag: t("finance.needsAction"),
      tagClass: data.todayRefunds > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500",
      icon: "↩️",
    },
    {
      label: t("finance.highValueToday"),
      value: data.highValueOrdersToday,
      tag: t("finance.highValue"),
      tagClass: data.highValueOrdersToday > 0 ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-500",
      icon: "💎",
    },
    {
      label: t("finance.negativeBalances"),
      value: data.negativeBalanceCount,
      tag: t("finance.needsAction"),
      tagClass: data.negativeBalanceCount > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700",
      icon: "⚠️",
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("accountant.dashboard")}
        subtitle={t("accountant.dashboardSubtitle")}
      />

      {/* Auto-refresh indicator */}
      <div className="flex items-center gap-1.5 mb-4 text-[11px] text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span>{"T\u1ef1 \u0111\u1ed9ng c\u1eadp nh\u1eadt"}</span>
        {lastRefreshed && (
          <span>{"\u2014"} {lastRefreshed.toLocaleTimeString("vi-VN")}</span>
        )}
      </div>

      {/* Finance Health Indicators */}
      <Card title={t("finance.healthOverview")} className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {healthIndicators.map((ind) => (
            <HealthCard key={ind.label} indicator={ind} />
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <KPICard
          title={t("accountant.totalRevenue")}
          value={`${data.totalRevenue.toLocaleString()} VND`}
          subtitle={`${data.completedOrderCount} ${t("accountant.completedOrders")}`}
          icon={<span>💰</span>}
          color="green"
        />
        <KPICard
          title={t("accountant.estimatedProfit")}
          value={`${data.estimatedProfit.toLocaleString()} VND`}
          subtitle={`${t("accountant.serviceFees")}: ${data.totalServiceFees.toLocaleString()}`}
          icon={<span>📈</span>}
          color="purple"
        />
        <KPICard
          title={t("accountant.pendingPayments")}
          value={data.pendingPayments}
          subtitle={t("accountant.awaitingPayment")}
          icon={<span>⏳</span>}
          color="yellow"
        />
        <KPICard
          title={t("accountant.totalDebt")}
          value={`${data.totalDebt.toLocaleString()} VND`}
          subtitle={data.customersWithDebt > 0 ? `${data.customersWithDebt} ${t("finance.customersOwing")}` : t("accountant.outstandingDebt")}
          icon={<span>📋</span>}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <KPICard
          title={t("accountant.totalDeposits")}
          value={`${data.totalDeposits.toLocaleString()} VND`}
          subtitle={`${data.totalDepositCount} ${t("accountant.transactions")}`}
          icon={<span>🏦</span>}
          color="blue"
        />
        <KPICard
          title={t("accountant.monthDeposits")}
          value={`${data.monthDeposits.toLocaleString()} VND`}
          subtitle={`${data.monthDepositCount} ${t("accountant.thisMonth")}`}
          icon={<span>📅</span>}
          color="cyan"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={t("accountant.recentTransactions")} noPadding>
          {/* Mobile card view */}
          <div className="md:hidden flex flex-col gap-2 p-2">
            {data.recentTransactions.map((tx) => (
              <MobileDataCard
                key={tx.id}
                fields={[
                  { label: t("accountant.type"), value: (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold ${TX_TYPE_COLORS[tx.type] || "bg-slate-100 text-slate-700"}`}>
                      {t(`accountant.tx.${tx.type}`)}
                    </span>
                  )},
                  { label: t("common.amount"), value: (
                    <span className={`font-semibold ${tx.type === "REFUND" ? "text-red-600" : "text-slate-900"}`}>
                      {tx.type === "REFUND" ? "-" : ""}{tx.amount.toLocaleString()} \u20ab
                    </span>
                  )},
                  { label: t("accountant.user"), value: tx.userName },
                  { label: t("common.date"), value: new Date(tx.createdAt).toLocaleDateString() },
                ]}
              />
            ))}
            {data.recentTransactions.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8">
                <span className="text-3xl">\ud83d\udccb</span>
                <p className="text-sm text-slate-500">{t("accountant.noTransactions")}</p>
              </div>
            )}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("accountant.type")}</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("accountant.user")}</th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.amount")}</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.date")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 sm:px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold ${TX_TYPE_COLORS[tx.type] || "bg-slate-100 text-slate-700"}`}>
                        {t(`accountant.tx.${tx.type}`)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3">
                      <div className="text-sm font-medium text-slate-900">{tx.userName}</div>
                      {tx.orderCode && (
                        <div className="text-xs text-slate-400">{tx.orderCode}</div>
                      )}
                    </td>
                    <td className={`px-3 sm:px-6 py-3 text-right text-sm font-semibold whitespace-nowrap ${tx.type === "REFUND" ? "text-red-600" : "text-slate-900"}`}>
                      {tx.type === "REFUND" ? "-" : ""}{tx.amount.toLocaleString()} ₫
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-sm text-slate-500 hidden sm:table-cell">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {data.recentTransactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-3xl">📋</span>
                        <p className="text-sm text-slate-500">{t("accountant.noTransactions")}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title={t("accountant.orderStatusSummary")}>
          <div className="space-y-4">
            {data.ordersByStatus.map((s) => {
              const total = data.ordersByStatus.reduce((sum, x) => sum + x.count, 0);
              const pct = total > 0 ? (s.count / total) * 100 : 0;
              return (
                <div key={s.status}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-600">{t(`status.${s.status}`)}</span>
                    <span className="text-sm font-semibold text-slate-900">{s.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data.ordersByStatus.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8">
                <span className="text-3xl">📊</span>
                <p className="text-sm text-slate-500">{t("accountant.noOrders")}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
