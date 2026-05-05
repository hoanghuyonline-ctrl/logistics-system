"use client";

import { useEffect, useState } from "react";
import KPICard from "@/components/ui/KPICard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface DashboardData {
  totalOrders: number;
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  pendingOrders: number;
  inTransitOrders: number;
  totalCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
  estimatedProfit: number;
  statusDistribution: Array<{ status: string; count: number }>;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading || !data) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard title="Total Orders" value={data.totalOrders} subtitle={`Today: ${data.ordersToday}`} color="blue" />
        <KPICard title="Pending Orders" value={data.pendingOrders} subtitle="Awaiting action" color="yellow" />
        <KPICard title="In Transit" value={data.inTransitOrders} color="cyan" />
        <KPICard title="Active Customers" value={data.activeCustomers} subtitle={`of ${data.totalCustomers} total`} color="green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <KPICard title="Total Revenue" value={`${data.totalRevenue.toLocaleString()} VND`} color="green" />
        <KPICard title="Estimated Profit" value={`${data.estimatedProfit.toLocaleString()} VND`} color="purple" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold mb-4">Order Status Distribution</h3>
          <div className="space-y-3">
            {data.statusDistribution.map((s) => (
              <div key={s.status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{s.status.replace(/_/g, " ")}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min((s.count / data.totalOrders) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{s.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Orders This Week:</dt>
              <dd className="font-medium">{data.ordersThisWeek}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Orders This Month:</dt>
              <dd className="font-medium">{data.ordersThisMonth}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Total Customers:</dt>
              <dd className="font-medium">{data.totalCustomers}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
