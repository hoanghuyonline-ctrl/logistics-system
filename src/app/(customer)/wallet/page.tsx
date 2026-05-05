"use client";

import { useEffect, useState } from "react";
import KPICard from "@/components/ui/KPICard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Card from "@/components/ui/Card";

interface Wallet {
  balance: string;
  debt: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  description: string;
  createdAt: string;
  order: { orderCode: string } | null;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/wallet").then((r) => r.json()),
      fetch("/api/transactions?limit=10").then((r) => r.json()),
    ]).then(([w, t]) => {
      setWallet(w);
      setTransactions(t.transactions || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Wallet</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <KPICard
          title="Available Balance"
          value={`${parseFloat(wallet?.balance || "0").toLocaleString()} VND`}
          color="green"
        />
        <KPICard
          title="Outstanding Debt"
          value={`${parseFloat(wallet?.debt || "0").toLocaleString()} VND`}
          color="red"
        />
      </div>

      <Card title="Recent Transactions">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Description</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Amount</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-4 py-3">{new Date(tx.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      tx.type === "DEPOSIT" ? "bg-green-100 text-green-800" :
                      tx.type === "REFUND" ? "bg-blue-100 text-blue-800" :
                      tx.type === "ORDER_PAYMENT" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">{tx.description}</td>
                  <td className={`px-4 py-3 text-right font-medium ${parseFloat(tx.amount) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {parseFloat(tx.amount) >= 0 ? "+" : ""}{parseFloat(tx.amount).toLocaleString()} VND
                  </td>
                  <td className="px-4 py-3 text-right">{parseFloat(tx.balanceAfter).toLocaleString()} VND</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No transactions yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          To deposit funds, please contact the admin or transfer to the company bank account.
          Your deposit will be confirmed by our team.
        </p>
      </div>
    </div>
  );
}
