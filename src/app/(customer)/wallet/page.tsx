"use client";

import { useEffect, useState } from "react";
import KPICard from "@/components/ui/KPICard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
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

  if (loading) return <LoadingSpinner text={t("wallet.loading")} />;

  return (
    <div>
      <PageHeader title={t("wallet.title")} subtitle={t("wallet.subtitle")} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <KPICard
          title={t("wallet.availableBalance")}
          value={`${parseFloat(wallet?.balance || "0").toLocaleString()} VND`}
          icon={<span>💰</span>}
          color="green"
        />
        <KPICard
          title={t("wallet.outstandingDebt")}
          value={`${parseFloat(wallet?.debt || "0").toLocaleString()} VND`}
          icon={<span>📊</span>}
          color="red"
        />
      </div>

      <Card title={t("wallet.recentTransactions")} noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.date")}</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("transactions.type")}</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("transactions.description")}</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.amount")}</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("transactions.balanceAfter")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      tx.type === "DEPOSIT" ? "bg-emerald-50 text-emerald-700" :
                      tx.type === "REFUND" ? "bg-blue-50 text-blue-700" :
                      tx.type === "ORDER_PAYMENT" ? "bg-red-50 text-red-700" :
                      "bg-slate-100 text-slate-700"
                    }`}>
                      {t(`transactions.tx.${tx.type}`, tx.type.replace(/_/g, " "))}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{tx.description}</td>
                  <td className={`px-6 py-4 text-right text-sm font-semibold ${parseFloat(tx.amount) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {parseFloat(tx.amount) >= 0 ? "+" : ""}{parseFloat(tx.amount).toLocaleString()} VND
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-slate-700">{parseFloat(tx.balanceAfter).toLocaleString()} VND</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">💳</span>
                      <p className="text-sm text-slate-500">{t("transactions.empty")}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-lg">💡</span>
          <div>
            <p className="text-sm font-medium text-amber-900">{t("wallet.depositHelpTitle")}</p>
            <p className="text-sm text-amber-700 mt-1">
              {t("wallet.depositHelpText")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
