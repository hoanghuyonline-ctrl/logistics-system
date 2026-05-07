"use client";

import { useEffect, useState } from "react";
import KPICard from "@/components/ui/KPICard";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";

export default function FinancePage() {
  const { toast } = useToast();
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
      toast(`Deposit of ${parseFloat(depositAmount).toLocaleString()} VND processed`, "success");
      setDepositUserId("");
      setDepositAmount("");
    } else {
      const data = await res.json();
      toast(data.error || "Failed to process deposit", "error");
    }
  }

  if (loading) return <LoadingSpinner text="Loading finance data..." />;

  return (
    <div>
      <PageHeader title="Finance" subtitle="Revenue, profit analysis, and deposit management" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <KPICard title="Total Revenue" value={`${(profit?.totalRevenue || 0).toLocaleString()} VND`} icon={<span>💰</span>} color="green" />
        <KPICard title="Total Profit" value={`${(profit?.totalProfit || 0).toLocaleString()} VND`} icon={<span>📈</span>} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card title="Process Deposit">
          <form onSubmit={processDeposit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">User ID</label>
              <input type="text" placeholder="Enter user UUID" value={depositUserId}
                onChange={(e) => setDepositUserId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (VND)</label>
              <input type="number" placeholder="Amount" value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
            </div>
            <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
              Process Deposit
            </button>
          </form>
        </Card>
      </div>

      <Card title="Profit by Order (Completed)" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Charged</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Cost</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Service Fee</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Shipping</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Profit</th>
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
                      <p className="text-sm text-slate-500">No completed orders yet</p>
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
