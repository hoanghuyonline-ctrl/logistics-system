"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Card from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n";

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

export default function TransportListPage() {
  const { t } = useI18n();
  const [requests, setRequests] = useState<TransportReq[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/transport")
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setRequests(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setRequests([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title={t("transport.title")}
        subtitle={t("transport.subtitle")}
        action={
          <Link
            href="/transport/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
          >
            ➕ {t("transport.newRequest")}
          </Link>
        }
      />

      {requests.length === 0 ? (
        <EmptyState
          icon="🚚"
          title={t("transport.empty")}
          description={t("transport.emptyDesc")}
        />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Link key={req.id} href={`/transport/${req.id}`}>
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
                    <p className="text-sm text-gray-600">
                      {t(`transport.serviceType.${req.serviceType}`)}
                    </p>
                    {req.serviceType === "TRANSIT_WAREHOUSE" ? (
                      req.warehouseCity && (
                        <p className="text-xs text-gray-500 mt-1">📍 {req.warehouseCity}</p>
                      )
                    ) : (
                      (req.pickupCity || req.deliveryCity) && (
                        <p className="text-xs text-gray-500 mt-1">
                          📍 {req.pickupCity || "—"} → {req.deliveryCity || "—"}
                        </p>
                      )
                    )}
                    {req.cargoDescription && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{req.cargoDescription}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">
                      {new Date(req.createdAt).toLocaleDateString("vi-VN")}
                    </p>
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
      )}
    </div>
  );
}
