"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

interface Issue {
  id: string;
  orderCode: string | null;
  issueType: string;
  description: string;
  status: string;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  THIEU_HANG: "Thiếu hàng",
  GIAO_CHAM: "Giao chậm",
  SAI_CAN: "Sai cân nặng",
  HONG_HANG: "Hỏng hàng",
  CHUA_NHAN: "Chưa nhận được hàng",
  PHI_SAI: "Phí sai",
  CHATBOT: "Chatbot/Hỗ trợ",
  KHAC: "Khác",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "Mới",
  IN_PROGRESS: "Đang xử lý",
  WAITING_CUSTOMER: "Chờ khách phản hồi",
  RESOLVED: "Đã giải quyết",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-red-100 text-red-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  WAITING_CUSTOMER: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
};

export default function CustomerIssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/customer/issues")
      .then((r) => r.json())
      .then((d) => {
        setIssues(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Đang tải khiếu nại..." />;

  const unresolved = issues.filter((i) => i.status !== "RESOLVED").length;

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Khiếu Nại / Hỗ Trợ"
        subtitle={`${unresolved} chưa giải quyết / ${issues.length} tổng`}
      />

      {issues.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <span className="text-3xl">📋</span>
            <p className="text-sm text-slate-500 mt-3">Bạn chưa có khiếu nại nào</p>
            <p className="text-xs text-slate-400 mt-1">
              Bạn có thể gửi khiếu nại từ trang chi tiết đơn hàng
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <Card key={issue.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${STATUS_COLORS[issue.status] || "bg-slate-100 text-slate-700"}`}>
                      {STATUS_LABELS[issue.status] || issue.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {TYPE_LABELS[issue.issueType] || issue.issueType}
                    </span>
                  </div>
                  {issue.orderCode && (
                    <p className="text-xs text-slate-500 mb-1">Đơn hàng: {issue.orderCode}</p>
                  )}
                  <p className="text-sm text-slate-700 line-clamp-2">{issue.description}</p>
                  {issue.resolution && (
                    <div className="mt-2 p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                      <p className="text-xs font-medium text-emerald-700">Phản hồi:</p>
                      <p className="text-xs text-emerald-600 mt-0.5">{issue.resolution}</p>
                    </div>
                  )}
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {new Date(issue.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
