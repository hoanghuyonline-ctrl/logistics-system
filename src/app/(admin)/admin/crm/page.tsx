"use client";

import { useCallback, useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";

interface Lead {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  zaloName: string | null;
  facebookName: string | null;
  zaloSenderId: string | null;
  facebookSenderId: string | null;
  source: string;
  status: string;
  isAutoCreated: boolean;
  notes: string | null;
  assignedToId: string | null;
  convertedUserId: string | null;
  createdAt: string;
  updatedAt: string;
  nextFollowUpAt: string | null;
  lastContactedAt: string | null;
  followUpNote: string | null;
  assignedTo: { id: string; fullName: string } | null;
  convertedUser: { id: string; fullName: string; email: string } | null;
}

interface CrmStats {
  total: number;
  newCount: number;
  convertedCount: number;
  todayCount: number;
  followUpTodayCount: number;
  overdueCount: number;
  conversionRate: number;
}

interface AdminUser {
  id: string;
  fullName: string;
}

const SOURCE_OPTIONS = ["ZALO", "FACEBOOK", "WEBSITE", "REFERRAL", "OTHER"];
const STATUS_OPTIONS = ["NEW", "CONTACTED", "INTERESTED", "CONVERTED", "LOST"];

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700",
  CONTACTED: "bg-amber-50 text-amber-700",
  INTERESTED: "bg-purple-50 text-purple-700",
  CONVERTED: "bg-green-50 text-green-700",
  LOST: "bg-red-50 text-red-700",
};

const SOURCE_COLORS: Record<string, string> = {
  ZALO: "bg-blue-50 text-blue-700",
  FACEBOOK: "bg-indigo-50 text-indigo-700",
  WEBSITE: "bg-teal-50 text-teal-700",
  REFERRAL: "bg-amber-50 text-amber-700",
  OTHER: "bg-slate-50 text-slate-600",
};

