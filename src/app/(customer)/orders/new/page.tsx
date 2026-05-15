"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n";

export default function NewOrderPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [form, setForm] = useState({
    productName: "",
    productLink: "",
    quantity: "1",
    unitPriceCNY: "",
    notes: "",
  });
  const [exchangeRate, setExchangeRate] = useState(3500);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<{ fullName: string; phone: string; address: string } | null>(null);
  const [addressConfirmed, setAddressConfirmed] = useState(false);

  useEffect(() => {
    fetch("/api/settings/exchange-rate")
      .then((r) => r.json())
      .then((d) => setExchangeRate(parseFloat(d.exchange_rate)));
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUserProfile({ fullName: d.fullName || "", phone: d.phone || "", address: d.address || "" }))
      .catch(() => {});
  }, []);

  const estimatedCNY = parseFloat(form.unitPriceCNY || "0") * parseInt(form.quantity || "1");
  const estimatedVND = estimatedCNY * exchangeRate;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || t("newOrder.createFailed"));
      setLoading(false);
      return;
    }

    const order = await res.json();
    router.push(`/orders/${order.id}`);
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title={t("newOrder.title")} subtitle={t("newOrder.subtitle")} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm border border-red-100">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("newOrder.productName")} *</label>
                <input
                  type="text"
                  value={form.productName}
                  onChange={(e) => setForm({ ...form, productName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder={t("newOrder.productNamePlaceholder")}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("newOrder.productLink")} *</label>
                <input
                  type="url"
                  value={form.productLink}
                  onChange={(e) => setForm({ ...form, productLink: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder={t("newOrder.productLinkPlaceholder")}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("orderDetail.quantity")} *</label>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("newOrder.unitPriceCny")} *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.unitPriceCNY}
                    onChange={(e) => setForm({ ...form, unitPriceCNY: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("orderDetail.notes")}</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  rows={3}
                  placeholder={t("newOrder.notesPlaceholder")}
                />
              </div>

              {/* Địa chỉ nhận hàng tại Việt Nam */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📍</span>
                    <h3 className="text-sm font-semibold text-slate-800">Địa chỉ nhận hàng tại Việt Nam</h3>
                  </div>
                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors shadow-sm"
                  >
                    ✏️ Sửa địa chỉ
                  </Link>
                </div>
                {userProfile && userProfile.address ? (
                  <>
                    <dl className="space-y-1.5 text-sm">
                      <div className="flex gap-2">
                        <dt className="text-slate-500 shrink-0">Họ tên:</dt>
                        <dd className="text-slate-900 font-medium">{userProfile.fullName || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-slate-500 shrink-0">SĐT:</dt>
                        <dd className="text-slate-900 font-medium">{userProfile.phone || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-slate-500 shrink-0">Địa chỉ:</dt>
                        <dd className="text-slate-900 font-medium">{userProfile.address}</dd>
                      </div>
                    </dl>
                    <label className="flex items-start gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={addressConfirmed}
                        onChange={(e) => setAddressConfirmed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Tôi xác nhận đây là địa chỉ nhận hàng chính xác tại Việt Nam.</span>
                    </label>
                  </>
                ) : (
                  <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="text-lg shrink-0">⚠️</span>
                    <div>
                      <p className="text-sm font-medium text-amber-900">Bạn chưa có địa chỉ nhận hàng.</p>
                      <p className="text-sm text-amber-700 mt-0.5">Vui lòng cập nhật hồ sơ trước khi tạo đơn.</p>
                      <Link
                        href="/profile"
                        className="inline-block mt-2 px-4 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        Cập nhật hồ sơ →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !addressConfirmed || !userProfile?.address}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("newOrder.creating")}
                  </span>
                ) : t("newOrder.createOrder")}
              </button>
            </form>
          </Card>
        </div>

        {/* Cost estimate sidebar */}
        <div>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white sticky top-8">
            <h3 className="font-semibold mb-4 text-blue-100 text-sm uppercase tracking-wider">{t("newOrder.estimatedCost")}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-200">{t("newOrder.productTotal")}</span>
                <span className="font-semibold">&yen;{estimatedCNY.toFixed(2)} CNY</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">{t("orderDetail.exchangeRate")}</span>
                <span className="font-semibold">1 CNY = {exchangeRate.toLocaleString()} VND</span>
              </div>
              <div className="border-t border-white/20 pt-3 mt-3">
                <div className="flex justify-between items-end">
                  <span className="text-blue-100 font-medium">{t("newOrder.estimatedTotal")}</span>
                  <span className="text-xl font-bold">{estimatedVND.toLocaleString()} VND</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-blue-200 mt-4 leading-relaxed">
              {t("newOrder.finalCostNote")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
