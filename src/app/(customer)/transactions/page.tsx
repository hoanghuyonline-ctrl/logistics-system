"use client";

import { useEffect, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/transactions?page=${page}&limit=20`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setTransactions(d.transactions || []);
        setTotalPages(d.totalPages || 1);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page]);

  if (loading) return <LoadingSpinner text={t("transactions.loading")} />;

  return (
    <div>
      <PageHeader title={t("transactions.title")} subtitle={t("transactions.subtitle")} />

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.date")}</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("transactions.type")}</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("transactions.order")}</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("transactions.description")}</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.amount")}</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("transactions.balance")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(tx.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      tx.type === "DEPOSIT" || tx.type === "MANUAL_ADD" ? "bg-emerald-50 text-emerald-700" :
                      tx.type === "REFUND" ? "bg-blue-50 text-blue-700" :
                      tx.type === "ORDER_PAYMENT" || tx.type === "MANUAL_DEDUCT" || tx.type === "SALES_PAYMENT" ? "bg-red-50 text-red-700" :
                      "bg-slate-100 text-slate-700"
                    }`}>{t(`transactions.tx.${tx.type}`, tx.type.replace(/_/g, " "))}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 font-medium">{tx.order?.orderCode || "—"}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{tx.description}</td>
                  <td className={`px-6 py-4 text-right text-sm font-semibold ${["ORDER_PAYMENT", "MANUAL_DEDUCT", "SALES_PAYMENT"].includes(tx.type) ? "text-red-600" : "text-emerald-600"}`}>
                    {["ORDER_PAYMENT", "MANUAL_DEDUCT", "SALES_PAYMENT"].includes(tx.type) ? "-" : "+"}{parseFloat(tx.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-slate-700">{parseFloat(tx.balanceAfter).toLocaleString()}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">📋</span>
                      <p className="text-sm text-slate-500">{t("transactions.empty")}</p>
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
