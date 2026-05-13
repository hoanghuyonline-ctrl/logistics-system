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

  useEffect(() => {
    fetch("/api/admin/support-knowledge")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setEntries(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
      </div>

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
    </>
  );
}
