"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { useI18n } from "@/lib/i18n";
import type { OrderStatus } from "@prisma/client";

interface AuditLogEntry {
  id: string;
  orderId: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  note: string | null;
  createdAt: string;
  order: { orderCode: string; productName: string };
  changer: { fullName: string; email: string; role: string };
}

export default function AdminAuditLogPage() {
  const { t } = useI18n();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/audit-log?page=${page}&limit=20`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setLogs(d.logs || []);
          setTotalPages(d.totalPages || 1);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page]);

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString();
  }

  if (loading) return <LoadingSpinner text={t("common.loading")} />;

  return (
    <div>
      <PageHeader title={t("audit.title")} subtitle={t("audit.subtitle")} />

      <Card noPadding>
        {logs.length === 0 ? (
          <EmptyState title={t("audit.empty")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("audit.time")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("audit.actor")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("audit.role")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("audit.order")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("audit.from")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("audit.to")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("audit.note")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 text-sm text-slate-600 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-900">
                      <div>{log.changer.fullName}</div>
                      <div className="text-xs text-slate-400">{log.changer.email}</div>
                    </td>
                    <td className="px-6 py-3.5 text-sm">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{log.changer.role}</span>
                    </td>
                    <td className="px-6 py-3.5 text-sm">
                      <div className="font-medium text-slate-900">{log.order.orderCode}</div>
                      <div className="text-xs text-slate-400">{log.order.productName}</div>
                    </td>
                    <td className="px-6 py-3.5 text-sm">
                      {log.fromStatus ? <StatusBadge status={log.fromStatus as OrderStatus} /> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-3.5 text-sm">
                      <StatusBadge status={log.toStatus as OrderStatus} />
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-500 max-w-[200px] truncate">{log.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
