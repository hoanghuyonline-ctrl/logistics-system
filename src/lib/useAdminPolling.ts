"use client";

import { useEffect, useRef, useCallback } from "react";

export interface QuickViewCounts {
  unpaidOrders: number;
  stuckChina: number;
  stuckVietnam: number;
  staleOrders: number;
  unresolvedIssues: number;
  notifFailures: number;
  unansweredQuestions: number;
  unresolvedNotes: number;
  pendingDeposits: number;
}

interface AlertChange {
  label: string;
  prev: number;
  next: number;
}

const ALERT_FIELDS: Array<{ key: keyof QuickViewCounts; label: string }> = [
  { key: "pendingDeposits", label: "Yêu cầu nạp tiền mới" },
  { key: "unpaidOrders", label: "Đơn hàng mới chờ xử lý" },
  { key: "unresolvedIssues", label: "Khiếu nại mới" },
  { key: "notifFailures", label: "Lỗi thông báo mới" },
  { key: "unansweredQuestions", label: "Câu hỏi chatbot mới" },
  { key: "stuckChina", label: "Đơn kẹt kho Trung Quốc" },
  { key: "stuckVietnam", label: "Đơn kẹt kho Việt Nam" },
];

export function useAdminPolling(
  onUpdate: (data: QuickViewCounts) => void,
  onAlerts: (alerts: AlertChange[]) => void,
  intervalMs = 25000,
) {
  const prevRef = useRef<QuickViewCounts | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/quick-views");
      if (!res.ok) return;
      const data: QuickViewCounts = await res.json();

      if (prevRef.current) {
        const alerts: AlertChange[] = [];
        for (const { key, label } of ALERT_FIELDS) {
          if (data[key] > prevRef.current[key]) {
            alerts.push({ label, prev: prevRef.current[key], next: data[key] });
          }
        }
        if (alerts.length > 0) onAlerts(alerts);
      }

      prevRef.current = data;
      onUpdate(data);
    } catch {
      // silently ignore network errors
    }
  }, [onUpdate, onAlerts]);

  useEffect(() => {
    timerRef.current = setInterval(poll, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [poll, intervalMs]);

  const seedPrev = useCallback((initial: QuickViewCounts) => {
    prevRef.current = initial;
  }, []);

  return { seedPrev };
}
