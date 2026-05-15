"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n";

interface SummaryData {
  leads: {
    total: number;
    converted: number;
    conversionRate: number;
    bySource: Record<string, number>;
    followUpOverdue: number;
  };
  support: {
    openTickets: number;
    byPriority: Record<string, number>;
  };
  campaigns: {
    total: number;
    byStatus: Record<string, number>;
  };
}

const SOURCE_LABELS: Record<string, string> = {
  ZALO: "Zalo",
  FACEBOOK: "Facebook",
  WEBSITE: "Website",
  REFERRAL: "Giới thiệu",
  OTHER: "Khác",
};

const SOURCE_COLORS: Record<string, string> = {
  ZALO: "bg-blue-500",
  FACEBOOK: "bg-indigo-500",
  WEBSITE: "bg-teal-500",
  REFERRAL: "bg-amber-500",
  OTHER: "bg-slate-400",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Thấp",
  NORMAL: "Bình thường",
  HIGH: "Cao",
  URGENT: "Khẩn cấp",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-400",
  NORMAL: "bg-blue-400",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500",
};

const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Nháp",
  SCHEDULED: "Đã lên lịch",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export default function AnalyticsSummaryPage() {
  const { t } = useI18n();
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics/summary")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return <div className="text-center py-12 text-slate-400">Không thể tải dữ liệu</div>;

  return (
    <div className="space-y-6">
      <PageHeader title={t("analytics.summaryTitle", "Tổng quan CRM / Marketing / Hỗ trợ")} />

      {/* CRM Leads */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Tổng leads" value={data.leads.total} color="blue" />
        <StatCard label="Đã chuyển đổi" value={data.leads.converted} sub={`${data.leads.conversionRate}%`} color="green" />
        <StatCard label="Follow-up quá hạn" value={data.leads.followUpOverdue} color={data.leads.followUpOverdue > 0 ? "red" : "slate"} />
        <StatCard label="Ticket mở" value={data.support.openTickets} color={data.support.openTickets > 0 ? "orange" : "slate"} />
      </div>

      {/* Leads by source */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">{t("analytics.leadsBySource", "Leads theo nguồn")}</h3>
        {Object.keys(data.leads.bySource).length === 0 ? (
          <p className="text-xs text-slate-400">Chưa có dữ liệu</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(data.leads.bySource)
              .sort(([, a], [, b]) => b - a)
              .map(([source, count]) => {
                const pct = data.leads.total > 0 ? Math.round((count / data.leads.total) * 100) : 0;
                return (
                  <div key={source} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-20">{SOURCE_LABELS[source] || source}</span>
                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${SOURCE_COLORS[source] || "bg-slate-400"}`} style={{ width: `${Math.max(pct, 2)}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-700 w-16 text-right">{count} ({pct}%)</span>
                  </div>
                );
              })}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Support by priority */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">{t("analytics.ticketsByPriority", "Ticket mở theo độ ưu tiên")}</h3>
          {Object.keys(data.support.byPriority).length === 0 ? (
            <p className="text-xs text-slate-400">Không có ticket mở</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(data.support.byPriority)
                .sort(([a], [b]) => {
                  const order = ["URGENT", "HIGH", "NORMAL", "LOW"];
                  return order.indexOf(a) - order.indexOf(b);
                })
                .map(([priority, count]) => (
                  <div key={priority} className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${PRIORITY_COLORS[priority] || "bg-slate-400"}`} />
                    <span className="text-xs text-slate-600 flex-1">{PRIORITY_LABELS[priority] || priority}</span>
                    <span className="text-sm font-semibold text-slate-800">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </Card>

        {/* Campaigns by status */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">{t("analytics.campaignsByStatus", "Chiến dịch theo trạng thái")}</h3>
          {data.campaigns.total === 0 ? (
            <p className="text-xs text-slate-400">Chưa có chiến dịch</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(data.campaigns.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 flex-1">{CAMPAIGN_STATUS_LABELS[status] || status}</span>
                  <span className="text-sm font-semibold text-slate-800">{count}</span>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-2 flex items-center gap-3">
                <span className="text-xs font-medium text-slate-700 flex-1">Tổng</span>
                <span className="text-sm font-bold text-slate-800">{data.campaigns.total}</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    slate: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] || colorMap.slate}`}>
      <div className="text-2xl font-bold">{value}{sub && <span className="text-sm font-medium ml-1">({sub})</span>}</div>
      <div className="text-xs mt-1 opacity-80">{label}</div>
    </div>
  );
}
