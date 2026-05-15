"use client";

import { useEffect, useState, useCallback } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

interface Issue {
  id: string;
  customerId: string;
  orderCode: string | null;
  issueType: string;
  description: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { fullName: string; phone: string | null; email: string };
  assignee: { fullName: string } | null;
}

interface IssueData {
  issues: Issue[];
  statusCounts: Record<string, number>;
}

const TYPE_LABELS: Record<string, string> = {
  THIEU_HANG: "Thiếu hàng",
  GIAO_CHAM: "Giao chậm",
  SAI_CAN: "Sai cân nặng",
  HONG_HANG: "Hỏng hàng",
  CHUA_NHAN: "Chưa nhận được",
  PHI_SAI: "Phí sai",
  CHATBOT: "Chatbot/Hỗ trợ",
  KHAC: "Khác",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "Mới",
  IN_PROGRESS: "Đang xử lý",
  WAITING_CUSTOMER: "Chờ khách",
  RESOLVED: "Đã giải quyết",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-red-100 text-red-700 border-red-200",
  IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
  WAITING_CUSTOMER: "bg-amber-100 text-amber-700 border-amber-200",
  RESOLVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Thấp",
  NORMAL: "Bình thường",
  HIGH: "Cao",
  URGENT: "Khẩn cấp",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  NORMAL: "bg-blue-50 text-blue-600",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

function timeSince(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export default function CustomerIssuesPage() {
  const [data, setData] = useState<IssueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editResolution, setEditResolution] = useState("");
  const [adminUsers, setAdminUsers] = useState<Array<{ id: string; fullName: string }>>([]);

  // Create form
  const [newCustomerId, setNewCustomerId] = useState("");
  const [newOrderCode, setNewOrderCode] = useState("");
  const [newType, setNewType] = useState("KHAC");
  const [newPriority, setNewPriority] = useState("NORMAL");
  const [newDesc, setNewDesc] = useState("");
  const [customers, setCustomers] = useState<Array<{ id: string; fullName: string }>>([]);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (typeFilter !== "ALL") params.set("issueType", typeFilter);
    if (search) params.set("search", search);
    fetch(`/api/admin/customer-issues?${params}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [statusFilter, typeFilter, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    fetch("/api/admin/customers?limit=500")
      .then((r) => r.json())
      .then((d) => setCustomers(Array.isArray(d) ? d : d.customers || []))
      .catch(() => {});
    fetch("/api/users?role=ADMIN&limit=100")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.users) setAdminUsers(d.users.map((u: { id: string; fullName: string }) => ({ id: u.id, fullName: u.fullName })));
      })
      .catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!newCustomerId || !newDesc) return;
    await fetch("/api/admin/customer-issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: newCustomerId,
        orderCode: newOrderCode || undefined,
        issueType: newType,
        priority: newPriority,
        description: newDesc,
      }),
    });
    setShowCreate(false);
    setNewCustomerId("");
    setNewOrderCode("");
    setNewType("KHAC");
    setNewPriority("NORMAL");
    setNewDesc("");
    fetchData();
  };

  const handleUpdate = async (id: string) => {
    await fetch("/api/admin/customer-issues", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: editStatus, resolution: editResolution }),
    });
    setEditingId(null);
    fetchData();
  };

  const handleAssign = async (issueId: string, assignedTo: string) => {
    await fetch("/api/admin/customer-issues", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: issueId, assignedTo: assignedTo || null }),
    });
    fetchData();
  };

  const handlePriority = async (issueId: string, priority: string) => {
    await fetch("/api/admin/customer-issues", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: issueId, priority }),
    });
    fetchData();
  };

  if (loading && !data) return <LoadingSpinner text="Đang tải khiếu nại..." />;

  const total = data ? Object.values(data.statusCounts).reduce((s, n) => s + n, 0) : 0;
  const unresolved = total - (data?.statusCounts.RESOLVED || 0);

  return (
    <div>
      <PageHeader
        title="Khiếu Nại Khách Hàng"
        subtitle={`${unresolved} chưa giải quyết / ${total} tổng`}
        action={
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
          >
            + Tạo mới
          </button>
        }
      />

      {/* Create form */}
      {showCreate && (
        <Card title="Tạo khiếu nại mới">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Khách hàng *</label>
              <select
                value={newCustomerId}
                onChange={(e) => setNewCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
              >
                <option value="">Chọn khách hàng</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Mã đơn (nếu có)</label>
              <input
                value={newOrderCode}
                onChange={(e) => setNewOrderCode(e.target.value)}
                placeholder="BTH..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Loại vấn đề *</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Độ ưu tiên</label>
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
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Mô tả *</label>
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Chi tiết vấn đề..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700">
              Tạo khiếu nại
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">
              Hủy
            </button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {[{ k: "ALL", l: `Tất cả (${total})` }, { k: "NEW", l: `Mới (${data?.statusCounts.NEW || 0})` }, { k: "IN_PROGRESS", l: `Đang xử lý (${data?.statusCounts.IN_PROGRESS || 0})` }, { k: "WAITING_CUSTOMER", l: `Chờ khách (${data?.statusCounts.WAITING_CUSTOMER || 0})` }, { k: "RESOLVED", l: `Đã giải quyết (${data?.statusCounts.RESOLVED || 0})` }].map((f) => (
          <button
            key={f.k}
            onClick={() => setStatusFilter(f.k)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${statusFilter === f.k ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
          >
            {f.l}
          </button>
        ))}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-full bg-white"
        >
          <option value="ALL">Tất cả loại</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchData()}
          placeholder="Tìm mã đơn, tên khách..."
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-full w-48"
        />
        <button onClick={fetchData} disabled={loading} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50 disabled:opacity-50">
          {loading ? "..." : "Tìm"}
        </button>
      </div>

      {/* Issue list */}
      {data && data.issues.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                  <th className="pb-2 font-medium">Khách</th>
                  <th className="pb-2 font-medium">Đơn</th>
                  <th className="pb-2 font-medium">Loại</th>
                  <th className="pb-2 font-medium">Mô tả</th>
                  <th className="pb-2 font-medium">Độ ưu tiên</th>
                  <th className="pb-2 font-medium">Trạng thái</th>
                  <th className="pb-2 font-medium">Phụ trách</th>
                  <th className="pb-2 font-medium">Thời gian</th>
                  <th className="pb-2 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data.issues.map((issue) => (
                  <tr key={issue.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3">
                      <div className="font-medium text-slate-800">{issue.customer.fullName}</div>
                      {issue.customer.phone && <div className="text-xs text-slate-400">{issue.customer.phone}</div>}
                    </td>
                    <td className="py-3">
                      {issue.orderCode ? (
                        <a href={`/admin/orders?search=${issue.orderCode}`} className="text-blue-600 hover:underline font-medium text-xs">{issue.orderCode}</a>
                      ) : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="py-3">
                      <span className="text-xs font-medium text-slate-600">{TYPE_LABELS[issue.issueType] || issue.issueType}</span>
                    </td>
                    <td className="py-3 max-w-[200px]">
                      <div className="text-xs text-slate-600 truncate" title={issue.description}>{issue.description}</div>
                      {issue.resolution && <div className="text-xs text-emerald-600 mt-0.5 truncate" title={issue.resolution}>→ {issue.resolution}</div>}
                    </td>
                    <td className="py-3">
                      <select
                        value={issue.priority}
                        onChange={(e) => handlePriority(issue.id, e.target.value)}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium border-0 ${PRIORITY_COLORS[issue.priority] || "bg-slate-100"}`}
                      >
                        {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${STATUS_COLORS[issue.status] || "bg-slate-100 text-slate-600"}`}>
                        {STATUS_LABELS[issue.status] || issue.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <select
                        value={issue.assignedTo || ""}
                        onChange={(e) => handleAssign(issue.id, e.target.value)}
                        className="text-xs px-2 py-1 border border-slate-200 rounded-lg bg-white min-w-[100px]"
                      >
                        <option value="">—</option>
                        {adminUsers.map((u) => (
                          <option key={u.id} value={u.id}>{u.fullName}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 text-xs text-slate-400 whitespace-nowrap">{timeSince(issue.createdAt)}</td>
                    <td className="py-3">
                      {editingId === issue.id ? (
                        <div className="flex flex-col gap-1.5 min-w-[160px]">
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                          >
                            {Object.entries(STATUS_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                          <input
                            value={editResolution}
                            onChange={(e) => setEditResolution(e.target.value)}
                            placeholder="Cách giải quyết..."
                            className="px-2 py-1 text-xs border border-slate-200 rounded-lg"
                          />
                          <div className="flex gap-1">
                            <button onClick={() => handleUpdate(issue.id)} className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg">Lưu</button>
                            <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs font-medium text-slate-500 bg-slate-100 rounded-lg">Hủy</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingId(issue.id); setEditStatus(issue.status); setEditResolution(issue.resolution || ""); }}
                          className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                        >
                          Cập nhật
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <div className="text-4xl mb-3">✅</div>
          <div className="text-lg font-medium">Không có khiếu nại</div>
          <div className="text-sm mt-1">Chưa có khiếu nại nào{statusFilter !== "ALL" ? ` ở trạng thái "${STATUS_LABELS[statusFilter]}"` : ""}</div>
        </div>
      )}
    </div>
  );
}
