"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import { useI18n } from "@/lib/i18n";

interface ChartData { date: string; count?: number; revenue?: number }

export default function AnalyticsPage() {
  const { t } = useI18n();
  const [ordersData, setOrdersData] = useState<ChartData[]>([]);
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/analytics/orders?days=${days}`).then((r) => r.json()),
      fetch(`/api/analytics/revenue?days=${days}`).then((r) => r.json()),
    ]).then(([o, r]) => {
      if (cancelled) return;
      setOrdersData(o.data || []);
      setRevenueData(r.data || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [days]);

  if (loading) return <LoadingSpinner text={t("analytics.loading")} />;

  const maxOrders = Math.max(...ordersData.map((d) => d.count || 0), 1);
  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue || 0), 1);
  const totalOrders = ordersData.reduce((sum, d) => sum + (d.count || 0), 0);
  const totalRevenue = revenueData.reduce((sum, d) => sum + (d.revenue || 0), 0);

  return (
    <div>
      <PageHeader
        title={t("analytics.title")}
        subtitle={t("analytics.subtitle")}
        action={
          <select value={days} onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
            <option value={7}>{t("analytics.last7Days")}</option>
            <option value={30}>{t("analytics.last30Days")}</option>
            <option value={90}>{t("analytics.last90Days")}</option>
          </select>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
          <p className="text-blue-200 text-sm font-medium">{t("admin.totalOrders")} ({days} {t("analytics.daysShort")})</p>
          <p className="text-3xl font-bold mt-1">{totalOrders}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white">
          <p className="text-emerald-200 text-sm font-medium">{t("admin.totalRevenue")} ({days} {t("analytics.daysShort")})</p>
          <p className="text-3xl font-bold mt-1">{totalRevenue.toLocaleString()} VND</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card title={t("analytics.ordersOverTime")}>
          {ordersData.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">{t("analytics.noData")}</p>
          ) : (
            <div className="space-y-3">
              {ordersData.map((d) => (
                <div key={d.date} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-20 font-medium">{d.date.slice(5)}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-3">
                    <div className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${((d.count || 0) / maxOrders) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-8 text-right">{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title={t("analytics.revenueOverTime")}>
          {revenueData.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">{t("analytics.noData")}</p>
          ) : (
            <div className="space-y-3">
              {revenueData.map((d) => (
                <div key={d.date} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-20 font-medium">{d.date.slice(5)}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-3">
                    <div className="bg-emerald-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${((d.revenue || 0) / maxRevenue) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-24 text-right">{(d.revenue || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
