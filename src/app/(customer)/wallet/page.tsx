"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import KPICard from "@/components/ui/KPICard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import MobileDataCard from "@/components/ui/MobileDataCard";
import { useI18n } from "@/lib/i18n";

interface BankConfig {
  topup_bank_name: string;
  topup_bank_bin: string;
  topup_bank_account: string;
  topup_bank_account_holder: string;
  topup_transfer_prefix: string;
}

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

interface PendingTopUp {
  id: string;
  amount: string;
  transferReference: string;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
  status: string;
  createdAt: string;
}

export default function WalletPage() {
  const { t } = useI18n();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [topUpAmount, setTopUpAmount] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [topUpSaved, setTopUpSaved] = useState(false);
  const [topUpSaving, setTopUpSaving] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<PendingTopUp | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [bankConfig, setBankConfig] = useState<BankConfig>({
    topup_bank_name: "Vietinbank CN Lạng Sơn",
    topup_bank_bin: "970415",
    topup_bank_account: "110003049134",
    topup_bank_account_holder: "BAC TRUNG HAI LOGISTICS CO LTD",
    topup_transfer_prefix: "NAPVI",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/wallet").then((r) => r.json()),
      fetch("/api/transactions?limit=10").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/wallet/topup-request").then((r) => r.json()),
      fetch("/api/wallet/bank-config").then((r) => r.json()),
    ]).then(([w, txData, me, pending, bc]) => {
      setWallet(w);
      setTransactions(txData.transactions || []);
      setUserId(me?.id || "");
      if (pending && pending.id && pending.status === "PENDING") {
        setPendingRequest(pending);
      }
      if (bc && bc.topup_bank_bin) {
        setBankConfig(bc);
      }
      setLoading(false);
    });
  }, []);

  const transferRef = useMemo(() => {
    if (pendingRequest) return pendingRequest.transferReference;
    if (!userId) return "";
    const prefix = bankConfig.topup_transfer_prefix || "NAPVI";
    const shortId = userId.slice(-6).toUpperCase();
    const ts = Math.floor(Date.now() / 1000).toString().slice(-6);
    return `${prefix}${shortId}${ts}`;
  }, [userId, showQR, pendingRequest, bankConfig.topup_transfer_prefix]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayAmount = pendingRequest ? parseFloat(pendingRequest.amount) : parseInt(topUpAmount.replace(/\D/g, "") || "0", 10);

  const qrUrl = useMemo(() => {
    if (pendingRequest && displayAmount > 0) {
      return `https://img.vietqr.io/image/${bankConfig.topup_bank_bin}-${bankConfig.topup_bank_account}-compact2.png?amount=${displayAmount}&addInfo=${encodeURIComponent(transferRef)}&accountName=${encodeURIComponent(bankConfig.topup_bank_account_holder)}`;
    }
    if (!showQR || displayAmount <= 0) return "";
    return `https://img.vietqr.io/image/${bankConfig.topup_bank_bin}-${bankConfig.topup_bank_account}-compact2.png?amount=${displayAmount}&addInfo=${encodeURIComponent(transferRef)}&accountName=${encodeURIComponent(bankConfig.topup_bank_account_holder)}`;
  }, [showQR, displayAmount, transferRef, pendingRequest, bankConfig]);

  const parsedAmount = parseInt(topUpAmount.replace(/\D/g, "") || "0", 10);

  const handleCancelRequest = useCallback(async () => {
    setCancelling(true);
    try {
      const res = await fetch("/api/wallet/topup-request", { method: "DELETE" });
      if (res.ok) {
        setPendingRequest(null);
        setShowQR(false);
        setTopUpSaved(false);
        setTopUpAmount("");
      }
    } catch {
      // silent
    } finally {
      setCancelling(false);
    }
  }, []);

  if (loading) return <LoadingSpinner text={t("wallet.loading")} />;

  const showPendingSection = !!pendingRequest;
  const showNewQRSection = showQR && parsedAmount > 0 && !pendingRequest;

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

      {/* Nạp tiền vào ví */}
      <Card title="Nạp tiền vào ví" className="mb-8">
        <div className="space-y-4">

          {/* Existing pending request banner */}
          {showPendingSection && (
            <div className="border border-amber-300 rounded-xl p-5 bg-amber-50/60 space-y-4">
              <div className="bg-amber-100 border border-amber-300 rounded-xl p-3">
                <p className="text-xs font-medium text-amber-900">
                  ⏳ Bạn đang có một yêu cầu nạp tiền chờ xác nhận. Vui lòng chuyển khoản theo mã này hoặc huỷ yêu cầu để tạo mã mới.
                </p>
              </div>

              <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <span>📋</span> Thông tin chuyển khoản
              </h4>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="flex gap-2">
                  <dt className="text-slate-500 shrink-0">Ngân hàng:</dt>
                  <dd className="text-slate-900 font-medium">{pendingRequest.bankName}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-500 shrink-0">Số tài khoản:</dt>
                  <dd className="text-slate-900 font-medium font-mono">{pendingRequest.bankAccount}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-500 shrink-0">Chủ tài khoản:</dt>
                  <dd className="text-slate-900 font-medium">{pendingRequest.accountHolder}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-500 shrink-0">Số tiền:</dt>
                  <dd className="text-emerald-700 font-semibold">{displayAmount.toLocaleString("vi-VN")} VND</dd>
                </div>
                <div className="flex gap-2 sm:col-span-2">
                  <dt className="text-slate-500 shrink-0">Nội dung CK:</dt>
                  <dd className="text-slate-900 font-semibold font-mono bg-amber-100 px-2 py-0.5 rounded">{pendingRequest.transferReference}</dd>
                </div>
              </dl>

              {qrUrl && (
                <div className="flex flex-col items-center gap-3 pt-2">
                  <p className="text-xs text-slate-500">Quét mã QR bằng app ngân hàng để chuyển khoản nhanh</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt="VietQR chuyển khoản"
                    width={280}
                    height={330}
                    className="rounded-xl border border-slate-200 shadow-sm"
                  />
                </div>
              )}

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <p className="text-xs font-medium text-emerald-800">✅ Yêu cầu nạp tiền đã được tạo. Quản trị viên sẽ đối chiếu nội dung chuyển khoản và xác nhận ví sau khi nhận tiền.</p>
              </div>

              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelRequest}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 text-sm font-semibold rounded-xl hover:bg-red-200 disabled:opacity-50 transition-colors"
              >
                ❌ Huỷ yêu cầu nạp tiền
              </button>
            </div>
          )}

          {/* New request form — only when no pending request */}
          {!showPendingSection && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Số tiền cần nạp (VND) *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={topUpAmount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setTopUpAmount(raw ? parseInt(raw, 10).toLocaleString("vi-VN") : "");
                    setShowQR(false);
                    setTopUpSaved(false);
                  }}
                  className="w-full max-w-xs px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ví dụ: 500,000"
                />
              </div>

              <button
                type="button"
                disabled={parsedAmount <= 0 || topUpSaving}
                onClick={async () => {
                  setShowQR(true);
                  setTopUpSaving(true);
                  try {
                    const prefix = bankConfig.topup_transfer_prefix || "NAPVI";
                    const ref = `${prefix}${(userId || "").slice(-6).toUpperCase()}${Math.floor(Date.now() / 1000).toString().slice(-6)}`;
                    const res = await fetch("/api/wallet/topup-request", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        amount: parsedAmount,
                        transferReference: ref,
                        bankName: bankConfig.topup_bank_name,
                        bankAccount: bankConfig.topup_bank_account,
                        accountHolder: bankConfig.topup_bank_account_holder,
                      }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setPendingRequest(data);
                      setTopUpSaved(true);
                    }
                  } catch {
                    // QR still shows even if save fails
                  } finally {
                    setTopUpSaving(false);
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                🏦 Tạo mã QR chuyển khoản
              </button>

              {showNewQRSection && (
                <div className="border border-blue-200 rounded-xl p-5 bg-blue-50/50 space-y-4">
                  <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <span>📋</span> Thông tin chuyển khoản
                  </h4>

                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div className="flex gap-2">
                      <dt className="text-slate-500 shrink-0">Ngân hàng:</dt>
                      <dd className="text-slate-900 font-medium">{bankConfig.topup_bank_name}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-slate-500 shrink-0">Số tài khoản:</dt>
                      <dd className="text-slate-900 font-medium font-mono">{bankConfig.topup_bank_account}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-slate-500 shrink-0">Chủ tài khoản:</dt>
                      <dd className="text-slate-900 font-medium">{bankConfig.topup_bank_account_holder}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-slate-500 shrink-0">Số tiền:</dt>
                      <dd className="text-emerald-700 font-semibold">{parsedAmount.toLocaleString("vi-VN")} VND</dd>
                    </div>
                    <div className="flex gap-2 sm:col-span-2">
                      <dt className="text-slate-500 shrink-0">Nội dung CK:</dt>
                      <dd className="text-slate-900 font-semibold font-mono bg-amber-100 px-2 py-0.5 rounded">{transferRef}</dd>
                    </div>
                  </dl>

                  {qrUrl && (
                    <div className="flex flex-col items-center gap-3 pt-2">
                      <p className="text-xs text-slate-500">Quét mã QR bằng app ngân hàng để chuyển khoản nhanh</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrUrl}
                        alt="VietQR chuyển khoản"
                        width={280}
                        height={330}
                        className="rounded-xl border border-slate-200 shadow-sm"
                      />
                    </div>
                  )}

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                    <p className="text-xs font-medium text-amber-900">⚠️ Lưu ý quan trọng</p>
                    <p className="text-xs text-amber-700">Vui lòng chuyển đúng số tiền và đúng nội dung để được xử lý nhanh.</p>
                    <p className="text-xs text-amber-700">Sau khi chuyển khoản, hệ thống sẽ kiểm tra và cập nhật ví sau khi xác nhận.</p>
                  </div>

                  {topUpSaved && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                      <p className="text-xs font-medium text-emerald-800">✅ Yêu cầu nạp tiền đã được tạo. Quản trị viên sẽ đối chiếu nội dung chuyển khoản và xác nhận ví sau khi nhận tiền.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      <Card title={t("wallet.recentTransactions")} noPadding>
        {/* Mobile card view */}
        <div className="md:hidden flex flex-col gap-2 p-2">
          {transactions.map((tx) => {
            const isDebit = ["ORDER_PAYMENT", "MANUAL_DEDUCT", "SALES_PAYMENT"].includes(tx.type);
            return (
              <MobileDataCard
                key={tx.id}
                fields={[
                  { label: t("transactions.type"), value: (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold ${
                      tx.type === "DEPOSIT" || tx.type === "MANUAL_ADD" ? "bg-emerald-50 text-emerald-700" :
                      tx.type === "REFUND" ? "bg-blue-50 text-blue-700" :
                      isDebit ? "bg-red-50 text-red-700" :
                      "bg-slate-100 text-slate-700"
                    }`}>
                      {t(`transactions.tx.${tx.type}`, tx.type.replace(/_/g, " "))}
                    </span>
                  )},
                  { label: t("common.amount"), value: (
                    <span className={`font-semibold ${isDebit ? "text-red-600" : "text-emerald-600"}`}>
                      {isDebit ? "-" : "+"}{parseFloat(tx.amount).toLocaleString()} VND
                    </span>
                  )},
                  { label: t("common.date"), value: new Date(tx.createdAt).toLocaleDateString() },
                  { label: t("transactions.balanceAfter"), value: `${parseFloat(tx.balanceAfter).toLocaleString()} VND` },
                  { label: t("transactions.description"), value: tx.description, fullWidth: true },
                ]}
              />
            );
          })}
          {transactions.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12">
              <span className="text-3xl">\ud83d\udcb3</span>
              <p className="text-sm text-slate-500">{t("transactions.empty")}</p>
            </div>
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block overflow-x-auto">
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
                      tx.type === "DEPOSIT" || tx.type === "MANUAL_ADD" ? "bg-emerald-50 text-emerald-700" :
                      tx.type === "REFUND" ? "bg-blue-50 text-blue-700" :
                      tx.type === "ORDER_PAYMENT" || tx.type === "MANUAL_DEDUCT" || tx.type === "SALES_PAYMENT" ? "bg-red-50 text-red-700" :
                      "bg-slate-100 text-slate-700"
                    }`}>
                      {t(`transactions.tx.${tx.type}`, tx.type.replace(/_/g, " "))}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{tx.description}</td>
                  <td className={`px-6 py-4 text-right text-sm font-semibold ${["ORDER_PAYMENT", "MANUAL_DEDUCT", "SALES_PAYMENT"].includes(tx.type) ? "text-red-600" : "text-emerald-600"}`}>
                    {["ORDER_PAYMENT", "MANUAL_DEDUCT", "SALES_PAYMENT"].includes(tx.type) ? "-" : "+"}{parseFloat(tx.amount).toLocaleString()} VND
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
