"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Card from "@/components/ui/Card";
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState("");
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");

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
      setMsg("Order received successfully!");
      setOrders((prev) => prev.filter((o) => o.id !== selectedOrder));
      setSelectedOrder("");
      setWeight("");
      setNote("");
    } else {
      const data = await res.json();
      setMsg(`Error: ${data.error}`);
    }
    setTimeout(() => setMsg(""), 5000);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Receive Goods - China Warehouse</h1>

      <Card title="Confirm Goods Receipt">
        {msg && (
          <div className={`p-3 rounded mb-4 text-sm ${msg.startsWith("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
            {msg}
          </div>
        )}

        <form onSubmit={receiveOrder} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Order</label>
            <select
              value={selectedOrder}
              onChange={(e) => setSelectedOrder(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              required
            >
              <option value="">-- Select an order --</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderCode} - {o.productName} (x{o.quantity}) - {o.user.fullName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <input type="number" step="0.001" value={weight} onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Optional - can be added later" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} placeholder="Any notes about the received goods..." />
          </div>
          <button type="submit" disabled={!selectedOrder}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm">
            Confirm Receipt
          </button>
        </form>
      </Card>

      <div className="mt-6 bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Pending Orders ({orders.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Order</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Product</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => (
                <tr key={o.id} className={`hover:bg-gray-50 cursor-pointer ${selectedOrder === o.id ? "bg-blue-50" : ""}`}
                  onClick={() => setSelectedOrder(o.id)}>
                  <td className="px-4 py-3 font-medium">{o.orderCode}</td>
                  <td className="px-4 py-3">{o.productName} x{o.quantity}</td>
                  <td className="px-4 py-3">{o.user.fullName}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No orders pending receipt</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
