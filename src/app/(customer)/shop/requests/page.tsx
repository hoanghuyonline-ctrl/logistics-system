"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface SalesRequest {
  id: string;
  requestCode: string;
  productName: string;
  quantity: number;
  estimatedTotal: string | null;
  confirmedPrice: string | null;
  status: string;
  customerNote: string | null;
  adminNote: string | null;
  paidAt: string | null;
  paidFromWallet: boolean;
  createdAt: string;
  product: { id: string; name: string; imageUrl: string | null } | null;
}

interface WalletInfo {
  balance: string;
  debt: string;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700",
  CONTACTED: "bg-amber-50 text-amber-700",
  PRICE_CONFIRMED: "bg-purple-50 text-purple-700",
  PAID: "bg-green-50 text-green-700",
  PROCESSING: "bg-indigo-50 text-indigo-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
};

export default function ShopRequestsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [requests, setRequests] = useState<SalesRequest[]>([]);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [reqRes, walletRes] = await Promise.all([
        fetch("/api/sales-requests"),
        fetch("/api/wallet"),
      ]);
      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequests(data.requests || []);
      }
      if (walletRes.ok) setWallet(await walletRes.json());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      NEW: t("sales.statusNew"),
      CONTACTED: t("sales.statusContacted"),
      PRICE_CONFIRMED: t("sales.statusPriceConfirmed"),
      PAID: t("sales.statusPaid"),
      PROCESSING: t("sales.statusProcessing"),
      COMPLETED: t("sales.statusCompleted"),
      CANCELLED: t("sales.statusCancelled"),
    };
    return map[status] || status;
  };

  const handlePay = async (id: string) => {
    setPaying(true);
    try {
      const res = await fetch(`/api/sales-requests/${id}/pay`, { method: "POST" });
      if (res.ok) {
        toast(t("sales.paySuccess"), "success");
        setPayingId(null);
        fetchData();
      } else {
        const err = await res.json();
        toast(err.error || "Error", "error");
      }
    } catch {
      toast("Error", "error");
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title={t("sales.requestsTitle")} subtitle={t("sales.requestsSubtitle")} />

      {/* Wallet summary */}
      {wallet && (
        <div className="mb-4 flex items-center gap-4 text-sm text-slate-600">
          <span>{t("sales.walletBalance")}: <strong className="text-green-600">{parseFloat(wallet.balance).toLocaleString("vi-VN")} ₫</strong></span>
          {parseFloat(wallet.debt) > 0 && (
            <span>{t("sales.walletDebt")}: <strong className="text-red-600">{parseFloat(wallet.debt).toLocaleString("vi-VN")} ₫</strong></span>
          )}
          <Link href="/wallet" className="text-blue-600 hover:underline text-xs">{t("sales.topUpFirst")}</Link>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">{t("sales.noRequests")}</p>
          <Link href="/shop" className="text-orange-600 hover:underline font-medium">{t("sales.shopTitle")} →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const canPay = req.status === "PRICE_CONFIRMED" && req.confirmedPrice;
            const walletBalance = wallet ? parseFloat(wallet.balance) : 0;
            const price = req.confirmedPrice ? parseFloat(req.confirmedPrice) : 0;
            const insufficient = canPay && walletBalance < price;

            return (
              <div key={req.id} className="bg-white rounded-lg border border-slate-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-400">{req.requestCode}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[req.status] || "bg-slate-100 text-slate-600"}`}>
                        {statusLabel(req.status)}
                      </span>
                    </div>
                    <h3 className="font-medium text-slate-900">{req.productName}</h3>
                    <div className="text-sm text-slate-500 mt-0.5">
                      {t("sales.quantity")}: {req.quantity}
                      {req.estimatedTotal && (
                        <span className="ml-3">{t("sales.estimatedTotal")}: {parseFloat(req.estimatedTotal).toLocaleString("vi-VN")} ₫</span>
                      )}
                    </div>
                    {req.confirmedPrice && (
                      <div className="mt-1">
                        <span className="text-sm font-semibold text-orange-600">
                          {t("sales.confirmedPrice")}: {parseFloat(req.confirmedPrice).toLocaleString("vi-VN")} ₫
                        </span>
                      </div>
                    )}
                    {req.status === "NEW" && (
                      <p className="text-xs text-amber-600 mt-1">{t("sales.waitingPrice")}</p>
                    )}
                    {req.status === "CONTACTED" && (
                      <p className="text-xs text-amber-600 mt-1">{t("sales.statusContacted")}</p>
                    )}
                    {req.paidAt && (
                      <p className="text-xs text-green-600 mt-1">{t("sales.paid")} — {new Date(req.paidAt).toLocaleString("vi-VN")}</p>
                    )}
                    {req.adminNote && (
                      <p className="text-xs text-slate-400 mt-1 italic">{req.adminNote}</p>
                    )}
                    <p className="text-xs text-slate-300 mt-1">{new Date(req.createdAt).toLocaleString("vi-VN")}</p>
                  </div>
                  {/* Product image */}
                  <div className="w-14 h-14 bg-slate-50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {req.product?.imageUrl ? (
                      <img src={req.product.imageUrl} alt={req.productName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">🛍️</span>
                    )}
                  </div>
                </div>

                {/* Pay button */}
                {canPay && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    {insufficient && (
                      <p className="text-xs text-amber-600 mb-2">{t("sales.insufficientBalance")}</p>
                    )}
                    {payingId === req.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPayingId(null)}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                        >
                          {t("common.cancel")}
                        </button>
                        <button
                          onClick={() => handlePay(req.id)}
                          disabled={paying}
                          className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 disabled:opacity-50"
                        >
                          {paying ? t("common.loading") : t("sales.payConfirm")}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setPayingId(req.id)}
                        className="w-full px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition"
                      >
                        {t("sales.payFromWallet")} — {price.toLocaleString("vi-VN")} ₫
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
