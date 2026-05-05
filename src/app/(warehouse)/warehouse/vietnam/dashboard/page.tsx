"use client";

import { useEffect, useState } from "react";
import KPICard from "@/components/ui/KPICard";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
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

  useEffect(() => {
    Promise.all([
      fetch("/api/orders?status=SHIPPING_TO_VIETNAM&limit=20").then((r) => r.json()),
      fetch("/api/orders?status=ARRIVED_VIETNAM_WH&limit=20").then((r) => r.json()),
    ]).then(([shipping, arrived]) => {
      setArrivedOrders(shipping.orders || []);
      setDeliveryOrders(arrived.orders || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Vietnam Warehouse Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <KPICard title="Incoming Shipments" value={arrivedOrders.length} color="cyan" />
        <KPICard title="Ready for Delivery" value={deliveryOrders.length} color="green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b"><h2 className="text-lg font-semibold">Incoming Shipments</h2></div>
          <div className="divide-y">
            {arrivedOrders.map((o) => (
              <div key={o.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{o.orderCode}</p>
                  <p className="text-xs text-gray-500">{o.productName} - {o.user.fullName}</p>
                </div>
                <StatusBadge status={o.status} />
              </div>
            ))}
            {arrivedOrders.length === 0 && <p className="px-6 py-4 text-sm text-gray-500">No incoming shipments</p>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b"><h2 className="text-lg font-semibold">Ready for Delivery</h2></div>
          <div className="divide-y">
            {deliveryOrders.map((o) => (
              <div key={o.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{o.orderCode}</p>
                  <p className="text-xs text-gray-500">{o.productName} - {o.user.fullName}</p>
                </div>
                <StatusBadge status={o.status} />
              </div>
            ))}
            {deliveryOrders.length === 0 && <p className="px-6 py-4 text-sm text-gray-500">No orders ready for delivery</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
