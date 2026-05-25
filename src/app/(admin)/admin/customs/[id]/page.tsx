"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n";

interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
}

interface CustomsDetail {
  id: string;
  requestCode: string;
  declarationType: string;
  status: string;
  accompanyingServices: string | null;
  goodsDescription: string | null;
  hsCode: string | null;
  goodsValue: string | null;
  goodsCurrency: string | null;
  goodsWeight: string | null;
  goodsQuantity: number | null;
  originCountry: string | null;
  destinationPort: string | null;
  companyName: string | null;
  taxCode: string | null;
  companyAddress: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  documents: string | null;
  quotedPrice: string | null;
  quotedAt: string | null;
  customerNote: string | null;
  adminNote: string | null;
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

export default function AdminCustomsDetailPage() {
  const { t } = useI18n();
  const params = useParams();
  const [detail, setDetail] = useState<CustomsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [quotedPrice, setQuotedPrice] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/customs/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setDetail(data);
        setNewStatus(data.status);
        setAdminNote(data.adminNote || "");
        setQuotedPrice(data.quotedPrice || "");
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleUpdate = async () => {
    setUpdating(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/customs/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          adminNote: adminNote || undefined,
          quotedPrice: quotedPrice || undefined,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDetail(updated);
        setMessage(t("customs.updateSuccess"));
      } else {
        setMessage(t("customs.updateError"));
      }
    } catch {
      setMessage(t("customs.updateError"));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!detail) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("customs.notFound")}</p>
        <Link href="/admin/customs" className="text-blue-600 text-sm mt-2 inline-block">
          ← {t("customs.backToList")}
        </Link>
      </div>
    );
  }

  const services: string[] = detail.accompanyingServices
    ? JSON.parse(detail.accompanyingServices)
    : [];

  interface DocItem {
    url: string;
    name: string;
    type?: string;
  }

  const docs: DocItem[] = detail.documents ? JSON.parse(detail.documents) : [];

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={`${DECLARATION_ICONS[detail.declarationType] || "📋"} ${detail.requestCode}`}
        subtitle={t(`customs.declarationType.${detail.declarationType}`)}
        action={
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              STATUS_COLORS[detail.status] || "bg-gray-100 text-gray-600"
            }`}
          >
            {t(`customs.status.${detail.status}`)}
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Detail Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Info */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              👤 {t("customs.customerInfo")}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">{t("common.fullName")}:</span>
                <span className="ml-1 font-medium">{detail.customer.fullName}</span>
              </div>
              <div>
                <span className="text-gray-500">{t("common.email")}:</span>
                <span className="ml-1 font-medium">{detail.customer.email}</span>
              </div>
              {detail.customer.phone && (
                <div>
                  <span className="text-gray-500">{t("common.phone")}:</span>
                  <span className="ml-1 font-medium">{detail.customer.phone}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Goods Info */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              📦 {t("customs.goodsInfo")}
            </h3>
            {detail.goodsDescription && (
              <p className="text-sm text-gray-800 mb-3">{detail.goodsDescription}</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {detail.hsCode && (
                <div>
                  <span className="text-gray-500">{t("customs.hsCode")}:</span>
                  <span className="ml-1 font-medium">{detail.hsCode}</span>
                </div>
              )}
              {detail.goodsValue && (
                <div>
                  <span className="text-gray-500">{t("customs.goodsValue")}:</span>
                  <span className="ml-1 font-medium">
                    {Number(detail.goodsValue).toLocaleString()} {detail.goodsCurrency}
                  </span>
                </div>
              )}
              {detail.goodsWeight && (
                <div>
                  <span className="text-gray-500">{t("customs.goodsWeight")}:</span>
                  <span className="ml-1 font-medium">{detail.goodsWeight} kg</span>
                </div>
              )}
              {detail.goodsQuantity && (
                <div>
                  <span className="text-gray-500">{t("customs.goodsQuantity")}:</span>
                  <span className="ml-1 font-medium">{detail.goodsQuantity}</span>
                </div>
              )}
              {detail.originCountry && (
                <div>
                  <span className="text-gray-500">{t("customs.originCountry")}:</span>
                  <span className="ml-1 font-medium">{detail.originCountry}</span>
                </div>
              )}
              {detail.destinationPort && (
                <div>
                  <span className="text-gray-500">{t("customs.destinationPort")}:</span>
                  <span className="ml-1 font-medium">{detail.destinationPort}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Accompanying Services */}
          {services.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                🔧 {t("customs.accompanyingServices")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {services.map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium"
                  >
                    {t(`customs.service.${s}`)}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Company Info */}
          {(detail.companyName || detail.taxCode || detail.contactName) && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                🏢 {t("customs.companyInfo")}
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {detail.companyName && (
                  <div>
                    <span className="text-gray-500">{t("customs.companyName")}:</span>
                    <span className="ml-1 font-medium">{detail.companyName}</span>
                  </div>
                )}
                {detail.taxCode && (
                  <div>
                    <span className="text-gray-500">{t("customs.taxCode")}:</span>
                    <span className="ml-1 font-medium">{detail.taxCode}</span>
                  </div>
                )}
                {detail.companyAddress && (
                  <div className="col-span-2">
                    <span className="text-gray-500">{t("customs.companyAddress")}:</span>
                    <span className="ml-1 font-medium">{detail.companyAddress}</span>
                  </div>
                )}
                {detail.contactName && (
                  <div>
                    <span className="text-gray-500">{t("customs.contactName")}:</span>
                    <span className="ml-1 font-medium">{detail.contactName}</span>
                  </div>
                )}
                {detail.contactPhone && (
                  <div>
                    <span className="text-gray-500">{t("customs.contactPhone")}:</span>
                    <span className="ml-1 font-medium">{detail.contactPhone}</span>
                  </div>
                )}
                {detail.contactEmail && (
                  <div>
                    <span className="text-gray-500">{t("customs.contactEmail")}:</span>
                    <span className="ml-1 font-medium">{detail.contactEmail}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Documents */}
          {docs.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                📎 {t("customs.documents")}
              </h3>
              <div className="space-y-2">
                {docs.map((doc, i) => (
                  <a
                    key={i}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-sm"
                  >
                    <span>📎</span>
                    <span className="text-blue-600 hover:underline">{doc.name}</span>
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Customer Note */}
          {detail.customerNote && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                📝 {t("customs.customerNote")}
              </h3>
              <p className="text-sm text-gray-800">{detail.customerNote}</p>
            </Card>
          )}
        </div>

        {/* Right: Admin Controls */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              ⚙️ {t("customs.adminControls")}
            </h3>

            {message && (
              <div
                className={`mb-3 p-2 rounded-lg text-sm ${
                  message.includes("Error") || message.includes("lỗi")
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {message}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  {t("customs.changeStatus")}
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`customs.status.${s}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  {t("customs.quotedPrice")} (VNĐ)
                </label>
                <input
                  type="number"
                  value={quotedPrice}
                  onChange={(e) => setQuotedPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  {t("customs.adminNote")}
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t("customs.adminNotePlaceholder")}
                />
              </div>

              <button
                onClick={handleUpdate}
                disabled={updating}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {updating ? t("common.saving") : t("customs.updateRequest")}
              </button>
            </div>
          </Card>

          {/* Timeline Info */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              📅 {t("customs.timeline")}
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">{t("customs.createdAt")}:</span>
                <p className="font-medium">
                  {new Date(detail.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              {detail.quotedAt && (
                <div>
                  <span className="text-gray-500">{t("customs.quotedAt")}:</span>
                  <p className="font-medium">
                    {new Date(detail.quotedAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              )}
              {detail.quotedPrice && (
                <div>
                  <span className="text-gray-500">{t("customs.quotedPrice")}:</span>
                  <p className="font-medium text-green-600">
                    {Number(detail.quotedPrice).toLocaleString()} VNĐ
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6 mb-8">
        <Link
          href="/admin/customs"
          className="text-blue-600 text-sm hover:underline"
        >
          ← {t("customs.backToList")}
        </Link>
      </div>
    </div>
  );
}
