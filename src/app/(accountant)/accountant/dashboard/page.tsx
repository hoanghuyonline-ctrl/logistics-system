"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import KPICard from "@/components/ui/KPICard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

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
}

const TX_TYPE_COLORS: Record<string, string> = {
  DEPOSIT: "bg-emerald-100 text-emerald-700",
  ORDER_PAYMENT: "bg-blue-100 text-blue-700",
  REFUND: "bg-amber-100 text-amber-700",
  ADJUSTMENT: "bg-violet-100 text-violet-700",
};

export default function AccountantDashboard() {
  const { t } = useI18n();
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AccountantDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus === "loading") return;
    const role = (session?.user as Record<string, unknown>)?.role as string;
    if (!session || (role !== "ACCOUNTANT" && role !== "ADMIN")) {
      router.replace("/login");
      return;
    }
    fetch("/api/accountant/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [session, authStatus, router]);

  if (authStatus === "loading" || loading || !data) {
    return <LoadingSpinner text={t("common.loading")} />;
  }

  return (
    <div>
      <PageHeader
        title={t("accountant.dashboard")}
        subtitle={t("accountant.dashboardSubtitle")}
      />

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
          subtitle={t("accountant.outstandingDebt")}
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("accountant.type")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("accountant.user")}</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.amount")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.date")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${TX_TYPE_COLORS[tx.type] || "bg-slate-100 text-slate-700"}`}>
                        {t(`accountant.tx.${tx.type}`)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="text-sm font-medium text-slate-900">{tx.userName}</div>
                      {tx.orderCode && (
                        <div className="text-xs text-slate-400">{tx.orderCode}</div>
                      )}
                    </td>
                    <td className={`px-6 py-3.5 text-right text-sm font-semibold ${tx.type === "REFUND" ? "text-red-600" : "text-slate-900"}`}>
                      {tx.type === "REFUND" ? "-" : ""}{tx.amount.toLocaleString()} VND
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-500">
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
