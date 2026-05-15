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

interface WebhookLog {
  id: string;
  provider: string;
  transactionId: string;
  status: string;
  transferReference: string | null;
  amount: string | null;
  accountNumber: string | null;
  errorReason: string | null;
  createdAt: string;
}

interface TopUpRequest {
  id: string;
  customerId: string;
  amount: string;
  transferReference: string;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
  status: string;
  confirmedAt: string | null;
  createdAt: string;
  customer: { id: string; fullName: string; email: string; phone: string | null };
  confirmer: { fullName: string } | null;
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
  const [depositEmail, setDepositEmail] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [matchedCustomer, setMatchedCustomer] = useState<{ fullName: string; email: string } | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [loading, setLoading] = useState(true);
  const [topUpRequests, setTopUpRequests] = useState<TopUpRequest[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [topUpFilter, setTopUpFilter] = useState<"PENDING" | "ALL">("PENDING");
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics/profit").then((r) => r.json()),
      fetch("/api/accountant/dashboard").then((r) => r.json()),
      fetch("/api/admin/topup-requests").then((r) => r.json()),
      fetch("/api/admin/webhook-logs").then((r) => r.json()).catch(() => []),
    ])
      .then(([profitData, dashData, topUpData, webhookData]) => {
        setProfit(profitData);
        setHealth({
          customersWithDebt: dashData.customersWithDebt ?? 0,
          negativeBalanceCount: dashData.negativeBalanceCount ?? 0,
          todayRefunds: dashData.todayRefunds ?? 0,
          highValueOrdersToday: dashData.highValueOrdersToday ?? 0,
          pendingPayments: dashData.pendingPayments ?? 0,
          totalDebt: dashData.totalDebt ?? 0,
        });
        setTopUpRequests(Array.isArray(topUpData) ? topUpData : []);
        setWebhookLogs(Array.isArray(webhookData) ? webhookData : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleTopUpAction(id: string, action: "confirm" | "cancel") {
    setConfirmingId(id);
    try {
      const res = await fetch(`/api/admin/topup-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        setTopUpRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: data.status, confirmedAt: new Date().toISOString() } : r))
        );
        toast(action === "confirm" ? t("topup.confirmed") : t("topup.cancelled"), "success");
      } else {
        const err = await res.json();
        toast(err.error || t("topup.actionFailed"), "error");
      }
    } catch {
      toast(t("topup.actionFailed"), "error");
    } finally {
      setConfirmingId(null);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast(t("orders.copied"), "success");
  }

  async function lookupCustomer(email: string) {
    setMatchedCustomer(null);
    setLookupError("");
    if (!email.trim()) return;
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(email.trim())}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        const users = Array.isArray(data) ? data : data.users || [];
        const match = users.find((u: { email: string }) => u.email.toLowerCase() === email.trim().toLowerCase());
        if (match) {
          setMatchedCustomer({ fullName: match.fullName, email: match.email });
        } else {
          setLookupError(t("finance.customerNotFound"));
        }
      }
    } catch { /* ignore */ }
  }

  async function processDeposit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/wallet/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: depositEmail.trim(), amount: parseFloat(depositAmount), description: "Admin deposit" }),
    });
    if (res.ok) {
      toast(`${t("finance.depositProcessed")}: ${parseFloat(depositAmount).toLocaleString()} VND`, "success");
      setDepositEmail("");
      setDepositAmount("");
      setMatchedCustomer(null);
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

      {/* Top-up requests section */}
      <Card title={t("topup.pendingTitle")} className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setTopUpFilter("PENDING")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              topUpFilter === "PENDING" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t("topup.filterPending")}
          </button>
          <button
            onClick={() => setTopUpFilter("ALL")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              topUpFilter === "ALL" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t("topup.filterAll")}
          </button>
          <span className="text-xs text-slate-500">
            {topUpRequests.filter((r) => r.status === "PENDING").length} {t("topup.pendingCount")}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">{t("topup.customer")}</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">{t("common.amount")}</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">{t("topup.transferRef")}</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">{t("topup.time")}</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase">{t("topup.status")}</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase">{t("topup.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {topUpRequests
                .filter((r) => topUpFilter === "ALL" || r.status === "PENDING")
                .map((r) => (
                  <tr key={r.id} className={`hover:bg-slate-50/50 transition-colors ${r.status === "PENDING" ? "bg-amber-50/30" : ""}`}>
                    <td className="px-3 py-3">
                      <div className="text-sm font-medium text-slate-900">{r.customer.fullName}</div>
                      <div className="text-xs text-slate-500">{r.customer.email}</div>
                      {r.customer.phone && <div className="text-xs text-slate-400">{r.customer.phone}</div>}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-emerald-700 whitespace-nowrap">
                      {parseFloat(r.amount).toLocaleString("vi-VN")} VND
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm font-semibold text-slate-900 bg-amber-100 px-2 py-0.5 rounded">{r.transferReference}</span>
                        <button
                          onClick={() => copyToClipboard(r.transferReference)}
                          className="p-1 text-slate-400 hover:text-slate-600 transition-colors" title={t("topup.copyRef")}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500 hidden sm:table-cell whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${
                        r.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                        r.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {r.status === "PENDING" ? t("topup.statusPending") :
                         r.status === "CONFIRMED" ? t("topup.statusConfirmed") :
                         t("topup.statusCancelled")}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {r.status === "PENDING" ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleTopUpAction(r.id, "confirm")}
                            disabled={confirmingId === r.id}
                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                          >
                            {t("topup.confirmBtn")}
                          </button>
                          <button
                            onClick={() => handleTopUpAction(r.id, "cancel")}
                            disabled={confirmingId === r.id}
                            className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                          >
                            {t("topup.cancelBtn")}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {r.confirmer?.fullName && `${r.confirmer.fullName}`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              {topUpRequests.filter((r) => topUpFilter === "ALL" || r.status === "PENDING").length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl">{topUpFilter === "PENDING" ? "\u2705" : "\ud83d\udcb3"}</span>
                      <p className="text-sm text-slate-500">{t("topup.empty")}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <KPICard title={t("admin.totalRevenue")} value={`${(profit?.totalRevenue || 0).toLocaleString()} VND`} icon={<span>💰</span>} color="green" />
        <KPICard title={t("admin.totalProfit")} value={`${(profit?.totalProfit || 0).toLocaleString()} VND`} icon={<span>📈</span>} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card title={t("finance.processDeposit")}>
          <form onSubmit={processDeposit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("finance.customerEmail")}</label>
              <input type="email" placeholder={t("finance.customerEmailPlaceholder")} value={depositEmail}
                onChange={(e) => { setDepositEmail(e.target.value); setMatchedCustomer(null); setLookupError(""); }}
                onBlur={() => lookupCustomer(depositEmail)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required />
              {matchedCustomer && (
                <p className="mt-1.5 text-xs text-emerald-600 font-medium">
                  {t("finance.matchedCustomer")}: {matchedCustomer.fullName}
                </p>
              )}
              {lookupError && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{lookupError}</p>
              )}
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

      {/* Bank Webhook Logs */}
      <Card title={t("finance.webhookLogsTitle")} noPadding className="mb-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">{t("finance.webhookProvider")}</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">{t("finance.webhookTxId")}</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">{t("finance.webhookRef")}</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">{t("common.amount")}</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase">{t("topup.status")}</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">{t("finance.webhookError")}</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">{t("topup.time")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {webhookLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3 py-2.5 text-xs font-medium text-slate-700">{log.provider}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600 font-mono">{log.transactionId.slice(0, 12)}...</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600 hidden sm:table-cell">{log.transferReference || "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-right text-slate-700">{log.amount ? parseFloat(log.amount).toLocaleString() : "—"}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                      log.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700" :
                      log.status === "FAILED" ? "bg-red-100 text-red-700" :
                      log.status === "DUPLICATE" ? "bg-purple-100 text-purple-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-red-500 hidden sm:table-cell">{log.errorReason || "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500 hidden sm:table-cell">{new Date(log.createdAt).toLocaleString("vi-VN")}</td>
                </tr>
              ))}
              {webhookLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl">{"\uD83D\uDD14"}</span>
                      <p className="text-sm text-slate-500">{t("finance.webhookNoLogs")}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

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
