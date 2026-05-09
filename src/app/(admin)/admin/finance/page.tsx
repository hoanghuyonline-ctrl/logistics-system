"use client";

import { useEffect, useState } from "react";
import KPICard from "@/components/ui/KPICard";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n";

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
  const [depositUserId, setDepositUserId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/profit")
      .then((r) => r.json())
      .then((d) => { setProfit(d); setLoading(false); })
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
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("orders.order")}</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("finance.charged")}</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("finance.productCost")}</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("accountant.serviceFees")}</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("finance.shipping")}</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("finance.profit")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {profit?.orders.map((o) => (
                <tr key={o.orderCode} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">{o.orderCode}</td>
                  <td className="px-6 py-4 text-right text-sm text-slate-700">{o.totalCharged.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-sm text-slate-700">{o.productCost.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-sm text-slate-700">{o.serviceFee.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-sm text-slate-700">{o.shippingCosts.toLocaleString()}</td>
                  <td className={`px-6 py-4 text-right text-sm font-semibold ${o.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
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
