"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotifState {
  notifications: Notification[];
  unreadCount: number;
}

async function fetchNotifData(): Promise<NotifState | null> {
  try {
    const res = await fetch("/api/notifications?limit=5");
    if (!res.ok) return null;
    const data = await res.json();
    return {
      notifications: data.notifications || [],
      unreadCount: data.unreadCount ?? 0,
    };
  } catch {
    return null;
  }
}

function formatTimeAgo(dateStr: string, nowMs: number, t: (k: string) => string): string {
  const diff = nowMs - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("notif.justNow");
  if (mins < 60) return `${mins}${t("notif.minAgo")}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}${t("notif.hrAgo")}`;
  const days = Math.floor(hrs / 24);
  return `${days}${t("notif.dayAgo")}`;
}

function getNotifIcon(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("giao thành công") || t.includes("hoàn tất") || t.includes("completed")) return "✅";
  if (t.includes("giao") || t.includes("delivery")) return "🚚";
  if (t.includes("thanh toán") || t.includes("nạp") || t.includes("tiền") || t.includes("wallet")) return "💰";
  if (t.includes("khiếu nại") || t.includes("cảnh báo") || t.includes("lỗi")) return "⚠️";
  if (t.includes("cập nhật") || t.includes("trạng thái")) return "📦";
  return "🔔";
}

export default function NotificationDropdown() {
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [renderTime, setRenderTime] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const load = () => {
      fetchNotifData().then((result) => {
        if (active && result) {
          setNotifications(result.notifications);
          setUnreadCount(result.unreadCount);
        }
      });
    };
    load();
    const interval = setInterval(load, 30_000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  function handleToggle() {
    const opening = !open;
    if (opening) {
      setLoading(true);
      setRenderTime(Date.now());
      fetchNotifData().then((result) => {
        if (result) {
          setNotifications(result.notifications);
          setUnreadCount(result.unreadCount);
        }
        setLoading(false);
      });
    }
    setOpen(opening);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleToggle}
        className="relative flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-150"
      >
        <span className="text-base w-6 text-center flex-shrink-0">🔔</span>
        <span>{t("nav.notifications")}</span>
        {unreadCount > 0 && (
          <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 bottom-full mb-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">{t("nav.notifications")}</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                {t("notif.markAllRead")}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">{t("common.loading")}</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <span className="text-2xl block mb-2">🔔</span>
                <p className="text-sm text-slate-400">Chưa có thông báo mới.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    n.isRead
                      ? "bg-white hover:bg-slate-50 border-b border-slate-50"
                      : "bg-blue-50/60 hover:bg-blue-100/60 border-l-[3px] border-l-blue-500 border-b border-b-blue-100"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-base mt-0.5 flex-shrink-0">{getNotifIcon(n.title)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${n.isRead ? "text-slate-600" : "font-semibold text-slate-900"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{n.message}</p>
                      <p className="text-[11px] text-slate-300 mt-1">{formatTimeAgo(n.createdAt, renderTime, t)}</p>
                    </div>
                    {!n.isRead && <span className="w-2 h-2 mt-1.5 bg-blue-600 rounded-full flex-shrink-0" />}
                  </div>
                </div>
              ))
            )}
          </div>

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-center text-xs font-medium text-blue-600 hover:bg-slate-50 border-t border-slate-100 transition-colors"
          >
            {t("notif.viewAll")}
          </Link>
        </div>
      )}
    </div>
  );
}
