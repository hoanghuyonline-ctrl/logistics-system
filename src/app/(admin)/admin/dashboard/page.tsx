"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";
import { useAdminPolling, type QuickViewCounts } from "@/lib/useAdminPolling";
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

interface QuickViewData {
  unpaidOrders: number;
  stuckChina: number;
  stuckVietnam: number;
  staleOrders: number;
  unresolvedIssues: number;
  notifFailures: number;
  unansweredQuestions: number;
  unresolvedNotes: number;
  pendingDeposits: number;
}

export default function AdminDashboard() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [quickViews, setQuickViews] = useState<QuickViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const handlePollUpdate = useCallback((qv: QuickViewCounts) => {
    setQuickViews(qv);
    setLastRefreshed(new Date());
  }, []);

  const handleAlerts = useCallback((alerts: Array<{ label: string; prev: number; next: number }>) => {
    for (const a of alerts) {
      const diff = a.next - a.prev;
      toast(`${a.label} (+${diff})`, "warning");
    }
  }, [toast]);

  const { seedPrev } = useAdminPolling(handlePollUpdate, handleAlerts, 25000);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics/dashboard").then((r) => r.json()),
      fetch("/api/admin/quick-views").then((r) => r.json()),
    ]).then(([d, qv]) => {
      setData(d);
      setQuickViews(qv);
      seedPrev(qv);
      setLoading(false);
    });
  }, [seedPrev]);

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

      {/* Quick operational views */}
      {quickViews && (
        <Card title="Truy cập nhanh" action={<span className="inline-flex items-center gap-1.5 text-[10px] font-normal text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />{lastRefreshed ? `Cập nhật ${lastRefreshed.toLocaleTimeString("vi-VN")}` : "Tự động cập nhật"}</span>}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
            {[
              { label: "Nạp tiền chờ xác nhận", count: quickViews.pendingDeposits, href: "/admin/finance", active: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100", accent: "text-emerald-700", icon: "💰", urgent: true },
              { label: "Đơn chờ xử lý", count: quickViews.unpaidOrders, href: "/admin/orders?status=PENDING", active: "bg-amber-50 border-amber-200 hover:bg-amber-100", accent: "text-amber-700", icon: "⏳", urgent: false },
              { label: "Kẹt kho TQ", count: quickViews.stuckChina, href: "/admin/stuck-shipments", active: "bg-red-50 border-red-200 hover:bg-red-100", accent: "text-red-700", icon: "🏭", urgent: true },
              { label: "Kẹt kho VN", count: quickViews.stuckVietnam, href: "/admin/stuck-shipments", active: "bg-orange-50 border-orange-200 hover:bg-orange-100", accent: "text-orange-700", icon: "🏠", urgent: true },
              { label: "Đơn chậm cập nhật", count: quickViews.staleOrders, href: "/admin/stuck-shipments", active: "bg-red-50 border-red-200 hover:bg-red-100", accent: "text-red-700", icon: "🐌", urgent: true },
              { label: "Khiếu nại chưa xử lý", count: quickViews.unresolvedIssues, href: "/admin/customer-issues?status=NEW", active: "bg-rose-50 border-rose-200 hover:bg-rose-100", accent: "text-rose-700", icon: "📋", urgent: true },
              { label: "Lỗi thông báo", count: quickViews.notifFailures, href: "/admin/notification-failures", active: "bg-red-50 border-red-200 hover:bg-red-100", accent: "text-red-700", icon: "🔔", urgent: true },
              { label: "Chatbot chưa trả lời", count: quickViews.unansweredQuestions, href: "/admin/support-knowledge", active: "bg-purple-50 border-purple-200 hover:bg-purple-100", accent: "text-purple-700", icon: "💬", urgent: true },
              { label: "Ghi chú bàn giao", count: quickViews.unresolvedNotes, href: "/admin/staff-notes", active: "bg-blue-50 border-blue-200 hover:bg-blue-100", accent: "text-blue-700", icon: "🔖", urgent: false },
            ].map((view) => {
              const hasItems = view.count > 0;
              const needsAttention = hasItems && view.urgent;
              return (
                <a
                  key={view.label}
                  href={view.href}
                  className={`relative flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    hasItems
                      ? view.active
                      : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                  }`}
                >
                  {needsAttention && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                        {view.count}
                      </span>
                    </span>
                  )}
                  <span className="text-lg">{view.icon}</span>
                  <div className="min-w-0">
                    <div className={`text-lg font-bold ${hasItems ? view.accent : "text-slate-400"}`}>
                      {view.count}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight">{view.label}</div>
                    {needsAttention && (
                      <div className="text-[10px] font-semibold text-red-600 mt-0.5">Cần xử lý</div>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
          {(quickViews.pendingDeposits > 0 || quickViews.notifFailures > 0 || quickViews.unresolvedIssues > 0 || quickViews.unansweredQuestions > 0 || quickViews.stuckChina > 0 || quickViews.stuckVietnam > 0 || quickViews.staleOrders > 0) && (
            <p className="text-xs text-red-600 mt-2">⚠️ Có mục cần xử lý — vui lòng kiểm tra các mục đánh dấu đỏ phía trên.</p>
          )}
        </Card>
      )}

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
