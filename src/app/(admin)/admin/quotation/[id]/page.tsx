"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n";

interface QuotationDetail {
  id: string;
  requestCode: string;
  status: string;
  serviceType: string;
  serviceDetail: string | null;
  cargoDescription: string | null;
  cargoWeight: string | null;
  cargoVolume: string | null;
  originCity: string | null;
  destinationCity: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  companyName: string | null;
  quotedPrice: string | null;
  quotedNote: string | null;
  quotedAt: string | null;
  adminNote: string | null;
  createdAt: string;
  responder: { id: string; fullName: string } | null;
}

const SERVICE_ICONS: Record<string, string> = {
  IMPORT_EXPORT: "🚢",
  CUSTOMS_CLEARANCE: "🛃",
  DOMESTIC_TRANSPORT: "🚛",
  WAREHOUSE_STORAGE: "🏭",
  INTERNATIONAL_TRADE: "🌐",
  OTHER: "📋",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-yellow-100 text-yellow-700",
  CONTACTED: "bg-blue-100 text-blue-700",
  QUOTED: "bg-purple-100 text-purple-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-500",
};

const STATUSES = ["NEW", "CONTACTED", "QUOTED", "ACCEPTED", "REJECTED", "EXPIRED"];

export default function AdminQuotationDetailPage() {
  const { t } = useI18n();
  const params = useParams();
  const id = params.id as string;

  const [detail, setDetail] = useState<QuotationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [statusUpdate, setStatusUpdate] = useState("");
  const [priceUpdate, setPriceUpdate] = useState("");
  const [noteUpdate, setNoteUpdate] = useState("");
  const [quotedNoteUpdate, setQuotedNoteUpdate] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/quotation/${id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) {
          setDetail(data);
          setStatusUpdate(data.status);
          setPriceUpdate(data.quotedPrice || "");
          setNoteUpdate(data.adminNote || "");
          setQuotedNoteUpdate(data.quotedNote || "");
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
      const res = await fetch(`/api/admin/quotation/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusUpdate,
          quotedPrice: priceUpdate || null,
          quotedNote: quotedNoteUpdate || null,
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

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={`${SERVICE_ICONS[detail.serviceType] || "💰"} ${detail.requestCode}`}
        subtitle={t(`quotation.serviceType.${detail.serviceType}`)}
        action={
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[detail.status] || "bg-gray-100 text-gray-600"}`}>
            {t(`quotation.status.${detail.status}`)}
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Request Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Contact */}
          <Card>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">👤 {t("quotation.contactInfo")}</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-400 text-xs">{t("quotation.contactName")}</span><p className="font-medium">{detail.contactName}</p></div>
              <div><span className="text-gray-400 text-xs">{t("quotation.contactEmail")}</span><p className="font-medium">{detail.contactEmail}</p></div>
              <div><span className="text-gray-400 text-xs">{t("quotation.contactPhone")}</span><p className="font-medium">{detail.contactPhone}</p></div>
              {detail.companyName && (
                <div><span className="text-gray-400 text-xs">{t("quotation.companyName")}</span><p className="font-medium">{detail.companyName}</p></div>
              )}
            </div>
          </Card>

          {/* Service Detail */}
          {detail.serviceDetail && (
            <Card>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">📝 {t("quotation.serviceDetail")}</h4>
              <p className="text-sm text-gray-600">{detail.serviceDetail}</p>
            </Card>
          )}

          {/* Cargo & Route */}
          {(detail.cargoDescription || detail.cargoWeight || detail.originCity) && (
            <Card>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">📦 {t("quotation.cargoRoute")}</h4>
              {detail.cargoDescription && <p className="text-sm text-gray-600 mb-2">{detail.cargoDescription}</p>}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><span className="text-gray-400 text-xs">{t("quotation.cargoWeight")}</span><p className="font-medium">{detail.cargoWeight ? `${detail.cargoWeight} kg` : "—"}</p></div>
                <div><span className="text-gray-400 text-xs">{t("quotation.cargoVolume")}</span><p className="font-medium">{detail.cargoVolume ? `${detail.cargoVolume} m³` : "—"}</p></div>
                <div><span className="text-gray-400 text-xs">{t("quotation.originCity")}</span><p className="font-medium">{detail.originCity || "—"}</p></div>
                <div><span className="text-gray-400 text-xs">{t("quotation.destinationCity")}</span><p className="font-medium">{detail.destinationCity || "—"}</p></div>
              </div>
            </Card>
          )}

          {/* Current Quote */}
          {detail.quotedPrice && (
            <Card>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">💰 {t("quotation.currentQuote")}</h4>
              <p className="text-2xl font-bold text-green-700 mb-1">
                {Number(detail.quotedPrice).toLocaleString("vi-VN")} ₫
              </p>
              {detail.quotedNote && <p className="text-sm text-gray-600 mb-1">{detail.quotedNote}</p>}
              {detail.quotedAt && (
                <p className="text-xs text-gray-400">
                  {t("quotation.quotedAt")}: {new Date(detail.quotedAt).toLocaleString("vi-VN")}
                  {detail.responder && ` · ${detail.responder.fullName}`}
                </p>
              )}
            </Card>
          )}
        </div>

        {/* Right: Admin Controls */}
        <div className="space-y-4">
          <Card>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">⚙️ {t("quotation.adminControls")}</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t("common.status")}</label>
                <select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{t(`quotation.status.${s}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t("quotation.quotedPrice")}</label>
                <input
                  type="number"
                  value={priceUpdate}
                  onChange={(e) => setPriceUpdate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="VND"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t("quotation.quotedNote")}</label>
                <textarea
                  value={quotedNoteUpdate}
                  onChange={(e) => setQuotedNoteUpdate(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t("quotation.quotedNotePlaceholder")}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t("quotation.adminNote")}</label>
                <textarea
                  value={noteUpdate}
                  onChange={(e) => setNoteUpdate(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? t("common.saving") : t("quotation.updateRequest")}
              </button>
            </div>
          </Card>

          {/* Timeline */}
          <Card>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">🕐 {t("quotation.timeline")}</h4>
            <div className="space-y-2 text-xs text-gray-500">
              <p>{t("common.createdAt")}: {new Date(detail.createdAt).toLocaleString("vi-VN")}</p>
              {detail.quotedAt && <p>{t("quotation.quotedAt")}: {new Date(detail.quotedAt).toLocaleString("vi-VN")}</p>}
              {detail.responder && <p>{t("quotation.respondedBy")}: {detail.responder.fullName}</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
