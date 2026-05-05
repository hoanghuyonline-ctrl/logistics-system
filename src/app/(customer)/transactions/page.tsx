"use client";

import { useEffect, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

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

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Transaction History</h1>
      <div className="bg-white rounded-lg shadow border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Date</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Type</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Order</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Description</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">Amount</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{new Date(tx.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      tx.type === "DEPOSIT" ? "bg-green-100 text-green-800" :
                      tx.type === "REFUND" ? "bg-blue-100 text-blue-800" :
                      tx.type === "ORDER_PAYMENT" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>{tx.type}</span>
                  </td>
                  <td className="px-6 py-4">{tx.order?.orderCode || "-"}</td>
                  <td className="px-6 py-4">{tx.description}</td>
                  <td className={`px-6 py-4 text-right font-medium ${parseFloat(tx.amount) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {parseFloat(tx.amount) >= 0 ? "+" : ""}{parseFloat(tx.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">{parseFloat(tx.balanceAfter).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