export default function CrmPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [followUpFilter, setFollowUpFilter] = useState("");
  const [sortMode, setSortMode] = useState("");
  const [stats, setStats] = useState<CrmStats | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: "", phone: "", email: "", zaloName: "", facebookName: "",
    source: "OTHER", notes: "", assignedToId: "",
  });
  const [creating, setCreating] = useState(false);

  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editFollowUpNote, setEditFollowUpNote] = useState("");

  const [followUpLead, setFollowUpLead] = useState<Lead | null>(null);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNoteInput, setFollowUpNoteInput] = useState("");

  const [convertLead, setConvertLead] = useState<Lead | null>(null);
  const [convertMode, setConvertMode] = useState<"existing" | "new">("new");
  const [convertEmail, setConvertEmail] = useState("");
  const [convertPassword, setConvertPassword] = useState("");
  const [convertExistingId, setConvertExistingId] = useState("");
  const [converting, setConverting] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (sourceFilter) params.set("source", sourceFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (followUpFilter) params.set("followUp", followUpFilter);
      if (sortMode) params.set("sort", sortMode);
      const res = await fetch(`/api/admin/leads?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads);
        setTotalPages(data.totalPages);
      }
    } catch {
      toast(t("crm.fetchError", "Không thể tải danh sách leads"), "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, sourceFilter, statusFilter, followUpFilter, sortMode, t, toast]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/leads?mode=stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetch("/api/users?role=ADMIN&limit=100")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.users) {
          setAdminUsers(
            d.users.map((u: { id: string; fullName: string }) => ({ id: u.id, fullName: u.fullName }))
          );
        }
      })
      .catch(() => {});
    fetchStats();
  }, [fetchStats]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  async function handleCreate() {
    if (!createForm.fullName.trim()) {
      toast(t("crm.nameRequired", "Họ tên là bắt buộc"), "error");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          assignedToId: createForm.assignedToId || undefined,
        }),
      });
      if (res.ok) {
        toast(t("crm.created", "Đã tạo lead mới"), "success");
        setShowCreate(false);
        setCreateForm({ fullName: "", phone: "", email: "", zaloName: "", facebookName: "", source: "OTHER", notes: "", assignedToId: "" });
        setPage(1);
        fetchLeads();
        fetchStats();
      } else {
        const data = await res.json();
        toast(data.error || "Lỗi", "error");
      }
    } catch {
      toast("Mất kết nối", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(leadId: string, newStatus: string) {
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLeads((prev) => prev.map((l) => l.id === leadId ? updated : l));
        fetchStats();
        toast(t("crm.statusUpdated", "Đã cập nhật trạng thái"), "success");
      }
    } catch {
      toast("Lỗi cập nhật", "error");
    }
  }

  async function handleAssign(leadId: string, assignedToId: string) {
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, assignedToId: assignedToId || null }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLeads((prev) => prev.map((l) => l.id === leadId ? updated : l));
        toast(t("crm.assigned", "Đã phân công"), "success");
      }
    } catch {
      toast("Lỗi phân công", "error");
    }
  }

  async function handleSaveNotes(leadId: string) {
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, notes: editNotes, followUpNote: editFollowUpNote }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLeads((prev) => prev.map((l) => l.id === leadId ? updated : l));
        setEditingLead(null);
        toast(t("crm.notesSaved", "Đã lưu ghi chú"), "success");
      }
    } catch {
      toast("Lỗi lưu ghi chú", "error");
    }
  }

  async function handleMarkContacted(leadId: string) {
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, lastContactedAt: new Date().toISOString(), status: "CONTACTED" }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLeads((prev) => prev.map((l) => l.id === leadId ? updated : l));
        fetchStats();
        toast(t("crm.markedContacted", "Đã đánh dấu liên hệ"), "success");
      }
    } catch {
      toast("Lỗi cập nhật", "error");
    }
  }

  async function handleSaveFollowUp() {
    if (!followUpLead) return;
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: followUpLead.id,
          nextFollowUpAt: followUpDate || null,
          followUpNote: followUpNoteInput || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLeads((prev) => prev.map((l) => l.id === followUpLead.id ? updated : l));
        setFollowUpLead(null);
        fetchStats();
        toast(t("crm.followUpSaved", "Đã lưu lịch chăm sóc"), "success");
      }
    } catch {
      toast("Lỗi cập nhật", "error");
    }
  }

  async function handleConvert() {
    if (!convertLead) return;
    setConverting(true);
    try {
      const payload: Record<string, unknown> = { leadId: convertLead.id };
      if (convertMode === "existing") {
        payload.existingUserId = convertExistingId;
      } else {
        payload.createAccount = true;
        payload.email = convertEmail;
        payload.password = convertPassword;
      }
      const res = await fetch("/api/admin/leads/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setLeads((prev) => prev.map((l) => l.id === convertLead.id ? updated : l));
        setConvertLead(null);
        setConvertEmail("");
        setConvertPassword("");
        setConvertExistingId("");
        fetchStats();
        toast(t("crm.converted", "Đã chuyển đổi thành khách hàng"), "success");
      } else {
        const data = await res.json();
        toast(data.error || "Lỗi chuyển đổi", "error");
      }
    } catch {
      toast("Mất kết nối", "error");
    } finally {
      setConverting(false);
    }
  }

  if (loading) return <LoadingSpinner text={t("common.loading")} />;

  return (
    <div className="max-w-6xl">
      <PageHeader
        title={t("crm.title", "Quản lý khách hàng tiềm năng (CRM)")}
        subtitle={t("crm.subtitle", "Theo dõi leads, chuyển đổi khách hàng, quản lý nguồn tiếp cận")}
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            + {t("crm.addLead", "Thêm lead")}
          </button>
        }
      />

      {/* Stats widgets */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <div className="text-center py-2">
              <p className="text-2xl font-bold text-blue-600">{stats.todayCount}</p>
              <p className="text-xs text-slate-500 mt-1">{t("crm.todayLeads", "Leads hôm nay")}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center py-2">
              <p className="text-2xl font-bold text-amber-600">{stats.newCount}</p>
              <p className="text-xs text-slate-500 mt-1">{t("crm.newLeads", "Leads mới")}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center py-2">
              <p className="text-2xl font-bold text-green-600">{stats.convertedCount}</p>
              <p className="text-xs text-slate-500 mt-1">{t("crm.convertedLeads", "Đã chuyển đổi")}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center py-2">
              <p className="text-2xl font-bold text-purple-600">{stats.conversionRate}%</p>
              <p className="text-xs text-slate-500 mt-1">{t("crm.conversionRate", "Tỉ lệ chuyển đổi")}</p>
            </div>
          </Card>
          <button onClick={() => { setFollowUpFilter(followUpFilter === "today" ? "" : "today"); setPage(1); }}>
            <Card>
              <div className="text-center py-2">
                <p className={`text-2xl font-bold ${followUpFilter === "today" ? "text-white" : "text-orange-600"}`}>{stats.followUpTodayCount}</p>
                <p className={`text-xs mt-1 ${followUpFilter === "today" ? "text-orange-100" : "text-slate-500"}`}>{t("crm.followUpToday", "Chăm sóc hôm nay")}</p>
              </div>
            </Card>
          </button>
          <button onClick={() => { setFollowUpFilter(followUpFilter === "overdue" ? "" : "overdue"); setPage(1); }}>
            <Card>
              <div className={`text-center py-2 rounded-xl ${followUpFilter === "overdue" ? "bg-red-600" : stats.overdueCount > 0 ? "bg-red-50" : ""}`}>
                <p className={`text-2xl font-bold ${followUpFilter === "overdue" ? "text-white" : "text-red-600"}`}>{stats.overdueCount}</p>
                <p className={`text-xs mt-1 ${followUpFilter === "overdue" ? "text-red-100" : stats.overdueCount > 0 ? "text-red-600" : "text-slate-500"}`}>{t("crm.overdueFollowUp", "Quá hạn chăm sóc")}</p>
              </div>
            </Card>
          </button>
        </div>
      )}

      {/* Create lead form */}
      {showCreate && (
        <Card>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-800">{t("crm.newLead", "Tạo lead mới")}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <input
              type="text"
              placeholder={t("crm.fullName", "Họ tên *")}
              value={createForm.fullName}
              onChange={(e) => setCreateForm((p) => ({ ...p, fullName: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder={t("crm.phone", "Số điện thoại")}
              value={createForm.phone}
              onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={createForm.email}
              onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder={t("crm.zaloName", "Tên Zalo")}
              value={createForm.zaloName}
              onChange={(e) => setCreateForm((p) => ({ ...p, zaloName: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder={t("crm.facebookName", "Tên Facebook")}
              value={createForm.facebookName}
              onChange={(e) => setCreateForm((p) => ({ ...p, facebookName: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={createForm.source}
              onChange={(e) => setCreateForm((p) => ({ ...p, source: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              {SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>{t(`crm.source.${s}`, s)}</option>
              ))}
            </select>
            <select
              value={createForm.assignedToId}
              onChange={(e) => setCreateForm((p) => ({ ...p, assignedToId: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t("crm.unassigned", "Chưa phân công")}</option>
              {adminUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
          </div>
          <textarea
            placeholder={t("crm.notes", "Ghi chú...")}
            value={createForm.notes}
            onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 mb-3"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {creating ? t("common.loading") : t("crm.createLead", "Tạo lead")}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 border border-slate-300 text-sm rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {t("common.cancel")}
            </button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder={t("crm.searchPlaceholder", "Tìm theo tên, SĐT, email...")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="">{t("crm.allSources", "Tất cả nguồn")}</option>
            {SOURCE_OPTIONS.map((s) => (
              <option key={s} value={s}>{t(`crm.source.${s}`, s)}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="">{t("crm.allStatuses", "Tất cả trạng thái")}</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{t(`crm.status.${s}`, s)}</option>
            ))}
          </select>
          <select
            value={sortMode}
            onChange={(e) => { setSortMode(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="">{t("crm.sortNewest", "Mới nhất")}</option>
            <option value="activity">{t("crm.sortActivity", "Hoạt động gần nhất")}</option>
          </select>
        </div>

        {/* Lead table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500 uppercase">
                <th className="py-3 px-2">{t("crm.name", "Họ tên")}</th>
                <th className="py-3 px-2">{t("crm.contact", "Liên hệ")}</th>
                <th className="py-3 px-2">{t("crm.sourceLabel", "Nguồn")}</th>
                <th className="py-3 px-2">{t("common.status")}</th>
                <th className="py-3 px-2">{t("crm.followUp", "Chăm sóc")}</th>
                <th className="py-3 px-2">{t("crm.assignee", "Phụ trách")}</th>
                <th className="py-3 px-2">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    {t("crm.noLeads", "Chưa có leads nào")}
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-slate-50 hover:bg-slate-25">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-slate-800">{lead.fullName}</p>
                        {lead.isAutoCreated && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                            {t("crm.autoCreated", "Tự động tạo")}
                          </span>
                        )}
                      </div>
                      {lead.zaloName && <p className="text-xs text-slate-400">Zalo: {lead.zaloName}</p>}
                      {lead.facebookName && <p className="text-xs text-slate-400">FB: {lead.facebookName}</p>}
                    </td>
                    <td className="py-3 px-2">
                      {lead.phone && <p className="text-slate-700">{lead.phone}</p>}
                      {lead.email && <p className="text-xs text-slate-400">{lead.email}</p>}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${SOURCE_COLORS[lead.source] || ""}`}>
                        {t(`crm.source.${lead.source}`, lead.source)}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {lead.status === "CONVERTED" ? (
                        <div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS.CONVERTED}`}>
                            {t("crm.status.CONVERTED", "Đã chuyển đổi")}
                          </span>
                          {lead.convertedUser && (
                            <p className="text-xs text-green-600 mt-0.5">→ {lead.convertedUser.fullName}</p>
                          )}
                        </div>
                      ) : (
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[lead.status] || ""}`}
                        >
                          {STATUS_OPTIONS.filter((s) => s !== "CONVERTED").map((s) => (
                            <option key={s} value={s}>{t(`crm.status.${s}`, s)}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {(() => {
                        if (!lead.nextFollowUpAt) return <span className="text-xs text-slate-300">—</span>;
                        const followDate = new Date(lead.nextFollowUpAt);
                        const now = new Date();
                        const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
                        const todayEnd = new Date(now); todayEnd.setHours(23,59,59,999);
                        const isOverdue = followDate < todayStart;
                        const isToday = followDate >= todayStart && followDate <= todayEnd;
                        return (
                          <div>
                            <span className={`text-xs font-medium ${isOverdue ? "text-red-600" : isToday ? "text-orange-600" : "text-slate-600"}`}>
                              {isOverdue && "⚠️ "}{followDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                            </span>
                            {lead.followUpNote && <p className="text-xs text-slate-400 truncate max-w-[100px]" title={lead.followUpNote}>{lead.followUpNote}</p>}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-2">
                      <select
                        value={lead.assignedToId || ""}
                        onChange={(e) => handleAssign(lead.id, e.target.value)}
                        className="text-xs border border-slate-200 rounded px-1 py-0.5"
                      >
                        <option value="">—</option>
                        {adminUsers.map((u) => (
                          <option key={u.id} value={u.id}>{u.fullName}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => { setEditingLead(lead); setEditNotes(lead.notes || ""); setEditFollowUpNote(lead.followUpNote || ""); }}
                          className="text-xs px-2 py-1 border border-slate-200 rounded hover:bg-slate-50"
                          title={t("crm.editNotes", "Ghi chú")}
                        >
                          📝
                        </button>
                        {lead.status !== "CONVERTED" && lead.status !== "LOST" && (
                          <>
                            <button
                              onClick={() => handleMarkContacted(lead.id)}
                              className="text-xs px-2 py-1 border border-blue-200 text-blue-700 rounded hover:bg-blue-50"
                              title={t("crm.markContacted", "Đã liên hệ")}
                            >
                              📞
                            </button>
                            <button
                              onClick={() => { setFollowUpLead(lead); setFollowUpDate(lead.nextFollowUpAt ? lead.nextFollowUpAt.slice(0, 16) : ""); setFollowUpNoteInput(lead.followUpNote || ""); }}
                              className="text-xs px-2 py-1 border border-orange-200 text-orange-700 rounded hover:bg-orange-50"
                              title={t("crm.setFollowUp", "Đặt lịch chăm sóc")}
                            >
                              📅
                            </button>
                          </>
                        )}
                        {lead.status !== "CONVERTED" && (
                          <button
                            onClick={() => { setConvertLead(lead); setConvertMode("new"); setConvertEmail(lead.email || ""); }}
                            className="text-xs px-2 py-1 border border-green-200 text-green-700 rounded hover:bg-green-50"
                            title={t("crm.convertToCustomer", "Chuyển thành KH")}
                          >
                            🔄
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>

      {/* Notes modal */}
      {editingLead && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              {t("crm.notesFor", "Ghi chú cho")} {editingLead.fullName}
            </h3>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder={t("crm.notesPlaceholder", "Nhập ghi chú về lead...")}
            />
            <p className="text-xs text-slate-500 mt-3 mb-1">{t("crm.followUpNoteLabel", "Ghi chú chăm sóc")}</p>
            <textarea
              value={editFollowUpNote}
              onChange={(e) => setEditFollowUpNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder={t("crm.followUpNotePlaceholder", "VD: Gọi lại hỏi nhu cầu vận chuyển...")}
            />
            {editingLead.lastContactedAt && (
              <p className="text-xs text-slate-400 mt-2">
                {t("crm.lastContacted", "Liên hệ lần cuối")}: {new Date(editingLead.lastContactedAt).toLocaleString("vi-VN")}
              </p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleSaveNotes(editingLead.id)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t("common.save")}
              </button>
              <button
                onClick={() => setEditingLead(null)}
                className="px-4 py-2 border border-slate-300 text-sm rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up scheduling modal */}
      {followUpLead && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-1">
              {t("crm.scheduleFollowUp", "Đặt lịch chăm sóc")}
            </h3>
            <p className="text-xs text-slate-500 mb-4">{followUpLead.fullName}</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 mb-1 block">{t("crm.followUpDate", "Ngày chăm sóc tiếp theo")}</label>
                <input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 mb-1 block">{t("crm.followUpNoteLabel", "Ghi chú chăm sóc")}</label>
                <textarea
                  value={followUpNoteInput}
                  onChange={(e) => setFollowUpNoteInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder={t("crm.followUpNotePlaceholder", "VD: Gọi lại hỏi nhu cầu vận chuyển...")}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSaveFollowUp}
                className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
              >
                {t("common.save")}
              </button>
              {followUpLead.nextFollowUpAt && (
                <button
                  onClick={() => { setFollowUpDate(""); setFollowUpNoteInput(""); handleSaveFollowUp(); }}
                  className="px-4 py-2 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors"
                >
                  {t("crm.clearFollowUp", "Xóa lịch")}
                </button>
              )}
              <button
                onClick={() => setFollowUpLead(null)}
                className="px-4 py-2 border border-slate-300 text-sm rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert modal */}
      {convertLead && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-1">
              {t("crm.convertTitle", "Chuyển đổi thành khách hàng")}
            </h3>
            <p className="text-xs text-slate-500 mb-4">{convertLead.fullName} — {convertLead.phone || convertLead.email || ""}</p>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setConvertMode("new")}
                className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${convertMode === "new" ? "bg-blue-50 border-blue-300 text-blue-700" : "border-slate-200 text-slate-600"}`}
              >
                {t("crm.createNewAccount", "Tạo tài khoản mới")}
              </button>
              <button
                onClick={() => setConvertMode("existing")}
                className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${convertMode === "existing" ? "bg-blue-50 border-blue-300 text-blue-700" : "border-slate-200 text-slate-600"}`}
              >
                {t("crm.linkExisting", "Liên kết KH hiện có")}
              </button>
            </div>

            {convertMode === "new" ? (
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Email *"
                  value={convertEmail}
                  onChange={(e) => setConvertEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  placeholder={t("crm.password", "Mật khẩu *")}
                  value={convertPassword}
                  onChange={(e) => setConvertPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <input
                type="text"
                placeholder={t("crm.existingUserId", "ID khách hàng hiện có")}
                value={convertExistingId}
                onChange={(e) => setConvertExistingId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleConvert}
                disabled={converting}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {converting ? t("common.loading") : t("crm.convert", "Chuyển đổi")}
              </button>
              <button
                onClick={() => setConvertLead(null)}
                className="px-4 py-2 border border-slate-300 text-sm rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
