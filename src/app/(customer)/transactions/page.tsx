"use client";

import { useEffect, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/transactions?page=${page}&limit=20`)
      .then((r) => r.json())
      .then((d) => {
        setTransactions(d.transactions || []);
        setTotalPages(d.totalPages || 1);
        setLoading(false);
      });
  }, [page]);

  if (loading) return <LoadingSpinner text="Loading transactions..." />;

  return (
    <div>
      <PageHeader title="Transaction History" subtitle="Complete record of all your financial transactions" />

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(tx.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      tx.type === "DEPOSIT" ? "bg-emerald-50 text-emerald-700" :
                      tx.type === "REFUND" ? "bg-blue-50 text-blue-700" :
                      tx.type === "ORDER_PAYMENT" ? "bg-red-50 text-red-700" :
                      "bg-slate-100 text-slate-700"
                    }`}>{tx.type.replace(/_/g, " ")}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 font-medium">{tx.order?.orderCode || "—"}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{tx.description}</td>
                  <td className={`px-6 py-4 text-right text-sm font-semibold ${parseFloat(tx.amount) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {parseFloat(tx.amount) >= 0 ? "+" : ""}{parseFloat(tx.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-slate-700">{parseFloat(tx.balanceAfter).toLocaleString()}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">📋</span>
                      <p className="text-sm text-slate-500">No transactions yet</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>
    </div>
  );
}
