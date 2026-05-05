"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Create New Order</h1>

      <Card>
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input
              type="text"
              value={form.productName}
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Wireless Earbuds TWS"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Link *</label>
            <input
              type="url"
              value={form.productLink}
              onChange={(e) => setForm({ ...form, productLink: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="https://item.taobao.com/..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (CNY) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.unitPriceCNY}
                onChange={(e) => setForm({ ...form, unitPriceCNY: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Any special instructions..."
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Estimated Cost</h3>
            <div className="text-sm space-y-1 text-blue-800">
              <div className="flex justify-between">
                <span>Product Total:</span>
                <span>¥{estimatedCNY.toFixed(2)} CNY</span>
              </div>
              <div className="flex justify-between">
                <span>Exchange Rate:</span>
                <span>1 CNY = {exchangeRate.toLocaleString()} VND</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-blue-200 pt-1 mt-1">
                <span>Estimated (excl. shipping):</span>
                <span>{estimatedVND.toLocaleString()} VND</span>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Final cost includes service fee, China shipping, international shipping (by weight), and Vietnam delivery.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Order"}
          </button>
        </form>
      </Card>
    </div>
  );
}
