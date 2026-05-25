"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Card from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n";

interface CustomsRequest {
  id: string;
  requestCode: string;
  declarationType: string;
  status: string;
  accompanyingServices: string | null;
  goodsDescription: string | null;
  companyName: string | null;
  quotedPrice: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  REVIEWING: "bg-blue-100 text-blue-700",
  QUOTED: "bg-purple-100 text-purple-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  IN_PROGRESS: "bg-cyan-100 text-cyan-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const DECLARATION_ICONS: Record<string, string> = {
  KINH_DOANH: "🏪",
  GIA_CONG: "🏭",
  SAN_XUAT_XUAT_KHAU: "📦",
  TAM_NHAP_TAI_XUAT: "🔄",
  PHI_MAU_DICH: "📋",
};

export default function CustomsListPage() {
  const { t } = useI18n();
  const [requests, setRequests] = useState<CustomsRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/customs")
      .then((r) => r.json())
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title={t("customs.title")}
        subtitle={t("customs.subtitle")}
        action={
          <Link
            href="/customs/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
          >
            ➕ {t("customs.newRequest")}
          </Link>
        }
      />

      {requests.length === 0 ? (
        <EmptyState
          icon="📋"
          title={t("customs.empty")}
          description={t("customs.emptyDesc")}
        />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const services: string[] = req.accompanyingServices
              ? JSON.parse(req.accompanyingServices)
              : [];
            return (
              <Link key={req.id} href={`/customs/${req.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {DECLARATION_ICONS[req.declarationType] || "📋"}
                        </span>
                        <span className="font-semibold text-sm text-gray-900">
                          {req.requestCode}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_COLORS[req.status] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {t(`customs.status.${req.status}`)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 font-medium">
                        {t(`customs.declarationType.${req.declarationType}`)}
                      </p>
                      {req.goodsDescription && (
                        <p className="text-sm text-gray-500 truncate mt-0.5">
                          {req.goodsDescription}
                        </p>
                      )}
                      {services.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {services.map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
                            >
                              {t(`customs.service.${s}`)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">
                        {new Date(req.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                      {req.quotedPrice && (
                        <p className="text-sm font-semibold text-green-600 mt-1">
                          {Number(req.quotedPrice).toLocaleString()} VNĐ
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
