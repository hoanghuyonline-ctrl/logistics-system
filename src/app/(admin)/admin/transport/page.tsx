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

interface TransportReq {
  id: string;
  requestCode: string;
  serviceType: string;
  status: string;
  pickupCity: string | null;
  deliveryCity: string | null;
  warehouseCity: string | null;
  cargoDescription: string | null;
  quotedPrice: string | null;
  createdAt: string;
  customer: Customer;
}

const SERVICE_ICONS: Record<string, string> = {
  TRUCK_NORTH_SOUTH: "🚛",
  INNER_CITY_DELIVERY: "🏍️",
  TRANSIT_WAREHOUSE: "🏭",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  REVIEWING: "bg-blue-100 text-blue-700",
  QUOTED: "bg-purple-100 text-purple-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  IN_TRANSIT: "bg-cyan-100 text-cyan-700",
  DELIVERED: "bg-teal-100 text-teal-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const STATUSES = ["PENDING", "REVIEWING", "QUOTED", "CONFIRMED", "IN_TRANSIT", "DELIVERED", "COMPLETED", "CANCELLED"];
const SERVICE_TYPES = ["TRUCK_NORTH_SOUTH", "INNER_CITY_DELIVERY", "TRANSIT_WAREHOUSE"];

export default function AdminTransportPage() {
  const { t } = useI18n();
  const [requests, setRequests] = useState<TransportReq[]>([]);
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
    if (typeFilter) params.set("serviceType", typeFilter);
    if (search) params.set("search", search);

    fetch(`/api/admin/transport?${params}`)
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
        title={t("transport.adminTitle")}
        subtitle={t("transport.adminSubtitle")}
      />

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">{t("common.search")}</label>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t("transport.searchPlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t("common.status")}</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t("common.all")}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{t(`transport.status.${s}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t("transport.serviceTypeLabel")}</label>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t("common.all")}</option>
              {SERVICE_TYPES.map((st) => (
                <option key={st} value={st}>{t(`transport.serviceType.${st}`)}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner />
      ) : requests.length === 0 ? (
        <EmptyState
          icon="🚚"
          title={t("transport.empty")}
          description={t("transport.emptyDesc")}
        />
      ) : (
        <>
          <div className="space-y-3">
            {requests.map((req) => (
              <Link key={req.id} href={`/admin/transport/${req.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{SERVICE_ICONS[req.serviceType] || "🚚"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold text-gray-900">{req.requestCode}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[req.status] || "bg-gray-100 text-gray-600"}`}>
                          {t(`transport.status.${req.status}`)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{t(`transport.serviceType.${req.serviceType}`)}</p>
                      {req.serviceType === "TRANSIT_WAREHOUSE" ? (
                        req.warehouseCity && <p className="text-xs text-gray-500 mt-1">📍 {req.warehouseCity}</p>
                      ) : (
                        (req.pickupCity || req.deliveryCity) && (
                          <p className="text-xs text-gray-500 mt-1">📍 {req.pickupCity || "—"} → {req.deliveryCity || "—"}</p>
                        )
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        👤 {req.customer.fullName} · {req.customer.email}
                        {req.customer.phone && ` · ${req.customer.phone}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString("vi-VN")}</p>
                      {req.quotedPrice && (
                        <p className="text-sm font-semibold text-green-600 mt-1">
                          {Number(req.quotedPrice).toLocaleString("vi-VN")} ₫
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
