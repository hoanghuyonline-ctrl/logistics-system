"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface ChartData { date: string; count?: number; revenue?: number }

export default function AnalyticsPage() {
  const [ordersData, setOrdersData] = useState<ChartData[]>([]);
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/analytics/orders?days=${days}`).then((r) => r.json()),
      fetch(`/api/analytics/revenue?days=${days}`).then((r) => r.json()),
    ]).then(([o, r]) => {
      setOrdersData(o.data || []);
      setRevenueData(r.data || []);
      setLoading(false);
    });
  }, [days]);

  if (loading) return <LoadingSpinner />;

  const maxOrders = Math.max(...ordersData.map((d) => d.count || 0), 1);
  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue || 0), 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <select value={days} onChange={(e) => setDays(parseInt(e.target.value))} className="px-3 py-2 border rounded-lg text-sm">
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card title="Orders Over Time">
          {ordersData.length === 0 ? (
            <p className="text-gray-500 text-sm">No data available</p>
          ) : (
            <div className="space-y-2">
              {ordersData.map((d) => (
                <div key={d.date} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20">{d.date.slice(5)}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4">
                    <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${((d.count || 0) / maxOrders) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium w-8 text-right">{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Revenue Over Time">
          {revenueData.length === 0 ? (
            <p className="text-gray-500 text-sm">No data available</p>
          ) : (
            <div className="space-y-2">
              {revenueData.map((d) => (
                <div key={d.date} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20">{d.date.slice(5)}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4">
                    <div className="bg-green-600 h-4 rounded-full" style={{ width: `${((d.revenue || 0) / maxRevenue) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium w-24 text-right">{(d.revenue || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
