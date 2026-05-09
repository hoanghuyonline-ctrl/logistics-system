"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications?limit=50")
      .then((r) => r.json())
      .then((d) => {
        setNotifications(d.notifications || []);
        setLoading(false);
      });
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  if (loading) return <LoadingSpinner text="Đang tải thông báo..." />;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <PageHeader
        title="Thông báo"
        subtitle={unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Đã đọc hết"}
        action={
          unreadCount > 0 ? (
            <button onClick={markAllRead} className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
              Đánh dấu tất cả đã đọc
            </button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState icon="🔔" title="Chưa có thông báo" description="Bạn sẽ nhận thông báo khi đơn hàng có cập nhật mới" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markRead(n.id)}
              className={`rounded-2xl border p-5 cursor-pointer transition-all duration-200 ${
                n.isRead
                  ? "bg-white border-slate-200 hover:border-slate-300"
                  : "bg-blue-50/50 border-blue-200 hover:bg-blue-50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {!n.isRead && <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />}
                    <h3 className={`text-sm font-semibold ${n.isRead ? "text-slate-700" : "text-slate-900"}`}>
                      {n.title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{n.message}</p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap font-medium">
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
