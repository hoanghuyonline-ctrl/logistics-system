"use client";

import { useEffect, useState } from "react";
import KPICard from "@/components/ui/KPICard";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n";

interface HealthData {
  customersWithDebt: number;
  negativeBalanceCount: number;
  todayRefunds: number;
  highValueOrdersToday: number;
  pendingPayments: number;
  totalDebt: number;
}

export default function FinancePage() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [profit, setProfit] = useState<{
    totalRevenue: number;
    totalProfit: number;
    orders: Array<{
      orderCode: string;
      totalCharged: number;
      productCost: number;
      serviceFee: number;
      shippingCosts: number;
      profit: number;
      date: string;
    }>;
  } | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [depositUserId, setDepositUserId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics/profit").then((r) => r.json()),
      fetch("/api/accountant/dashboard").then((r) => r.json()),
    ])
      .then(([profitData, dashData]) => {
        setProfit(profitData);
        setHealth({
          customersWithDebt: dashData.customersWithDebt ?? 0,
          negativeBalanceCount: dashData.negativeBalanceCount ?? 0,
          todayRefunds: dashData.todayRefunds ?? 0,
          highValueOrdersToday: dashData.highValueOrdersToday ?? 0,
          pendingPayments: dashData.pendingPayments ?? 0,
          totalDebt: dashData.totalDebt ?? 0,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function processDeposit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/wallet/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: depositUserId, amount: parseFloat(depositAmount), description: "Admin deposit" }),
    });
    if (res.ok) {
      toast(`${t("finance.depositProcessed")}: ${parseFloat(depositAmount).toLocaleString()} VND`, "success");
      setDepositUserId("");
      setDepositAmount("");
    } else {
      const data = await res.json();
      toast(data.error || t("finance.depositFailed"), "error");
    }
  }

  if (loading) return <LoadingSpinner text={t("finance.loading")} />;

  return (
    <div>
      <PageHeader title={t("finance.title")} subtitle={t("finance.subtitle")} />

      {/* Finance Health Indicators */}
      {health && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <div className={`flex items-center gap-2 p-3 rounded-xl border ${health.customersWithDebt > 0 ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}>
            <span className="text-lg">💳</span>
            <div className="min-w-0">
              <div className="text-xs text-slate-500 truncate">{t("finance.customersWithDebt")}</div>
              <div className="text-base font-bold text-slate-900">{health.customersWithDebt}</div>
            </div>
            {health.customersWithDebt > 0 && <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded whitespace-nowrap">{t("finance.needsAction")}</span>}
          </div>
          <div className={`flex items-center gap-2 p-3 rounded-xl border ${health.pendingPayments > 0 ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
            <span className="text-lg">⏳</span>
            <div className="min-w-0">
              <div className="text-xs text-slate-500 truncate">{t("finance.pendingDeposits")}</div>
              <div className="text-base font-bold text-slate-900">{health.pendingPayments}</div>
            </div>
            {health.pendingPayments > 0 && <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded whitespace-nowrap">{t("finance.awaitingConfirm")}</span>}
          </div>
          <div className={`flex items-center gap-2 p-3 rounded-xl border ${health.todayRefunds > 0 ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
            <span className="text-lg">↩️</span>
            <div className="min-w-0">
              <div className="text-xs text-slate-500 truncate">{t("finance.todayRefunds")}</div>
              <div className="text-base font-bold text-slate-900">{health.todayRefunds}</div>
            </div>
          </div>
          <div className={`flex items-center gap-2 p-3 rounded-xl border ${health.highValueOrdersToday > 0 ? "border-purple-200 bg-purple-50" : "border-slate-200 bg-white"}`}>
            <span className="text-lg">💎</span>
            <div className="min-w-0">
              <div className="text-xs text-slate-500 truncate">{t("finance.highValueToday")}</div>
              <div className="text-base font-bold text-slate-900">{health.highValueOrdersToday}</div>
            </div>
            {health.highValueOrdersToday > 0 && <span className="text-[10px] font-semibold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded whitespace-nowrap">{t("finance.highValue")}</span>}
          </div>
          <div className={`flex items-center gap-2 p-3 rounded-xl border ${health.negativeBalanceCount > 0 ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}>
            <span className="text-lg">⚠️</span>
            <div className="min-w-0">
              <div className="text-xs text-slate-500 truncate">{t("finance.negativeBalances")}</div>
              <div className="text-base font-bold text-slate-900">{health.negativeBalanceCount}</div>
            </div>
            {health.negativeBalanceCount > 0 && <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded whitespace-nowrap">{t("finance.needsAction")}</span>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <KPICard title={t("admin.totalRevenue")} value={`${(profit?.totalRevenue || 0).toLocaleString()} VND`} icon={<span>💰</span>} color="green" />
        <KPICard title={t("admin.totalProfit")} value={`${(profit?.totalProfit || 0).toLocaleString()} VND`} icon={<span>📈</span>} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card title={t("finance.processDeposit")}>
          <form onSubmit={processDeposit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("finance.userId")}</label>
              <input type="text" placeholder={t("finance.userIdPlaceholder")} value={depositUserId}
                onChange={(e) => setDepositUserId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("finance.amountVnd")}</label>
              <input type="number" placeholder={t("common.amount")} value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
            </div>
            <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
              {t("finance.processDeposit")}
            </button>
          </form>
        </Card>
      </div>

      <Card title={t("finance.profitByOrder")} noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("orders.order")}</th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("finance.charged")}</th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">{t("finance.productCost")}</th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">{t("accountant.serviceFees")}</th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">{t("finance.shipping")}</th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("finance.profit")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {profit?.orders.map((o) => (
                <tr key={o.orderCode} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3 sm:px-6 py-3 text-sm font-semibold text-slate-900">{o.orderCode}</td>
                  <td className="px-3 sm:px-6 py-3 text-right text-sm text-slate-700 whitespace-nowrap">{o.totalCharged.toLocaleString()}</td>
                  <td className="px-3 sm:px-6 py-3 text-right text-sm text-slate-700 hidden sm:table-cell">{o.productCost.toLocaleString()}</td>
                  <td className="px-3 sm:px-6 py-3 text-right text-sm text-slate-700 hidden sm:table-cell">{o.serviceFee.toLocaleString()}</td>
                  <td className="px-3 sm:px-6 py-3 text-right text-sm text-slate-700 hidden sm:table-cell">{o.shippingCosts.toLocaleString()}</td>
                  <td className={`px-3 sm:px-6 py-3 text-right text-sm font-semibold whitespace-nowrap ${o.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {o.profit.toLocaleString()}
                  </td>
                </tr>
              ))}
              {(!profit?.orders || profit.orders.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">📊</span>
                      <p className="text-sm text-slate-500">{t("finance.noCompletedOrders")}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
