"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n";

interface TransportDetail {
  id: string;
  requestCode: string;
  serviceType: string;
  status: string;
  pickupAddress: string | null;
  pickupCity: string | null;
  pickupContactName: string | null;
  pickupContactPhone: string | null;
  pickupDate: string | null;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  deliveryContactName: string | null;
  deliveryContactPhone: string | null;
  cargoDescription: string | null;
  cargoWeight: string | null;
  cargoVolume: string | null;
  cargoQuantity: number | null;
  cargoType: string | null;
  requiresRefrigeration: boolean;
  warehouseCity: string | null;
  storageDuration: number | null;
  storageNote: string | null;
  quotedPrice: string | null;
  quotedAt: string | null;
  customerNote: string | null;
  adminNote: string | null;
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

export default function TransportDetailPage() {
  const { t } = useI18n();
  const params = useParams();
  const id = params.id as string;

  const [detail, setDetail] = useState<TransportDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/transport/${id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => { if (!cancelled) setDetail(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!detail) return <div className="text-center py-8 text-gray-500">{t("common.notFound")}</div>;

  const isWarehouse = detail.serviceType === "TRANSIT_WAREHOUSE";
  const isTransport = detail.serviceType === "TRUCK_NORTH_SOUTH" || detail.serviceType === "INNER_CITY_DELIVERY";

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={`${SERVICE_ICONS[detail.serviceType] || "🚚"} ${detail.requestCode}`}
        subtitle={t(`transport.serviceType.${detail.serviceType}`)}
        action={
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[detail.status] || "bg-gray-100 text-gray-600"}`}>
            {t(`transport.status.${detail.status}`)}
          </span>
        }
      />

      {/* Quoted Price Banner */}
      {detail.quotedPrice && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-lg font-bold text-green-700">
            💰 {Number(detail.quotedPrice).toLocaleString("vi-VN")} ₫
          </p>
          {detail.quotedAt && (
            <p className="text-xs text-green-600 mt-1">
              {t("transport.quotedAt")}: {new Date(detail.quotedAt).toLocaleString("vi-VN")}
            </p>
          )}
        </div>
      )}

      {/* Route Info */}
      {isTransport && (
        <Card className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">🗺️ {t("transport.routeInfo")}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-600 font-medium mb-1">📍 {t("transport.pickup")}</p>
              <p className="text-sm font-medium">{detail.pickupCity || "—"}</p>
              {detail.pickupAddress && <p className="text-xs text-gray-500 mt-1">{detail.pickupAddress}</p>}
              {detail.pickupContactName && <p className="text-xs text-gray-500">{detail.pickupContactName} · {detail.pickupContactPhone}</p>}
              {detail.pickupDate && <p className="text-xs text-gray-400">{new Date(detail.pickupDate).toLocaleDateString("vi-VN")}</p>}
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <p className="text-xs text-green-600 font-medium mb-1">🏠 {t("transport.delivery")}</p>
              <p className="text-sm font-medium">{detail.deliveryCity || "—"}</p>
              {detail.deliveryAddress && <p className="text-xs text-gray-500 mt-1">{detail.deliveryAddress}</p>}
              {detail.deliveryContactName && <p className="text-xs text-gray-500">{detail.deliveryContactName} · {detail.deliveryContactPhone}</p>}
            </div>
          </div>
        </Card>
      )}

      {/* Warehouse Info */}
      {isWarehouse && (
        <Card className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">🏭 {t("transport.warehouseInfo")}</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400 text-xs">{t("transport.warehouseCity")}</span><p className="font-medium">{detail.warehouseCity || "—"}</p></div>
            <div><span className="text-gray-400 text-xs">{t("transport.storageDuration")}</span><p className="font-medium">{detail.storageDuration ? `${detail.storageDuration} ${t("transport.days")}` : "—"}</p></div>
          </div>
          {detail.storageNote && (
            <div className="mt-2 text-sm text-gray-600">{detail.storageNote}</div>
          )}
        </Card>
      )}

      {/* Cargo Info */}
      <Card className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">📦 {t("transport.cargoInfo")}</h4>
        {detail.cargoDescription && <p className="text-sm text-gray-600 mb-2">{detail.cargoDescription}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div><span className="text-gray-400 text-xs">{t("transport.cargoWeight")}</span><p className="font-medium">{detail.cargoWeight ? `${detail.cargoWeight} kg` : "—"}</p></div>
          <div><span className="text-gray-400 text-xs">{t("transport.cargoVolume")}</span><p className="font-medium">{detail.cargoVolume ? `${detail.cargoVolume} m³` : "—"}</p></div>
          <div><span className="text-gray-400 text-xs">{t("transport.cargoQuantity")}</span><p className="font-medium">{detail.cargoQuantity || "—"}</p></div>
          <div><span className="text-gray-400 text-xs">{t("transport.cargoType")}</span><p className="font-medium">{detail.cargoType || "—"}</p></div>
        </div>
        {detail.requiresRefrigeration && (
          <p className="text-sm text-cyan-600 mt-2">❄️ {t("transport.requiresRefrigeration")}</p>
        )}
      </Card>

      {/* Notes */}
      {(detail.customerNote || detail.adminNote) && (
        <Card className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">📝 {t("transport.notes")}</h4>
          {detail.customerNote && (
            <div className="mb-2">
              <p className="text-xs text-gray-400">{t("transport.customerNote")}</p>
              <p className="text-sm text-gray-600">{detail.customerNote}</p>
            </div>
          )}
          {detail.adminNote && (
            <div>
              <p className="text-xs text-gray-400">{t("transport.adminNote")}</p>
              <p className="text-sm text-gray-600">{detail.adminNote}</p>
            </div>
          )}
        </Card>
      )}

      <div className="mb-8">
        <Link href="/transport" className="text-sm text-blue-600 hover:underline">
          ← {t("transport.backToList")}
        </Link>
      </div>
    </div>
  );
}
