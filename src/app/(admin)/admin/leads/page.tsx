"use client";

import { useCallback, useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";

interface Lead {
  id: string;
  fullName: string;
  phone: string | null;
  zaloName: string | null;
  source: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: "Chưa xử lý",
  CONTACTED: "Đã liên hệ",
  INTERESTED: "Khách tiềm năng",
  CONVERTED: "Đã chuyển đổi",
  LOST: "Không quan tâm",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200",
  CONTACTED: "bg-amber-50 text-amber-700 border-amber-200",
  INTERESTED: "bg-purple-50 text-purple-700 border-purple-200",
  CONVERTED: "bg-green-50 text-green-700 border-green-200",
  LOST: "bg-red-50 text-red-700 border-red-200",
};

const SOURCE_LABELS: Record<string, string> = {
  ZALO: "Zalo",
  FACEBOOK: "Facebook",
  WEBSITE: "Website",
  REFERRAL: "Giới thiệu",
  OTHER: "Khác",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

export default function AdminLeadsPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("NEW");
  const [sourceFilter, setSourceFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: "1", limit: "50" });
      if (statusFilter) params.set("status", statusFilter);
      if (sourceFilter) params.set("source", sourceFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/leads?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads);
      }
    } catch {
      toast("Không thể tải danh sách leads", "error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sourceFilter, search, toast]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  async function handleQuickStatus(leadId: string, newStatus: string) {
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: updated.status } : l));
        toast(`Đã chuyển → ${STATUS_LABELS[newStatus] || newStatus}`, "success");
      }
    } catch {
      toast("Lỗi cập nhật", "error");
    }
  }

  if (loading) return <LoadingSpinner text={t("common.loading")} />;

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Leads — Khách hàng tiềm năng"
        subtitle="Quản lý leads từ Facebook, Zalo, Website"
        action={
          <Link
            href="/admin/crm"
            className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            📊 CRM đầy đủ
          </Link>
        }
      />

      {/* Quick status filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { value: "", label: "Tất cả" },
          { value: "NEW", label: "Chưa xử lý" },
          { value: "CONTACTED", label: "Đã liên hệ" },
          { value: "INTERESTED", label: "Khách tiềm năng" },
        ].map((chip) => (
          <button
            key={chip.value}
            onClick={() => { setStatusFilter(chip.value); setLoading(true); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              statusFilter === chip.value
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Source filter + search */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setLoading(true); }}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
        >
          <option value="">Tất cả nguồn</option>
          <option value="FACEBOOK">Facebook</option>
          <option value="ZALO">Zalo</option>
          <option value="WEBSITE">Website</option>
          <option value="REFERRAL">Giới thiệu</option>
          <option value="OTHER">Khác</option>
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { setLoading(true); fetchLeads(); } }}
          placeholder="Tìm tên, SĐT, email..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
        />
      </div>

      {/* Leads list */}
      {leads.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-slate-400 text-sm">
            Không có lead nào
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <Card key={lead.id}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-900">{lead.fullName}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${STATUS_COLORS[lead.status] || "bg-slate-50 text-slate-600"}`}>
                      {STATUS_LABELS[lead.status] || lead.status}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-500">
                      {SOURCE_LABELS[lead.source] || lead.source}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    {lead.phone && <span>📞 {lead.phone}</span>}
                    {lead.zaloName && <span>💬 {lead.zaloName}</span>}
                    <span>⏰ {timeAgo(lead.createdAt)}</span>
                  </div>
                  {lead.notes && (
                    <p className="mt-1 text-xs text-slate-400 truncate max-w-md">📝 {lead.notes}</p>
                  )}
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {lead.status !== "CONTACTED" && (
                    <button
                      onClick={() => handleQuickStatus(lead.id, "CONTACTED")}
                      className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                    >
                      📞 Đã liên hệ
                    </button>
                  )}
                  {lead.status !== "INTERESTED" && (
                    <button
                      onClick={() => handleQuickStatus(lead.id, "INTERESTED")}
                      className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                    >
                      ⭐ Tiềm năng
                    </button>
                  )}
                  {lead.status === "NEW" && (
                    <button
                      onClick={() => handleQuickStatus(lead.id, "LOST")}
                      className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Link to full CRM */}
      <div className="mt-6 text-center">
        <Link
          href="/admin/crm"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Xem CRM đầy đủ (chuyển đổi, phân công, lịch chăm sóc) →
        </Link>
      </div>
    </div>
  );
}
