"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

interface UserChannelInfo {
  email: string;
  telegramChatId: string | null;
  zaloRecipientId: string | null;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***@***";
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

function maskId(id: string): string {
  if (id.length <= 6) return "***" + id.slice(-2);
  return id.slice(0, 3) + "***" + id.slice(-3);
}

export default function NotificationChannelsPage() {
  const [user, setUser] = useState<UserChannelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [telegramInput, setTelegramInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setUser(data);
        setTelegramInput(data.telegramChatId || "");
      })
      .finally(() => setLoading(false));
  }, []);

  async function saveTelegram() {
    if (!telegramInput.trim()) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramChatId: telegramInput.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser((prev) => prev ? { ...prev, telegramChatId: updated.telegramChatId } : prev);
        setSaveMsg("Đã lưu thành công!");
      } else {
        setSaveMsg("Lưu thất bại, vui lòng thử lại.");
      }
    } catch {
      setSaveMsg("Lỗi kết nối, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  async function unlinkTelegram() {
    const confirmed = window.confirm(
      "Bạn có chắc muốn hủy liên kết kênh Telegram không?\n\nSau khi hủy, hệ thống sẽ không gửi thông báo qua Telegram nữa."
    );
    if (!confirmed) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramChatId: null }),
      });
      if (res.ok) {
        setUser((prev) => prev ? { ...prev, telegramChatId: null } : prev);
        setTelegramInput("");
        setSaveMsg("Đã hủy liên kết Telegram.");
      }
    } catch {
      setSaveMsg("Lỗi kết nối, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  async function unlinkZalo() {
    const confirmed = window.confirm(
      "Bạn có chắc muốn hủy liên kết kênh Zalo không?\n\nSau khi hủy, hệ thống sẽ không gửi thông báo qua Zalo nữa. Bạn có thể liên kết lại bằng cách quét mã QR Zalo OA và nhắn mã đơn hàng."
    );
    if (!confirmed) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zaloRecipientId: null }),
      });
      if (res.ok) {
        setUser((prev) => prev ? { ...prev, zaloRecipientId: null } : prev);
        setSaveMsg("Đã hủy liên kết Zalo. Bạn có thể liên kết lại qua Zalo OA.");
      }
    } catch {
      setSaveMsg("Lỗi kết nối, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader title="Thông báo & Liên kết kênh" />

      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        Để nhận thông báo đúng tài khoản, quý khách cần liên kết từng kênh trước.
        Nếu chưa liên kết, hệ thống sẽ chỉ gửi qua <strong>App</strong> và <strong>Email</strong>.
      </div>

      <div className="space-y-4">
        {/* App / In-app */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-lg">📱</span> App (Trong tài khoản)
              </h3>
              <p className="text-sm text-slate-500 mt-1">Nhận thông báo trong tài khoản của bạn trên hệ thống.</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
              Đã bật
            </span>
          </div>
        </Card>

        {/* Email */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-lg">✉️</span> Email
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Gửi thông báo qua email: <span className="font-mono text-slate-700">{user ? maskEmail(user.email) : "---"}</span>
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
              Đã liên kết
            </span>
          </div>
        </Card>

        {/* Zalo */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-lg">💬</span> Zalo
              </h3>
              {user?.zaloRecipientId ? (
                <p className="text-sm text-slate-500 mt-1">
                  Đã liên kết: <span className="font-mono text-slate-700">{maskId(user.zaloRecipientId)}</span>
                </p>
              ) : (
                <p className="text-sm text-slate-500 mt-1">Chưa liên kết — thực hiện các bước bên dưới để liên kết.</p>
              )}
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
              user?.zaloRecipientId
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}>
              {user?.zaloRecipientId ? "Đã liên kết" : "Chưa liên kết"}
            </span>
          </div>
          {user?.zaloRecipientId ? (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-slate-500">Hủy liên kết để đổi sang tài khoản Zalo khác.</p>
              <button
                onClick={unlinkZalo}
                disabled={saving}
                className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                Hủy liên kết
              </button>
            </div>
          ) : (
            <div className="mt-4 bg-slate-50 rounded-lg p-4 text-sm text-slate-700 space-y-2">
              <p className="font-medium text-slate-800">Hướng dẫn liên kết Zalo:</p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Quét mã QR Zalo OA (nút <strong>&quot;Zalo hỗ trợ&quot;</strong> góc trái màn hình)</li>
                <li>Nhắn mã đơn hàng của bạn, ví dụ: <span className="font-mono bg-white px-1.5 py-0.5 rounded border">BTH123456</span></li>
                <li>Sau khi xác nhận thành công, hệ thống sẽ tự động liên kết tài khoản Zalo của bạn</li>
              </ol>
              <p className="text-xs text-slate-500 mt-2">
                Sau khi liên kết, bạn sẽ nhận thông báo cập nhật đơn hàng, khiếu nại và ví tiền qua Zalo.
              </p>
            </div>
          )}
          {saveMsg && saveMsg.includes("Zalo") && (
            <p className={`text-xs mt-2 ${saveMsg.includes("hủy") ? "text-emerald-600" : "text-red-600"}`}>
              {saveMsg}
            </p>
          )}
        </Card>

        {/* Telegram */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-lg">📨</span> Telegram
              </h3>
              {user?.telegramChatId ? (
                <p className="text-sm text-slate-500 mt-1">
                  Đã liên kết: <span className="font-mono text-slate-700">{maskId(user.telegramChatId)}</span>
                </p>
              ) : (
                <p className="text-sm text-slate-500 mt-1">Chưa liên kết — nhập Chat ID để nhận thông báo qua Telegram.</p>
              )}
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
              user?.telegramChatId
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}>
              {user?.telegramChatId ? "Đã liên kết" : "Chưa liên kết"}
            </span>
          </div>

          <div className="mt-4 bg-slate-50 rounded-lg p-4 text-sm text-slate-700 space-y-3">
            <p className="font-medium text-slate-800">Hướng dẫn lấy Chat ID:</p>
            <ol className="list-decimal list-inside space-y-1.5">
              <li>Mở ứng dụng Telegram</li>
              <li>Tìm bot <span className="font-mono bg-white px-1.5 py-0.5 rounded border">@userinfobot</span> và gửi bất kỳ tin nhắn nào</li>
              <li>Bot sẽ trả về Chat ID của bạn (dãy số)</li>
              <li>Nhập Chat ID vào ô bên dưới và nhấn &quot;Lưu&quot;</li>
            </ol>

            <div className="flex items-center gap-2 mt-3">
              <input
                type="text"
                value={telegramInput}
                onChange={(e) => setTelegramInput(e.target.value)}
                placeholder="Nhập Telegram Chat ID..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={saveTelegram}
                disabled={saving || !telegramInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
              {user?.telegramChatId && (
                <button
                  onClick={unlinkTelegram}
                  disabled={saving}
                  className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  Hủy liên kết
                </button>
              )}
            </div>
            {saveMsg && (
              <p className={`text-xs mt-1 ${saveMsg.includes("thành công") || saveMsg.includes("hủy") ? "text-emerald-600" : "text-red-600"}`}>
                {saveMsg}
              </p>
            )}
          </div>
        </Card>

        {/* Messenger/Facebook */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-lg">💭</span> Messenger / Facebook
              </h3>
              <p className="text-sm text-slate-500 mt-1">Hỗ trợ chat trực tiếp. Chưa hỗ trợ thông báo chủ động.</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              Chỉ chat
            </span>
          </div>
          <div className="mt-3 text-sm text-slate-500 space-y-2">
            <p>Nhắn tin cho Fanpage để được hỗ trợ trực tiếp.</p>
            <p className="text-xs text-slate-400">Hiện tại Messenger chỉ dùng để chat hỗ trợ, chưa có hủy/liên kết thông báo chủ động. Tính năng này sẽ được bổ sung trong tương lai.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
