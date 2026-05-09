"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import KPICard from "@/components/ui/KPICard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

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
  const { t } = useI18n();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading || !data) return <LoadingSpinner text={t("common.loading")} />;

  return (
    <div>
      <PageHeader title={t("admin.dashboard")} subtitle={t("common.tagline")} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <KPICard title={t("admin.totalOrders")} value={data.totalOrders} subtitle={`${t("admin.today")}: ${data.ordersToday}`} icon={<span>📦</span>} color="blue" />
        <KPICard title={t("dashboard.pendingOrders")} value={data.pendingOrders} subtitle={t("admin.awaitingAction")} icon={<span>⏳</span>} color="yellow" />
        <KPICard title={t("admin.inTransit")} value={data.inTransitOrders} icon={<span>✈️</span>} color="cyan" />
        <KPICard title={t("admin.activeCustomers")} value={data.activeCustomers} subtitle={`${t("admin.of")} ${data.totalCustomers} ${t("admin.totalLower")}`} icon={<span>👥</span>} color="green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <KPICard title={t("admin.totalRevenue")} value={`${data.totalRevenue.toLocaleString()} VND`} icon={<span>💰</span>} color="green" />
        <KPICard title={t("admin.totalProfit")} value={`${data.estimatedProfit.toLocaleString()} VND`} icon={<span>📈</span>} color="purple" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title={t("admin.orderStatusDistribution")}>
          <div className="space-y-4">
            {data.statusDistribution.map((s) => {
              const pct = data.totalOrders > 0 ? (s.count / data.totalOrders) * 100 : 0;
              const label = t(`status.${s.status}`, s.status.replace(/_/g, " "));
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

        <Card title={t("admin.quickStats")}>
          <dl className="space-y-4">
            {[
              { label: t("admin.ordersThisWeek"), value: data.ordersThisWeek },
              { label: t("admin.ordersThisMonth"), value: data.ordersThisMonth },
              { label: t("admin.totalCustomers"), value: data.totalCustomers },
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
