"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
  customer: { id: string; fullName: string; email: string; phone: string | null };
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

export default function AdminTransportDetailPage() {
  const { t } = useI18n();
  const params = useParams();
  const id = params.id as string;

  const [detail, setDetail] = useState<TransportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [statusUpdate, setStatusUpdate] = useState("");
  const [priceUpdate, setPriceUpdate] = useState("");
  const [noteUpdate, setNoteUpdate] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/transport/${id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) {
          setDetail(data);
          setStatusUpdate(data.status);
          setPriceUpdate(data.quotedPrice || "");
          setNoteUpdate(data.adminNote || "");
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/transport/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusUpdate,
          quotedPrice: priceUpdate || null,
          adminNote: noteUpdate || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDetail(updated);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!detail) return <div className="text-center py-8 text-gray-500">{t("common.notFound")}</div>;

  const isWarehouse = detail.serviceType === "TRANSIT_WAREHOUSE";
  const isTransport = detail.serviceType === "TRUCK_NORTH_SOUTH" || detail.serviceType === "INNER_CITY_DELIVERY";

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={`${SERVICE_ICONS[detail.serviceType] || "🚚"} ${detail.requestCode}`}
        subtitle={t(`transport.serviceType.${detail.serviceType}`)}
        action={
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[detail.status] || "bg-gray-100 text-gray-600"}`}>
            {t(`transport.status.${detail.status}`)}
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Detail Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer */}
          <Card>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">👤 {t("transport.customerInfo")}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-400 text-xs">{t("common.fullName")}</span><p className="font-medium">{detail.customer.fullName}</p></div>
              <div><span className="text-gray-400 text-xs">{t("common.email")}</span><p className="font-medium">{detail.customer.email}</p></div>
              {detail.customer.phone && (
                <div><span className="text-gray-400 text-xs">{t("common.phone")}</span><p className="font-medium">{detail.customer.phone}</p></div>
              )}
            </div>
          </Card>

          {/* Route Info */}
          {isTransport && (
            <Card>
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
            <Card>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">🏭 {t("transport.warehouseInfo")}</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-400 text-xs">{t("transport.warehouseCity")}</span><p className="font-medium">{detail.warehouseCity || "—"}</p></div>
                <div><span className="text-gray-400 text-xs">{t("transport.storageDuration")}</span><p className="font-medium">{detail.storageDuration ? `${detail.storageDuration} ${t("transport.days")}` : "—"}</p></div>
              </div>
              {detail.storageNote && <p className="text-sm text-gray-600 mt-2">{detail.storageNote}</p>}
            </Card>
          )}

          {/* Cargo */}
          <Card>
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

          {/* Customer Note */}
          {detail.customerNote && (
            <Card>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">📝 {t("transport.customerNote")}</h4>
              <p className="text-sm text-gray-600">{detail.customerNote}</p>
            </Card>
          )}
        </div>

        {/* Right: Admin Controls */}
        <div className="space-y-4">
          <Card>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">⚙️ {t("transport.adminControls")}</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t("common.status")}</label>
                <select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{t(`transport.status.${s}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t("transport.quotedPrice")}</label>
                <input
                  type="number"
                  value={priceUpdate}
                  onChange={(e) => setPriceUpdate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="VND"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t("transport.adminNote")}</label>
                <textarea
                  value={noteUpdate}
                  onChange={(e) => setNoteUpdate(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? t("common.saving") : t("transport.updateRequest")}
              </button>
            </div>
          </Card>

          {/* Timeline */}
          <Card>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">🕐 {t("transport.timeline")}</h4>
            <div className="space-y-2 text-xs text-gray-500">
              <p>{t("common.createdAt")}: {new Date(detail.createdAt).toLocaleString("vi-VN")}</p>
              {detail.quotedAt && <p>{t("transport.quotedAt")}: {new Date(detail.quotedAt).toLocaleString("vi-VN")}</p>}
              {detail.quotedPrice && <p>{t("transport.quotedPrice")}: {Number(detail.quotedPrice).toLocaleString("vi-VN")} ₫</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
