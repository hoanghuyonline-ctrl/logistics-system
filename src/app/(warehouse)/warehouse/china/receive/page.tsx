"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { OrderStatus } from "@prisma/client";

interface Order {
  id: string;
  orderCode: string;
  productName: string;
  quantity: number;
  status: OrderStatus;
  user: { fullName: string };
}

export default function ChinaReceivePage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState("");
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    fetch("/api/orders?status=SELLER_SHIPPED&limit=50")
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders || []); setLoading(false); });
  }, []);

  async function receiveOrder(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/warehouse/china/receive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: selectedOrder, weightKg: weight || undefined, note }),
    });
    if (res.ok) {
      toast("Order received successfully!", "success");
      setOrders((prev) => prev.filter((o) => o.id !== selectedOrder));
      setSelectedOrder("");
      setWeight("");
      setNote("");
    } else {
      const data = await res.json();
      toast(data.error || "Failed to receive order", "error");
    }
  }

  if (loading) return <LoadingSpinner text="Loading orders..." />;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Receive Goods" subtitle="Confirm goods arrival at China warehouse" />

      <Card title="Confirm Goods Receipt" className="mb-6">
        <form onSubmit={receiveOrder} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Order</label>
            <select value={selectedOrder} onChange={(e) => setSelectedOrder(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required>
              <option value="">— Select an order —</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>{o.orderCode} — {o.productName} (x{o.quantity}) — {o.user.fullName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Weight (kg)</label>
            <input type="number" step="0.001" value={weight} onChange={(e) => setWeight(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Optional — can be added later" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Note</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              rows={2} placeholder="Any notes about the received goods..." />
          </div>
          <button type="submit" disabled={!selectedOrder}
            className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm text-sm">
            Confirm Receipt
          </button>
        </form>
      </Card>

      <Card title={`Pending Orders (${orders.length})`} noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((o) => (
                <tr key={o.id}
                  className={`cursor-pointer transition-colors ${selectedOrder === o.id ? "bg-blue-50" : "hover:bg-slate-50/50"}`}
                  onClick={() => setSelectedOrder(o.id)}>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">{o.orderCode}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{o.productName} x{o.quantity}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{o.user.fullName}</td>
                  <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
