"use client";

import { useEffect, useState, useCallback } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

interface StaffNote {
  id: string;
  title: string;
  content: string;
  orderCode: string | null;
  priority: string;
  resolved: boolean;
  createdBy: string;
  createdAt: string;
  author: { fullName: string; role: string };
}

interface NotesData {
  notes: StaffNote[];
  total: number;
  unresolved: number;
  resolved: number;
}

const PRIORITY_LABELS: Record<string, string> = {
  URGENT: "Khẩn cấp",
  HIGH: "Cao",
  NORMAL: "Bình thường",
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700 border-red-200",
  HIGH: "bg-amber-100 text-amber-700 border-amber-200",
  NORMAL: "bg-slate-100 text-slate-600 border-slate-200",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  WAREHOUSE_CN: "Kho TQ",
  WAREHOUSE_VN: "Kho VN",
  ACCOUNTANT: "Kế toán",
};

function timeSince(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export default function StaffNotesPage() {
  const [data, setData] = useState<NotesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("unresolved");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newOrderCode, setNewOrderCode] = useState("");
  const [newPriority, setNewPriority] = useState("NORMAL");

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    if (search) params.set("search", search);
    fetch(`/api/admin/staff-notes?${params}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!newTitle || !newContent) return;
    await fetch("/api/admin/staff-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        content: newContent,
        orderCode: newOrderCode || undefined,
        priority: newPriority,
      }),
    });
    setShowCreate(false);
    setNewTitle("");
    setNewContent("");
    setNewOrderCode("");
    setNewPriority("NORMAL");
    fetchData();
  };

  const handleToggleResolved = async (id: string, currentResolved: boolean) => {
    await fetch("/api/admin/staff-notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, resolved: !currentResolved }),
    });
    fetchData();
  };

  if (loading && !data) return <LoadingSpinner text="Đang tải ghi chú..." />;

  return (
    <div>
      <PageHeader
        title="Ghi Chú Bàn Giao"
        subtitle={`${data?.unresolved ?? 0} chưa xong / ${data?.total ?? 0} tổng`}
        action={
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
          >
            + Ghi chú mới
          </button>
        }
      />

      {/* Create form */}
      {showCreate && (
        <Card title="Tạo ghi chú bàn giao">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tiêu đề *</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="VD: Gọi lại khách Nguyễn Văn A"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">Mã đơn (nếu có)</label>
                <input
                  value={newOrderCode}
                  onChange={(e) => setNewOrderCode(e.target.value)}
                  placeholder="BTH..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">Ưu tiên</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                >
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-1">Nội dung *</label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Chi tiết cần bàn giao..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700">
              Tạo ghi chú
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">
              Hủy
            </button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {[
          { k: "unresolved", l: `Chưa xong (${data?.unresolved ?? 0})` },
          { k: "resolved", l: `Đã xong (${data?.resolved ?? 0})` },
          { k: "urgent", l: "Khẩn cấp" },
          { k: "all", l: `Tất cả (${data?.total ?? 0})` },
        ].map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${filter === f.k ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
          >
            {f.l}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchData()}
          placeholder="Tìm ghi chú..."
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-full w-48"
        />
        <button onClick={fetchData} disabled={loading} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 disabled:opacity-50">
          {loading ? "..." : "Tìm"}
        </button>
      </div>

      {/* Notes list */}
      {data && data.notes.length > 0 ? (
        <div className="space-y-3">
          {data.notes.map((note) => (
            <Card key={note.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className={`text-sm font-semibold ${note.resolved ? "text-slate-400 line-through" : "text-slate-800"}`}>
                      {note.title}
                    </h3>
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full border ${PRIORITY_COLORS[note.priority] || PRIORITY_COLORS.NORMAL}`}>
                      {PRIORITY_LABELS[note.priority] || note.priority}
                    </span>
                    {note.orderCode && (
                      <a href={`/admin/orders?search=${note.orderCode}`} className="text-xs text-blue-600 hover:underline font-medium">
                        {note.orderCode}
                      </a>
                    )}
                  </div>
                  <p className={`text-sm ${note.resolved ? "text-slate-400" : "text-slate-600"} whitespace-pre-wrap`}>
                    {note.content}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {note.author.fullName} ({ROLE_LABELS[note.author.role] || note.author.role}) — {timeSince(note.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleResolved(note.id, note.resolved)}
                  className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
                    note.resolved
                      ? "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100"
                      : "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                  }`}
                >
                  {note.resolved ? "Mở lại" : "Xong"}
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <div className="text-4xl mb-3">📝</div>
          <div className="text-lg font-medium">Không có ghi chú</div>
          <div className="text-sm mt-1">
            {filter === "unresolved" ? "Tất cả ghi chú đã được xử lý xong" : "Chưa có ghi chú bàn giao nào"}
          </div>
        </div>
      )}
    </div>
  );
}
