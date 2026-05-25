"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import { useI18n } from "@/lib/i18n";

interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
}

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
  customer: Customer;
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

const STATUSES = [
  "PENDING",
  "REVIEWING",
  "QUOTED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

const DECLARATION_TYPES = [
  "KINH_DOANH",
  "GIA_CONG",
  "SAN_XUAT_XUAT_KHAU",
  "TAM_NHAP_TAI_XUAT",
  "PHI_MAU_DICH",
];

export default function AdminCustomsPage() {
  const { t } = useI18n();
  const [requests, setRequests] = useState<CustomsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("declarationType", typeFilter);
    if (search) params.set("search", search);

    fetch(`/api/admin/customs?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setRequests(data.requests || []);
          setTotalPages(data.totalPages || 1);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRequests([]);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [page, statusFilter, typeFilter, search]);

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title={t("customs.adminTitle")}
        subtitle={t("customs.adminSubtitle")}
      />

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">
              {t("common.search")}
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t("customs.searchPlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {t("customs.statusFilter")}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t("common.all")}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`customs.status.${s}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {t("customs.typeFilter")}
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t("common.all")}</option>
              {DECLARATION_TYPES.map((dt) => (
                <option key={dt} value={dt}>
                  {t(`customs.declarationType.${dt}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner />
      ) : requests.length === 0 ? (
        <EmptyState
          icon="📋"
          title={t("customs.adminEmpty")}
          description={t("customs.adminEmptyDesc")}
        />
      ) : (
        <>
          <div className="space-y-3">
            {requests.map((req) => {
              const services: string[] = req.accompanyingServices
                ? JSON.parse(req.accompanyingServices)
                : [];
              return (
                <Link key={req.id} href={`/admin/customs/${req.id}`}>
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
                        <p className="text-xs text-gray-500 mt-0.5">
                          👤 {req.customer.fullName} — {req.customer.email}
                          {req.customer.phone && ` — ${req.customer.phone}`}
                        </p>
                        {req.goodsDescription && (
                          <p className="text-sm text-gray-500 truncate mt-1">
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

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
