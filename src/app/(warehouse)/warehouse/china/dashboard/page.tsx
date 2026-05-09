"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import KPICard from "@/components/ui/KPICard";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { OrderStatus } from "@prisma/client";

interface Order {
  id: string;
  orderCode: string;
  productName: string;
  status: OrderStatus;
  createdAt: string;
  user: { fullName: string };
}

export default function ChinaWarehouseDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders?status=SELLER_SHIPPED&limit=20")
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders || []); setLoading(false); });
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div>
      <PageHeader title="China Warehouse Dashboard" subtitle="Manage incoming shipments and goods receipt" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <KPICard title="Awaiting Receipt" value={orders.length} subtitle="Orders to process" icon={<span>📦</span>} color="yellow" />
        <KPICard title="Quick Actions" value="→" subtitle="Receive goods or create packages" icon={<span>⚡</span>} color="blue" />
      </div>

      <Card title="Orders Awaiting Receipt" noPadding>
        {orders.length === 0 ? (
          <EmptyState icon="📦" title="No pending orders" description="All orders have been received" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{o.orderCode}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{o.user.fullName}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{o.productName}</td>
                    <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                    <td className="px-6 py-4">
                      <Link href="/warehouse/china/receive" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                        Receive →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
