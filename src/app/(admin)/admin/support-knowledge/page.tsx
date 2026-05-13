"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  keywords: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UnansweredGroup {
  normalized: string;
  displayQuestion: string;
  ids: string[];
  count: number;
  channels: string[];
  latestAt: string;
  unresolvedCount: number;
}

const CHANNEL_LABELS: Record<string, string> = {
  ZALO: "Zalo",
  TELEGRAM: "Telegram",
  MESSENGER: "Messenger",
};

interface AnalyticsSummary {
  total: number;
  unresolved: number;
  resolved: number;
  byChannel: Record<string, { total: number; unresolved: number }>;
  latestUnresolved: { question: string; channel: string; createdAt: string } | null;
  topRepeated: { question: string; count: number }[];
}

const CATEGORIES = [
  "Thông tin chung",
  "Hướng dẫn sử dụng",
  "Chính sách & phí",
  "Liên hệ & hỗ trợ",
];

const EMPTY_FORM = { title: "", content: "", category: CATEGORIES[0], keywords: "" };

export default function SupportKnowledgePage() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importCategory, setImportCategory] = useState(CATEGORIES[0]);
  const [importing, setImporting] = useState(false);
  const [showTestBox, setShowTestBox] = useState(false);
  const [testQuery, setTestQuery] = useState("");
  const [testing, setTesting] = useState(false);
  const [creatingTemplates, setCreatingTemplates] = useState(false);
  const [unanswered, setUnanswered] = useState<UnansweredGroup[]>([]);
  const [showUnanswered, setShowUnanswered] = useState(false);
  const [uqSearch, setUqSearch] = useState("");
  const [uqChannel, setUqChannel] = useState("ALL");
  const [uqStatus, setUqStatus] = useState<"unresolved" | "resolved" | "all">("unresolved");
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [testResult, setTestResult] = useState<{
    matched: boolean;
    title?: string;
    content?: string;
    matchSource: string;
    score: number;
  } | null>(null);

  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/support-knowledge");
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch {
      toast("Không thể tải dữ liệu tri thức", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadUnanswered = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/unanswered-questions");
      if (res.ok) {
        const data = await res.json();
        setUnanswered(data);
      }
    } catch {
      // silent
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/support-knowledge/unanswered/summary");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetch("/api/admin/support-knowledge")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setEntries(d))
      .catch(() => {})
      .finally(() => setLoading(false));
    loadUnanswered();
    loadAnalytics();
  }, [loadUnanswered, loadAnalytics]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(entry: KnowledgeEntry) {
    setEditingId(entry.id);
    setForm({ title: entry.title, content: entry.content, category: entry.category, keywords: entry.keywords || "" });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast("Vui lòng nhập tiêu đề và nội dung", "error");
      return;
    }

    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/support-knowledge/${editingId}`
        : "/api/admin/support-knowledge";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast(editingId ? "Đã cập nhật thành công" : "Đã thêm mục mới", "success");
        cancelForm();
        loadEntries();
      } else {
        const data = await res.json();
        toast(data.error || "Không thể lưu", "error");
      }
    } catch {
      toast("Mất kết nối — không gọi được tới server", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(entry: KnowledgeEntry) {
    try {
      const res = await fetch(`/api/admin/support-knowledge/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !entry.isActive }),
      });
      if (res.ok) {
        toast(entry.isActive ? "Đã tắt mục này" : "Đã bật mục này", "success");
        loadEntries();
      }
    } catch {
      toast("Mất kết nối", "error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa mục này?")) return;
    try {
      const res = await fetch(`/api/admin/support-knowledge/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast("Đã xóa thành công", "success");
        loadEntries();
      }
    } catch {
      toast("Mất kết nối", "error");
    }
  }

  async function runTest() {
    if (!testQuery.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/support-knowledge/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: testQuery.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setTestResult(data);
      } else {
        const data = await res.json();
        toast(data.error || "Không thể kiểm tra", "error");
      }
    } catch {
      toast("Mất kết nối — không gọi được tới server", "error");
    } finally {
      setTesting(false);
    }
  }

  if (loading) return <LoadingSpinner text="Đang tải tri thức hỗ trợ..." />;

  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    items: entries.filter((e) => e.category === cat),
  })).filter((g) => g.items.length > 0);

  const uncategorized = entries.filter(
    (e) => !CATEGORIES.includes(e.category),
  );

  return (
    <>
      <PageHeader
        title="📚 Trung tâm tri thức"
        subtitle="Quản lý nội dung hỗ trợ khách hàng cho chatbot Zalo/Telegram/Messenger"
        action={
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Thêm mục mới
          </button>
        }
      />

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setShowImport(!showImport)}
          className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
        >
          {showImport ? "Ẩn nhập hàng loạt" : "📋 Nhập hàng loạt"}
        </button>
        <button
          onClick={() => { setShowTestBox(!showTestBox); setTestResult(null); }}
          className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
        >
          {showTestBox ? "Ẩn thử câu hỏi" : "🔍 Thử câu hỏi chatbot"}
        </button>
        <button
          disabled={creatingTemplates}
          onClick={async () => {
            setCreatingTemplates(true);
            try {
              const res = await fetch("/api/admin/support-knowledge/templates", {
                method: "POST",
              });
              if (res.ok) {
                const data = await res.json();
                toast(
                  `Đã tạo ${data.created} mục tri thức mẫu, bỏ qua ${data.skipped} mục đã có.`,
                  data.created > 0 ? "success" : "info",
                );
                loadEntries();
              } else {
                const data = await res.json();
                toast(data.error || "Không thể tạo tri thức mẫu", "error");
              }
            } catch {
              toast("Mất kết nối — không gọi được tới server", "error");
            } finally {
              setCreatingTemplates(false);
            }
          }}
          className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
        >
          {creatingTemplates ? "Đang tạo..." : "📄 Tạo tri thức mẫu"}
        </button>
        <button
          onClick={() => { setShowAnalytics(!showAnalytics); if (!showAnalytics) loadAnalytics(); }}
          className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
        >
          {showAnalytics ? "Ẩn thống kê" : "📊 Hiệu quả chatbot"}
        </button>
      </div>

      {/* Analytics Card */}
      {showAnalytics && analytics && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Hiệu quả chatbot</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-800">{analytics.total}</p>
              <p className="text-xs text-slate-500">Tổng câu hỏi</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <p className="text-2xl font-bold text-amber-700">{analytics.unresolved}</p>
              <p className="text-xs text-amber-600">Chưa xử lý</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">{analytics.resolved}</p>
              <p className="text-xs text-green-600">Đã xử lý</p>
            </div>
          </div>

          {Object.keys(analytics.byChannel).length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-600 mb-2">Theo kênh:</p>
              <div className="flex gap-3">
                {Object.entries(analytics.byChannel).map(([channel, data]) => (
                  <div key={channel} className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                      {CHANNEL_LABELS[channel] || channel}
                    </span>
                    <span className="text-slate-600">{data.total}</span>
                    {data.unresolved > 0 && (
                      <span className="text-amber-600 text-xs">({data.unresolved} chưa xử lý)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {analytics.latestUnresolved && (
            <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs font-medium text-amber-700 mb-1">Câu hỏi chưa xử lý gần nhất:</p>
              <p className="text-sm text-slate-700">
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 mr-2">
                  {CHANNEL_LABELS[analytics.latestUnresolved.channel] || analytics.latestUnresolved.channel}
                </span>
                {analytics.latestUnresolved.question}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(analytics.latestUnresolved.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
          )}

          {analytics.topRepeated.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Top câu hỏi lặp lại nhiều nhất:</p>
              <div className="space-y-1">
                {analytics.topRepeated.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded">
                    <span className="text-slate-700 truncate mr-2">{item.question}</span>
                    <span className="text-xs font-medium text-slate-500 shrink-0">{item.count} lần</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analytics.total === 0 && (
            <p className="text-sm text-slate-400 italic">Chưa có dữ liệu câu hỏi chưa trả lời.</p>
          )}
        </Card>
      )}

      {showImport && (
        <Card title="Nhập tri thức hàng loạt" className="mb-6">
          <p className="text-sm text-slate-500 mb-4">
            Dán nội dung hướng dẫn, chính sách, bảng giá hoặc thông tin công ty.
            Hệ thống sẽ tách thành nhiều mục tri thức để chatbot sử dụng.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Danh mục cho các mục nhập
              </label>
              <select
                value={importCategory}
                onChange={(e) => setImportCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nội dung
              </label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={10}
                placeholder={"Ví dụ:\n# Giờ làm việc\nCông ty làm việc từ 8:00 đến 17:30...\n\n# Cách nạp tiền\nKhách hàng có thể nạp tiền bằng chuyển khoản..."}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono"
              />
              <p className="text-xs text-slate-400 mt-1">
                Dùng dấu # hoặc ## hoặc dòng kết thúc bằng : để phân tách các mục.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!importText.trim()) {
                    toast("Vui lòng dán nội dung cần nhập", "error");
                    return;
                  }
                  setImporting(true);
                  try {
                    const res = await fetch("/api/admin/support-knowledge/import", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ text: importText, category: importCategory }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      toast(`Đã nhập ${data.count} mục tri thức`, "success");
                      setImportText("");
                      setShowImport(false);
                      loadEntries();
                    } else {
                      toast(data.error || "Không thể nhập dữ liệu", "error");
                    }
                  } catch {
                    toast("Mất kết nối — không gọi được tới server", "error");
                  } finally {
                    setImporting(false);
                  }
                }}
                disabled={importing}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {importing ? "Đang nhập..." : "Nhập vào Trung tâm tri thức"}
              </button>
              <button
                onClick={() => {
                  setShowImport(false);
                  setImportText("");
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </Card>
      )}

      {showTestBox && (
        <Card title="Thử câu hỏi chatbot" className="mb-6">
          <p className="text-sm text-slate-500 mb-4">
            Nhập câu hỏi giống như khách hàng hỏi qua Zalo để kiểm tra câu trả lời từ Trung tâm tri thức.
          </p>
          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && testQuery.trim() && !testing) {
                    e.preventDefault();
                    runTest();
                  }
                }}
                placeholder="Ví dụ: bên mình mấy giờ làm việc?"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={runTest}
              disabled={testing || !testQuery.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {testing ? "Đang kiểm tra..." : "Kiểm tra câu trả lời"}
            </button>

            {testResult && (
              testResult.matched ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 font-semibold text-sm">Tìm thấy câu trả lời</span>
                    <span className="text-xs text-slate-400">
                      (nguồn: {testResult.matchSource} • điểm: {testResult.score})
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 mb-1">{testResult.title}</h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{testResult.content}</p>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-700">
                    Chưa tìm thấy câu trả lời phù hợp. Hãy bổ sung từ khóa hoặc thêm mục tri thức mới.
                  </p>
                </div>
              )
            )}
          </div>
        </Card>
      )}

      {showForm && (
        <Card title={editingId ? "Chỉnh sửa mục tri thức" : "Thêm mục tri thức mới"} className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tiêu đề
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ví dụ: Giờ làm việc"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Danh mục
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Từ khóa
              </label>
              <input
                type="text"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="giờ làm việc, thời gian mở cửa, mấy giờ làm"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                Nhập các cụm từ khách hàng hay hỏi, cách nhau bằng dấu phẩy.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nội dung trả lời
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={4}
                placeholder="Nội dung chatbot sẽ trả lời khách hàng..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Thêm mới"}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
              >
                Hủy
              </button>
            </div>
          </form>
        </Card>
      )}

      {entries.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-slate-400">
            <p className="text-lg mb-2">Chưa có mục tri thức nào</p>
            <p className="text-sm">Nhấn &quot;Thêm mục mới&quot; để bắt đầu xây dựng cơ sở tri thức hỗ trợ</p>
          </div>
        </Card>
      ) : (
        <>
          {grouped.map((group) => (
            <Card key={group.category} title={group.category} className="mb-6">
              <div className="divide-y divide-slate-100">
                {group.items.map((entry) => (
                  <div key={entry.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-slate-800">
                            {entry.title}
                          </h4>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              entry.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {entry.isActive ? "Đang bật" : "Đã tắt"}
                          </span>
                        </div>
                        {entry.keywords && (
                          <p className="text-xs text-slate-400 mt-1">
                            Từ khóa: {entry.keywords}
                          </p>
                        )}
                        <p className="text-sm text-slate-600 whitespace-pre-wrap mt-1">
                          {entry.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleActive(entry)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                            entry.isActive
                              ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {entry.isActive ? "Tắt" : "Bật"}
                        </button>
                        <button
                          onClick={() => openEdit(entry)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}

          {uncategorized.length > 0 && (
            <Card title="Khác" className="mb-6">
              <div className="divide-y divide-slate-100">
                {uncategorized.map((entry) => (
                  <div key={entry.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-slate-800">
                            {entry.title}
                          </h4>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              entry.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {entry.isActive ? "Đang bật" : "Đã tắt"}
                          </span>
                        </div>
                        {entry.keywords && (
                          <p className="text-xs text-slate-400 mt-1">
                            Từ khóa: {entry.keywords}
                          </p>
                        )}
                        <p className="text-sm text-slate-600 whitespace-pre-wrap mt-1">
                          {entry.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleActive(entry)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                            entry.isActive
                              ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {entry.isActive ? "Tắt" : "Bật"}
                        </button>
                        <button
                          onClick={() => openEdit(entry)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Unanswered Questions Section */}
      <div className="mt-8">
        <button
          onClick={() => setShowUnanswered(!showUnanswered)}
          className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
        >
          {showUnanswered ? "Ẩn câu hỏi chưa trả lời" : `❓ Câu hỏi chưa có câu trả lời (${unanswered.reduce((sum, g) => sum + g.unresolvedCount, 0)})`}
        </button>

        {showUnanswered && (
          <Card className="mt-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">
              Câu hỏi chưa có câu trả lời
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Các câu hỏi khách hàng gửi qua chatbot mà chưa tìm thấy câu trả lời trong Trung tâm tri thức.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              <input
                type="text"
                value={uqSearch}
                onChange={(e) => setUqSearch(e.target.value)}
                placeholder="Tìm câu hỏi..."
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
              />
              <select
                value={uqChannel}
                onChange={(e) => setUqChannel(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả kênh</option>
                <option value="ZALO">Zalo</option>
                <option value="TELEGRAM">Telegram</option>
                <option value="MESSENGER">Messenger</option>
              </select>
              <select
                value={uqStatus}
                onChange={(e) => setUqStatus(e.target.value as "unresolved" | "resolved" | "all")}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="unresolved">Chưa xử lý</option>
                <option value="resolved">Đã xử lý</option>
                <option value="all">Tất cả</option>
              </select>
            </div>

            {(() => {
              const filtered = unanswered.filter((g) => {
                if (uqSearch && !g.displayQuestion.toLowerCase().includes(uqSearch.toLowerCase())) return false;
                if (uqChannel !== "ALL" && !g.channels.includes(uqChannel)) return false;
                if (uqStatus === "unresolved" && g.unresolvedCount === 0) return false;
                if (uqStatus === "resolved" && g.unresolvedCount > 0) return false;
                return true;
              });
              return filtered.length === 0 ? (
                <p className="text-sm text-slate-400 italic">Không tìm thấy câu hỏi phù hợp.</p>
              ) : (
                <div className="space-y-2">
                  {filtered.map((g) => (
                  <div
                    key={g.normalized}
                    className={`flex items-start justify-between gap-4 p-3 rounded-lg border ${
                      g.unresolvedCount === 0
                        ? "bg-slate-50 border-slate-200 opacity-60"
                        : "bg-white border-amber-200"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {g.channels.map((ch) => (
                          <span key={ch} className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {CHANNEL_LABELS[ch] || ch}
                          </span>
                        ))}
                        {g.count > 1 && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            {g.count} lần
                          </span>
                        )}
                        <span className="text-xs text-slate-400">
                          {new Date(g.latestAt).toLocaleString("vi-VN")}
                        </span>
                        {g.unresolvedCount === 0 && (
                          <span className="text-xs text-green-600 font-medium">Đã xử lý</span>
                        )}
                        {g.unresolvedCount > 0 && g.unresolvedCount < g.count && (
                          <span className="text-xs text-amber-600">{g.unresolvedCount} chưa xử lý</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700">{g.displayQuestion}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {g.unresolvedCount > 0 && (
                        <>
                          <button
                            onClick={() => {
                              setForm({
                                title: g.displayQuestion,
                                content: "",
                                category: CATEGORIES[0],
                                keywords: "",
                              });
                              setEditingId(null);
                              setShowForm(true);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            Tạo tri thức
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(
                                  "/api/admin/unanswered-questions",
                                  {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ ids: g.ids }),
                                  },
                                );
                                if (res.ok) {
                                  toast(`Đã đánh dấu nhóm đã xử lý (${g.count} câu hỏi)`, "success");
                                  loadUnanswered();
                                  loadAnalytics();
                                }
                              } catch {
                                toast("Mất kết nối", "error");
                              }
                            }}
                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                          >
                            Đã xử lý nhóm
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              );
            })()}
          </Card>
        )}
      </div>
    </>
  );
}
