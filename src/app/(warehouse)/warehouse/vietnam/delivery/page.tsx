"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { OrderStatus } from "@prisma/client";

interface Order {
  id: string;
  orderCode: string;
  productName: string;
  status: OrderStatus;
  totalCostVND: string;
  user: { fullName: string; email: string };
}

export default function VietnamDeliveryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [outForDelivery, setOutForDelivery] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  function loadOrders() {
    setLoading(true);
    Promise.all([
      fetch("/api/orders?status=ARRIVED_VIETNAM_WH&limit=50").then((r) => r.json()),
      fetch("/api/orders?status=OUT_FOR_DELIVERY&limit=50").then((r) => r.json()),
    ]).then(([arrived, out]) => {
      setOrders(arrived.orders || []);
      setOutForDelivery(out.orders || []);
      setLoading(false);
    });
  }

  useEffect(() => { loadOrders(); }, []);

  async function updateDelivery(orderId: string, status: string) {
    const res = await fetch(`/api/warehouse/vietnam/delivery/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note: `Status updated to ${status.replace(/_/g, " ")}` }),
    });
    if (res.ok) {
      setMsg("Order updated!");
      loadOrders();
    }
    setTimeout(() => setMsg(""), 3000);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Delivery Management</h1>
      {msg && <div className="bg-green-50 text-green-700 p-3 rounded mb-4 text-sm">{msg}</div>}

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Ready for Dispatch ({orders.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Order</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Product</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Total</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{o.orderCode}</td>
                    <td className="px-4 py-3">{o.productName}</td>
                    <td className="px-4 py-3">{o.user.fullName}</td>
                    <td className="px-4 py-3">{parseFloat(o.totalCostVND).toLocaleString()} VND</td>
                    <td className="px-4 py-3">
                      <button onClick={() => updateDelivery(o.id, "OUT_FOR_DELIVERY")}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">
                        Dispatch
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No orders ready for dispatch</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Out for Delivery ({outForDelivery.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Order</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Product</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {outForDelivery.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{o.orderCode}</td>
                    <td className="px-4 py-3">{o.productName}</td>
                    <td className="px-4 py-3">{o.user.fullName}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3">
                      <button onClick={() => updateDelivery(o.id, "COMPLETED")}
                        className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">
                        Mark Delivered
                      </button>
                    </td>
                  </tr>
                ))}
                {outForDelivery.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No orders out for delivery</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
