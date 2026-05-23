"use client";

import { useCallback, useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import MobileDataCard from "@/components/ui/MobileDataCard";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";

interface Campaign {
  id: string;
  name: string;
  channel: string;
  status: string;
  targetStatus: string | null;
  messageTemplate: string | null;
  scheduledAt: string | null;
  notes: string | null;
  createdAt: string;
  createdBy: { id: string; fullName: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SCHEDULED: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const CHANNEL_COLORS: Record<string, string> = {
  ZALO: "bg-blue-50 text-blue-700",
  FACEBOOK: "bg-indigo-50 text-indigo-700",
  EMAIL: "bg-teal-50 text-teal-700",
  SMS: "bg-amber-50 text-amber-700",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Nháp",
  SCHEDULED: "Đã lên lịch",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const CHANNEL_LABELS: Record<string, string> = {
  ZALO: "Zalo",
  FACEBOOK: "Facebook",
  EMAIL: "Email",
  SMS: "SMS",
};

export default function CampaignsPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    channel: "ZALO",
    targetStatus: "",
    messageTemplate: "",
    scheduledAt: "",
    notes: "",
  });

  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editNotes, setEditNotes] = useState("");

  const fetchCampaigns = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (channelFilter) params.set("channel", channelFilter);
      const res = await fetch(`/api/admin/campaigns?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns);
        setTotalPages(data.totalPages);
      }
    } catch {
      toast(t("campaigns.fetchError", "Không thể tải danh sách chiến dịch"), "error");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, channelFilter, t, toast]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  async function handleCreate() {
    if (!createForm.name.trim()) {
      toast(t("campaigns.nameRequired", "Tên chiến dịch là bắt buộc"), "error");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          targetStatus: createForm.targetStatus || undefined,
          scheduledAt: createForm.scheduledAt || undefined,
        }),
      });
      if (res.ok) {
        toast(t("campaigns.created", "Đã tạo chiến dịch"), "success");
        setShowCreate(false);
        setCreateForm({ name: "", channel: "ZALO", targetStatus: "", messageTemplate: "", scheduledAt: "", notes: "" });
        setPage(1);
        fetchCampaigns();
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

  async function handleStatusChange(campaignId: string, newStatus: string) {
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: campaignId, status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCampaigns((prev) => prev.map((c) => c.id === campaignId ? updated : c));
        toast(t("campaigns.statusUpdated", "Đã cập nhật trạng thái"), "success");
      }
    } catch {
      toast("Lỗi cập nhật", "error");
    }
  }

  async function handleSaveNotes(campaignId: string) {
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: campaignId, notes: editNotes }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCampaigns((prev) => prev.map((c) => c.id === campaignId ? updated : c));
        setEditingCampaign(null);
        toast(t("campaigns.notesSaved", "Đã lưu ghi chú"), "success");
      }
    } catch {
      toast("Lỗi", "error");
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title={t("campaigns.title", "Chiến dịch Marketing")} />

      {/* Filters + Create button */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="">{t("campaigns.allStatuses", "Tất cả trạng thái")}</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={channelFilter}
            onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="">{t("campaigns.allChannels", "Tất cả kênh")}</option>
            {Object.entries(CHANNEL_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="ml-auto px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showCreate ? t("common.cancel") : t("campaigns.create", "+ Tạo chiến dịch")}
          </button>
        </div>
      </Card>

      {/* Create form */}
      {showCreate && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">{t("campaigns.newCampaign", "Chiến dịch mới")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder={t("campaigns.namePlaceholder", "Tên chiến dịch *")}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <select
              value={createForm.channel}
              onChange={(e) => setCreateForm({ ...createForm, channel: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              {Object.entries(CHANNEL_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={createForm.targetStatus}
              onChange={(e) => setCreateForm({ ...createForm, targetStatus: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="">{t("campaigns.targetStatusAll", "Đối tượng: Tất cả lead")}</option>
              <option value="NEW">Lead mới</option>
              <option value="CONTACTED">Đã liên hệ</option>
              <option value="INTERESTED">Quan tâm</option>
            </select>
            <input
              type="datetime-local"
              value={createForm.scheduledAt}
              onChange={(e) => setCreateForm({ ...createForm, scheduledAt: e.target.value })}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <textarea
              value={createForm.messageTemplate}
              onChange={(e) => setCreateForm({ ...createForm, messageTemplate: e.target.value })}
              placeholder={t("campaigns.templatePlaceholder", "Mẫu tin nhắn (không gửi tự động)")}
              className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={3}
            />
            <textarea
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              placeholder={t("campaigns.notesPlaceholder", "Ghi chú chiến dịch")}
              className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={2}
            />
          </div>
          <div className="mt-3">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {creating ? t("common.saving") : t("campaigns.saveDraft", "Lưu nháp")}
            </button>
          </div>
        </Card>
      )}

      {/* Campaign list */}
      <Card>
        {/* Mobile card view */}
        <div className="md:hidden flex flex-col gap-2">
          {campaigns.length === 0 ? (
            <div className="text-center py-8 text-slate-400">{t("campaigns.empty", "Ch\u01b0a c\u00f3 chi\u1ebfn d\u1ecbch n\u00e0o")}</div>
          ) : (
            campaigns.map((c) => (
              <MobileDataCard
                key={c.id}
                header={
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-slate-800">{c.name}</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[c.status] || "bg-slate-100"}`}>
                      {STATUS_LABELS[c.status] || c.status}
                    </span>
                  </div>
                }
                fields={[
                  { label: t("campaigns.channel", "K\u00eanh"), value: (
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${CHANNEL_COLORS[c.channel] || "bg-slate-100"}`}>
                      {CHANNEL_LABELS[c.channel] || c.channel}
                    </span>
                  )},
                  { label: t("campaigns.target", "\u0110\u1ed1i t\u01b0\u1ee3ng"), value: c.targetStatus ? `Lead: ${c.targetStatus}` : t("campaigns.allLeads", "T\u1ea5t c\u1ea3") },
                  { label: t("campaigns.scheduled", "L\u1ecbch g\u1eedi"), value: c.scheduledAt ? new Date(c.scheduledAt).toLocaleString("vi-VN") : "\u2014" },
                  { label: t("campaigns.createdBy", "Ng\u01b0\u1eddi t\u1ea1o"), value: c.createdBy?.fullName || "\u2014" },
                ]}
                actions={
                  <button
                    onClick={() => { setEditingCampaign(c); setEditNotes(c.notes || ""); }}
                    className="text-xs px-2 py-1 border border-slate-200 rounded hover:bg-slate-50"
                  >
                    \ud83d\udcdd
                  </button>
                }
              />
            ))
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-2 font-medium text-slate-600">{t("campaigns.name", "Tên")}</th>
                <th className="text-left py-3 px-2 font-medium text-slate-600">{t("campaigns.channel", "Kênh")}</th>
                <th className="text-left py-3 px-2 font-medium text-slate-600">{t("campaigns.status", "Trạng thái")}</th>
                <th className="text-left py-3 px-2 font-medium text-slate-600">{t("campaigns.target", "Đối tượng")}</th>
                <th className="text-left py-3 px-2 font-medium text-slate-600">{t("campaigns.scheduled", "Lịch gửi")}</th>
                <th className="text-left py-3 px-2 font-medium text-slate-600">{t("campaigns.createdBy", "Người tạo")}</th>
                <th className="text-left py-3 px-2 font-medium text-slate-600">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">{t("campaigns.empty", "Chưa có chiến dịch nào")}</td></tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2">
                      <span className="font-medium text-slate-800">{c.name}</span>
                      {c.messageTemplate && (
                        <p className="text-xs text-slate-400 truncate max-w-[200px]">{c.messageTemplate}</p>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${CHANNEL_COLORS[c.channel] || "bg-slate-100"}`}>
                        {CHANNEL_LABELS[c.channel] || c.channel}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <select
                        value={c.status}
                        onChange={(e) => handleStatusChange(c.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded font-medium border-0 ${STATUS_COLORS[c.status] || "bg-slate-100"}`}
                      >
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-2 text-xs text-slate-600">
                      {c.targetStatus ? `Lead: ${c.targetStatus}` : t("campaigns.allLeads", "Tất cả")}
                    </td>
                    <td className="py-3 px-2 text-xs text-slate-600">
                      {c.scheduledAt ? new Date(c.scheduledAt).toLocaleString("vi-VN") : "—"}
                    </td>
                    <td className="py-3 px-2 text-xs text-slate-600">
                      {c.createdBy?.fullName || "—"}
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => { setEditingCampaign(c); setEditNotes(c.notes || ""); }}
                        className="text-xs px-2 py-1 border border-slate-200 rounded hover:bg-slate-50"
                        title={t("campaigns.editNotes", "Ghi chú")}
                      >
                        📝
                      </button>
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
      {editingCampaign && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              {t("campaigns.notesFor", "Ghi chú")} — {editingCampaign.name}
            </h3>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder={t("campaigns.notesPlaceholder", "Ghi chú chiến dịch")}
            />
            {editingCampaign.messageTemplate && (
              <div className="mt-3 p-2 bg-slate-50 rounded-lg">
                <p className="text-xs font-medium text-slate-600 mb-1">{t("campaigns.templatePreview", "Mẫu tin nhắn")}:</p>
                <p className="text-xs text-slate-500 whitespace-pre-wrap">{editingCampaign.messageTemplate}</p>
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleSaveNotes(editingCampaign.id)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t("common.save")}
              </button>
              <button
                onClick={() => setEditingCampaign(null)}
                className="px-4 py-2 border border-slate-300 text-sm rounded-lg hover:bg-slate-50 transition-colors"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
