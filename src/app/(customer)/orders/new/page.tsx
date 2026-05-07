"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

export default function NewOrderPage() {
  const router = useRouter();
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

  useEffect(() => {
    fetch("/api/settings/exchange-rate")
      .then((r) => r.json())
      .then((d) => setExchangeRate(parseFloat(d.exchange_rate)));
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
      setError(data.error || "Failed to create order");
      setLoading(false);
      return;
    }

    const order = await res.json();
    router.push(`/orders/${order.id}`);
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Create New Order" subtitle="Submit a product from Taobao, 1688, or Tmall" />

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
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Product Name *</label>
                <input
                  type="text"
                  value={form.productName}
                  onChange={(e) => setForm({ ...form, productName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., Wireless Earbuds TWS"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Product Link *</label>
                <input
                  type="url"
                  value={form.productLink}
                  onChange={(e) => setForm({ ...form, productLink: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="https://item.taobao.com/..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantity *</label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Unit Price (CNY) *</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  rows={3}
                  placeholder="Any special instructions..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating order...
                  </span>
                ) : "Create Order"}
              </button>
            </form>
          </Card>
        </div>

        {/* Cost estimate sidebar */}
        <div>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white sticky top-8">
            <h3 className="font-semibold mb-4 text-blue-100 text-sm uppercase tracking-wider">Estimated Cost</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-200">Product Total</span>
                <span className="font-semibold">&yen;{estimatedCNY.toFixed(2)} CNY</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">Exchange Rate</span>
                <span className="font-semibold">1 CNY = {exchangeRate.toLocaleString()} VND</span>
              </div>
              <div className="border-t border-white/20 pt-3 mt-3">
                <div className="flex justify-between items-end">
                  <span className="text-blue-100 font-medium">Estimated Total</span>
                  <span className="text-xl font-bold">{estimatedVND.toLocaleString()} VND</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-blue-200 mt-4 leading-relaxed">
              Final cost includes service fee, China shipping, international shipping (by weight), and Vietnam delivery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
