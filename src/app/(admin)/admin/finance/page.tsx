"use client";

import { useEffect, useState } from "react";
import KPICard from "@/components/ui/KPICard";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function FinancePage() {
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
  const [depositMsg, setDepositMsg] = useState("");
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
    const data = await res.json();
    setDepositMsg(res.ok ? `Deposit of ${parseFloat(depositAmount).toLocaleString()} VND processed` : data.error);
    if (res.ok) { setDepositUserId(""); setDepositAmount(""); }
    setTimeout(() => setDepositMsg(""), 5000);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Finance</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <KPICard title="Total Revenue" value={`${(profit?.totalRevenue || 0).toLocaleString()} VND`} color="green" />
        <KPICard title="Total Profit" value={`${(profit?.totalProfit || 0).toLocaleString()} VND`} color="purple" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card title="Process Deposit">
          {depositMsg && <div className={`p-2 rounded mb-3 text-sm ${depositMsg.includes("processed") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{depositMsg}</div>}
          <form onSubmit={processDeposit} className="space-y-3">
            <input type="text" placeholder="User ID" value={depositUserId} onChange={(e) => setDepositUserId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" required />
            <input type="number" placeholder="Amount (VND)" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" required />
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Process Deposit</button>
          </form>
        </Card>
      </div>

      <Card title="Profit by Order (Completed)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Order</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Charged</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Product Cost</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Service Fee</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Shipping</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {profit?.orders.map((o) => (
                <tr key={o.orderCode} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{o.orderCode}</td>
                  <td className="px-4 py-3 text-right">{o.totalCharged.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{o.productCost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{o.serviceFee.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{o.shippingCosts.toLocaleString()}</td>
                  <td className={`px-4 py-3 text-right font-medium ${o.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {o.profit.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
