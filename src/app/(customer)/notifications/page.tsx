"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

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

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <button onClick={markAllRead} className="text-sm text-blue-600 hover:underline">
          Mark all as read
        </button>
      </div>

      <div className="space-y-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => !n.isRead && markRead(n.id)}
            className={`p-4 rounded-lg border cursor-pointer transition ${
              n.isRead ? "bg-white" : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className={`text-sm font-medium ${n.isRead ? "text-gray-700" : "text-blue-900"}`}>
                  {!n.isRead && <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2" />}
                  {n.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{n.message}</p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                {new Date(n.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="text-center text-gray-500 py-8">No notifications</p>
        )}
      </div>
    </div>
  );
}
