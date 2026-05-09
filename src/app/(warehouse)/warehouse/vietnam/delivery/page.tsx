"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
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
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [outForDelivery, setOutForDelivery] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
      toast("Order updated successfully!", "success");
      loadOrders();
    } else {
      toast("Failed to update order", "error");
    }
  }

  if (loading) return <LoadingSpinner text="Loading delivery queue..." />;

  return (
    <div>
      <PageHeader title="Delivery Management" subtitle="Dispatch and complete deliveries" />

      <div className="space-y-6">
        <Card title={`Ready for Dispatch (${orders.length})`} noPadding>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{o.orderCode}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{o.productName}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{o.user.fullName}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{parseFloat(o.totalCostVND).toLocaleString()} VND</td>
                    <td className="px-6 py-4">
                      <button onClick={() => updateDelivery(o.id, "OUT_FOR_DELIVERY")}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                        Dispatch
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <span className="text-2xl">📦</span>
                      <p className="text-sm text-slate-500 mt-2">No orders ready for dispatch</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title={`Out for Delivery (${outForDelivery.length})`} noPadding>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {outForDelivery.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{o.orderCode}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{o.productName}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{o.user.fullName}</td>
                    <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                    <td className="px-6 py-4">
                      <button onClick={() => updateDelivery(o.id, "COMPLETED")}
                        className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm">
                        Complete
                      </button>
                    </td>
                  </tr>
                ))}
                {outForDelivery.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <span className="text-2xl">🚚</span>
                      <p className="text-sm text-slate-500 mt-2">No orders currently out for delivery</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
