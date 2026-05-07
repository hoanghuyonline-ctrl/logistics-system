"use client";

import { useEffect, useState } from "react";
import KPICard from "@/components/ui/KPICard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { STATUS_LABELS } from "@/types";

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

  if (loading || !data) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Overview of your logistics operations" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <KPICard title="Total Orders" value={data.totalOrders} subtitle={`Today: ${data.ordersToday}`} icon={<span>📦</span>} color="blue" />
        <KPICard title="Pending Orders" value={data.pendingOrders} subtitle="Awaiting action" icon={<span>⏳</span>} color="yellow" />
        <KPICard title="In Transit" value={data.inTransitOrders} icon={<span>✈️</span>} color="cyan" />
        <KPICard title="Active Customers" value={data.activeCustomers} subtitle={`of ${data.totalCustomers} total`} icon={<span>👥</span>} color="green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <KPICard title="Total Revenue" value={`${data.totalRevenue.toLocaleString()} VND`} icon={<span>💰</span>} color="green" />
        <KPICard title="Estimated Profit" value={`${data.estimatedProfit.toLocaleString()} VND`} icon={<span>📈</span>} color="purple" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Order Status Distribution">
          <div className="space-y-4">
            {data.statusDistribution.map((s) => {
              const pct = data.totalOrders > 0 ? (s.count / data.totalOrders) * 100 : 0;
              const label = STATUS_LABELS[s.status as keyof typeof STATUS_LABELS] || s.status.replace(/_/g, " ");
              return (
                <div key={s.status}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-600">{label}</span>
                    <span className="text-sm font-semibold text-slate-900">{s.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Quick Stats">
          <dl className="space-y-4">
            {[
              { label: "Orders This Week", value: data.ordersThisWeek },
              { label: "Orders This Month", value: data.ordersThisMonth },
              { label: "Total Customers", value: data.totalCustomers },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <dt className="text-sm text-slate-500">{item.label}</dt>
                <dd className="text-lg font-bold text-slate-900">{item.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  );
}
