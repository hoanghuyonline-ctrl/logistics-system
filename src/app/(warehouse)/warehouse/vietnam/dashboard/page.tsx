"use client";

import { useEffect, useState } from "react";
import KPICard from "@/components/ui/KPICard";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { OrderStatus } from "@prisma/client";

interface Order {
  id: string;
  orderCode: string;
  productName: string;
  status: OrderStatus;
  user: { fullName: string };
}

export default function VietnamWarehouseDashboard() {
  const [arrivedOrders, setArrivedOrders] = useState<Order[]>([]);
  const [deliveryOrders, setDeliveryOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/orders?status=SHIPPING_TO_VIETNAM&limit=20").then((r) => { if (!r.ok) throw new Error("API error"); return r.json(); }),
      fetch("/api/orders?status=ARRIVED_VIETNAM_WH&limit=20").then((r) => { if (!r.ok) throw new Error("API error"); return r.json(); }),
    ]).then(([shipping, arrived]) => {
      setArrivedOrders(shipping.orders || []);
      setDeliveryOrders(arrived.orders || []);
      setLoading(false);
    }).catch((err) => {
      console.error("[warehouse/vietnam] load failed:", err);
      setError(true);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;
  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <span className="text-4xl">⚠️</span>
      <p className="text-sm text-slate-600">Không thể tải dữ liệu. Vui lòng thử lại.</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Tải lại</button>
    </div>
  );

  return (
    <div>
      <PageHeader title="Vietnam Warehouse Dashboard" subtitle="Manage arrivals and deliveries" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <KPICard title="Incoming Shipments" value={arrivedOrders.length} subtitle="In transit from China" icon={<span>🚢</span>} color="cyan" />
        <KPICard title="Ready for Delivery" value={deliveryOrders.length} subtitle="Awaiting dispatch" icon={<span>🚚</span>} color="green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Incoming Shipments" noPadding>
          <div className="divide-y divide-slate-50">
            {arrivedOrders.map((o) => (
              <div key={o.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{o.orderCode}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{o.productName} — {o.user.fullName}</p>
                </div>
                <StatusBadge status={o.status} />
              </div>
            ))}
            {arrivedOrders.length === 0 && (
              <div className="px-6 py-12 text-center">
                <span className="text-2xl">🚢</span>
                <p className="text-sm text-slate-500 mt-2">No incoming shipments</p>
              </div>
            )}
          </div>
        </Card>

        <Card title="Ready for Delivery" noPadding>
          <div className="divide-y divide-slate-50">
            {deliveryOrders.map((o) => (
              <div key={o.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{o.orderCode}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{o.productName} — {o.user.fullName}</p>
                </div>
                <StatusBadge status={o.status} />
              </div>
            ))}
            {deliveryOrders.length === 0 && (
              <div className="px-6 py-12 text-center">
                <span className="text-2xl">📦</span>
                <p className="text-sm text-slate-500 mt-2">No orders ready for delivery</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
