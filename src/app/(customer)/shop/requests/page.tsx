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

interface UserProfile {
  fullName: string;
  phone: string | null;
  address: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200",
  CONTACTED: "bg-amber-50 text-amber-700 border-amber-200",
  PRICE_CONFIRMED: "bg-purple-50 text-purple-700 border-purple-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
  PROCESSING: "bg-indigo-50 text-indigo-700 border-indigo-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

const fmtCurrency = (val: string | number) =>
  (typeof val === "string" ? parseFloat(val) : val).toLocaleString("vi-VN") + " \u20AB";

export default function ShopRequestsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [requests, setRequests] = useState<SalesRequest[]>([]);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [codConfirmId, setCodConfirmId] = useState<string | null>(null);
  const [codProcessing, setCodProcessing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [codAddressConfirmed, setCodAddressConfirmed] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [reqRes, walletRes, meRes] = await Promise.all([
        fetch("/api/sales-requests"),
        fetch("/api/wallet"),
        fetch("/api/auth/me"),
      ]);
      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequests(data.requests || []);
      }
      if (walletRes.ok) setWallet(await walletRes.json());
      if (meRes.ok) setUserProfile(await meRes.json());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      NEW: "Mới",
      CONTACTED: "Đã liên hệ",
      PRICE_CONFIRMED: "Chờ thanh toán",
      PAID: "Đã thanh toán",
      PROCESSING: "Đang xử lý",
      COMPLETED: "Hoàn thành",
      CANCELLED: "Đã hủy",
    };
    return map[status] || status;
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch { /* ignore */ }
  };

  const handlePay = async (id: string) => {
    setPaying(true);
    try {
      const res = await fetch(`/api/sales-requests/${id}/pay`, { method: "POST" });
      if (res.ok) {
        const result = await res.json();
        toast(t("sales.paySuccess"), "success");
        setPayingId(null);
        setRequests((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, status: "PAID", paidAt: new Date().toISOString(), paidFromWallet: true } : r
          )
        );
        if (wallet && result.walletBalance !== undefined) {
          setWallet({ ...wallet, balance: String(result.walletBalance), debt: String(result.walletDebt ?? wallet.debt) });
        } else {
          const walletRes = await fetch("/api/wallet");
          if (walletRes.ok) setWallet(await walletRes.json());
        }
      } else {
        const err = await res.json();
        toast(err.error || t("publicShop.submitError"), "error");
      }
    } catch {
      toast(t("publicShop.submitError"), "error");
    } finally {
      setPaying(false);
    }
  };

  const handleCOD = async (id: string) => {
    setCodProcessing(true);
    try {
      const res = await fetch(`/api/sales-requests/${id}/cod`, { method: "POST" });
      if (res.ok) {
        toast("Đã xác nhận thanh toán tiền mặt khi nhận hàng (COD)", "success");
        setCodConfirmId(null);
        setCodAddressConfirmed(false);
        setRequests((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, status: "PAID", paidAt: new Date().toISOString(), paidFromWallet: false } : r
          )
        );
      } else {
        const err = await res.json();
        toast(err.error || t("publicShop.submitError"), "error");
      }
    } catch {
      toast(t("publicShop.submitError"), "error");
    } finally {
      setCodProcessing(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const walletBalance = wallet ? parseFloat(wallet.balance) : 0;
  const walletDebt = wallet ? parseFloat(wallet.debt) : 0;

  return (
    <div>
      <PageHeader title={t("sales.requestsTitle")} subtitle={t("sales.requestsSubtitle")} />

      {/* Wallet overview cards */}
      {wallet && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
            <p className="text-xs text-green-600 font-medium mb-1">{t("sales.walletBalance")}</p>
            <p className="text-lg sm:text-xl font-bold text-green-700">{fmtCurrency(wallet.balance)}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-4">
            <p className="text-xs text-red-600 font-medium mb-1">{t("sales.walletDebt")}</p>
            <p className={`text-lg sm:text-xl font-bold ${walletDebt > 0 ? "text-red-700" : "text-slate-500"}`}>{fmtCurrency(wallet.debt)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-center justify-center">
            <Link href="/wallet" className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline">
              {t("sales.topUpFirst")} &rarr;
            </Link>
          </div>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl mb-4 block">{"\uD83D\uDECD\uFE0F"}</span>
          <p className="text-slate-400 mb-4">{t("sales.noRequests")}</p>
          <Link href="/shop" className="inline-block px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition">
            {t("sales.shopTitle")} &rarr;
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 pr-3">{t("sales.requestCode")}</th>
                  <th className="pb-3 pr-3">{t("sales.productName")}</th>
                  <th className="pb-3 pr-3 text-center">{t("sales.quantity")}</th>
                  <th className="pb-3 pr-3 text-right">{t("sales.estimatedTotal")}</th>
                  <th className="pb-3 pr-3 text-right">{t("sales.confirmedPrice")}</th>
                  <th className="pb-3 pr-3 text-center">{t("sales.updateStatus")}</th>
                  <th className="pb-3 text-right">{t("sales.requestsActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => {
                  const canPay = req.status === "PRICE_CONFIRMED" && req.confirmedPrice;
                  const price = req.confirmedPrice ? parseFloat(req.confirmedPrice) : 0;
                  const insufficient = canPay && walletBalance < price;
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/50">
                      {/* Request code with copy */}
                      <td className="py-3 pr-3">
                        <button
                          onClick={() => copyCode(req.requestCode)}
                          className="group flex items-center gap-1 font-mono text-xs text-slate-500 hover:text-slate-800 transition"
                          title="Click to copy"
                        >
                          {req.requestCode}
                          <span className="text-slate-300 group-hover:text-blue-500 transition">
                            {copiedCode === req.requestCode ? "\u2713" : "\u2398"}
                          </span>
                        </button>
                      </td>
                      {/* Product */}
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-slate-50 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {req.product?.imageUrl ? (
                              <img src={req.product.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs">{"\uD83D\uDECD\uFE0F"}</span>
                            )}
                          </div>
                          <span className="text-slate-800 font-medium truncate max-w-[180px]">{req.productName}</span>
                        </div>
                      </td>
                      {/* Quantity */}
                      <td className="py-3 pr-3 text-center text-slate-600">{req.quantity}</td>
                      {/* Estimated total */}
                      <td className="py-3 pr-3 text-right text-slate-500">
                        {req.estimatedTotal ? fmtCurrency(req.estimatedTotal) : "—"}
                      </td>
                      {/* Confirmed price */}
                      <td className="py-3 pr-3 text-right">
                        {req.confirmedPrice ? (
                          <span className="font-semibold text-orange-600">{fmtCurrency(req.confirmedPrice)}</span>
                        ) : (
                          <span className="text-xs text-slate-400">{t("sales.waitingPrice")}</span>
                        )}
                      </td>
                      {/* Status */}
                      <td className="py-3 pr-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[req.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                          {statusLabel(req.status)}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="py-3 text-right">
                        {canPay ? (
                          payingId === req.id ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => setPayingId(null)} className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50">
                                {t("common.cancel")}
                              </button>
                              <button
                                onClick={() => handlePay(req.id)}
                                disabled={paying || !!insufficient}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                              >
                                {paying ? t("common.loading") : t("sales.payConfirm")}
                              </button>
                            </div>
                          ) : codConfirmId === req.id ? (
                            <div className="space-y-1.5">
                              {!userProfile?.address ? (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                                  <p className="text-[10px] text-red-700 font-medium mb-1">Bạn chưa cập nhật địa chỉ giao hàng tại Việt Nam.</p>
                                  <Link href="/profile" className="text-[10px] text-red-700 font-bold border border-red-300 rounded px-2 py-0.5 hover:bg-red-100 transition inline-block">
                                    Cập nhật hồ sơ &rarr;
                                  </Link>
                                  <button onClick={() => { setCodConfirmId(null); setCodAddressConfirmed(false); }} className="ml-2 text-[10px] text-slate-500 hover:text-slate-700">
                                    Đóng
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-[10px] text-slate-700">
                                    <p className="font-semibold mb-0.5">Địa chỉ nhận hàng COD:</p>
                                    <p>Họ tên: {userProfile.fullName}</p>
                                    {userProfile.phone && <p>SĐT: {userProfile.phone}</p>}
                                    <p>Địa chỉ: {userProfile.address}</p>
                                  </div>
                                  <label className="flex items-start gap-1.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={codAddressConfirmed}
                                      onChange={(e) => setCodAddressConfirmed(e.target.checked)}
                                      className="mt-0.5 accent-orange-500"
                                    />
                                    <span className="text-[10px] text-slate-600">Tôi xác nhận đây là địa chỉ nhận hàng chính xác tại Việt Nam cho đơn hàng COD này.</span>
                                  </label>
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button onClick={() => { setCodConfirmId(null); setCodAddressConfirmed(false); }} className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50">
                                      Không
                                    </button>
                                    <button
                                      onClick={() => handleCOD(req.id)}
                                      disabled={codProcessing || !codAddressConfirmed}
                                      className="px-3 py-1.5 text-xs font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                      {codProcessing ? t("common.loading") : "Xác nhận COD"}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {insufficient && <p className="text-[10px] text-red-600 mb-0.5">Số dư ví không đủ để thanh toán. Vui lòng nạp thêm tiền.</p>}
                              <button
                                onClick={() => setPayingId(req.id)}
                                disabled={!!insufficient}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                              >
                                {t("sales.payFromWallet")}
                              </button>
                              <button
                                onClick={() => setCodConfirmId(req.id)}
                                className="px-3 py-1.5 text-xs font-bold text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition"
                              >
                                Thanh toán khi nhận hàng (COD)
                              </button>
                            </div>
                          )
                        ) : req.paidAt ? (
                          <span className="text-xs text-green-600">{t("sales.paid")}</span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card layout */}
          <div className="md:hidden space-y-3">
            {requests.map((req) => {
              const canPay = req.status === "PRICE_CONFIRMED" && req.confirmedPrice;
              const price = req.confirmedPrice ? parseFloat(req.confirmedPrice) : 0;
              const insufficient = canPay && walletBalance < price;

              return (
                <div key={req.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Code + status */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <button
                          onClick={() => copyCode(req.requestCode)}
                          className="flex items-center gap-1 font-mono text-xs text-slate-400 hover:text-slate-700 transition"
                        >
                          {req.requestCode}
                          <span className="text-[10px]">{copiedCode === req.requestCode ? "\u2713" : "\u2398"}</span>
                        </button>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_COLORS[req.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                          {statusLabel(req.status)}
                        </span>
                      </div>
                      {/* Product */}
                      <h3 className="font-medium text-slate-900 text-sm">{req.productName}</h3>
                      <div className="text-xs text-slate-500 mt-1 space-x-3">
                        <span>{t("sales.quantity")}: {req.quantity}</span>
                        {req.estimatedTotal && (
                          <span>{t("sales.estimatedTotal")}: {fmtCurrency(req.estimatedTotal)}</span>
                        )}
                      </div>
                      {req.confirmedPrice && (
                        <p className="mt-1 text-sm font-semibold text-orange-600">
                          {t("sales.confirmedPrice")}: {fmtCurrency(req.confirmedPrice)}
                        </p>
                      )}
                      {req.status === "NEW" && <p className="text-[10px] text-amber-600 mt-1">{t("sales.waitingPrice")}</p>}
                      {req.paidAt && <p className="text-[10px] text-green-600 mt-1">{t("sales.paid")} — {new Date(req.paidAt).toLocaleString("vi-VN")}</p>}
                      {req.adminNote && <p className="text-[10px] text-slate-400 mt-1 italic">{req.adminNote}</p>}
                      <p className="text-[10px] text-slate-300 mt-1">{new Date(req.createdAt).toLocaleString("vi-VN")}</p>
                    </div>
                    {/* Product image */}
                    <div className="w-14 h-14 bg-slate-50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {req.product?.imageUrl ? (
                        <img src={req.product.imageUrl} alt={req.productName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">{"\uD83D\uDECD\uFE0F"}</span>
                      )}
                    </div>
                  </div>

                  {/* Pay button */}
                  {canPay && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      {insufficient && <p className="text-xs text-red-600">Số dư ví không đủ để thanh toán. Vui lòng nạp thêm tiền.</p>}
                      {payingId === req.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => setPayingId(null)} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                            {t("common.cancel")}
                          </button>
                          <button
                            onClick={() => handlePay(req.id)}
                            disabled={paying || !!insufficient}
                            className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {paying ? t("common.loading") : t("sales.payConfirm")}
                          </button>
                        </div>
                      ) : codConfirmId === req.id ? (
                        <div className="space-y-2">
                          {!userProfile?.address ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <p className="text-xs text-red-700 font-medium mb-1.5">Bạn chưa cập nhật địa chỉ giao hàng tại Việt Nam.</p>
                              <Link href="/profile" className="text-xs text-red-700 font-bold border border-red-300 rounded px-3 py-1 hover:bg-red-100 transition inline-block">
                                Cập nhật hồ sơ &rarr;
                              </Link>
                              <button onClick={() => { setCodConfirmId(null); setCodAddressConfirmed(false); }} className="ml-2 text-xs text-slate-500 hover:text-slate-700">
                                Đóng
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
                                <p className="font-semibold mb-1">Địa chỉ nhận hàng COD:</p>
                                <p>Họ tên: {userProfile.fullName}</p>
                                {userProfile.phone && <p>SĐT: {userProfile.phone}</p>}
                                <p>Địa chỉ: {userProfile.address}</p>
                              </div>
                              <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={codAddressConfirmed}
                                  onChange={(e) => setCodAddressConfirmed(e.target.checked)}
                                  className="mt-0.5 accent-orange-500"
                                />
                                <span className="text-xs text-slate-600">Tôi xác nhận đây là địa chỉ nhận hàng chính xác tại Việt Nam cho đơn hàng COD này.</span>
                              </label>
                              <div className="flex gap-2">
                                <button onClick={() => { setCodConfirmId(null); setCodAddressConfirmed(false); }} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                                  Không
                                </button>
                                <button
                                  onClick={() => handleCOD(req.id)}
                                  disabled={codProcessing || !codAddressConfirmed}
                                  className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                  {codProcessing ? t("common.loading") : "Xác nhận COD"}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setPayingId(req.id)}
                            disabled={!!insufficient}
                            className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {t("sales.payFromWallet")} — {fmtCurrency(price)}
                          </button>
                          <button
                            onClick={() => setCodConfirmId(req.id)}
                            className="w-full px-3 py-2 text-orange-600 border border-orange-300 rounded-lg text-sm font-bold hover:bg-orange-50 transition"
                          >
                            Thanh toán khi nhận hàng (COD)
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
