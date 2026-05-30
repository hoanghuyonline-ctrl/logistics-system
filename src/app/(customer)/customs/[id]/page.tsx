"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n";
import { safeJsonParse } from "@/lib/emoji-utils";

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

export default function CustomsDetailPage() {
  const { t } = useI18n();
  const params = useParams();
  const [detail, setDetail] = useState<CustomsDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customs/${params.id}`)
      .then((r) => r.json())
      .then((data) => setDetail(data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <LoadingSpinner />;
  if (!detail) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("customs.notFound")}</p>
        <Link href="/customs" className="text-blue-600 text-sm mt-2 inline-block">
          ← {t("customs.backToList")}
        </Link>
      </div>
    );
  }

  const services: string[] = safeJsonParse<string[]>(detail.accompanyingServices, []);

  interface DocItem {
    url: string;
    name: string;
    type?: string;
  }

  const docs: DocItem[] = safeJsonParse<DocItem[]>(detail.documents, []);

  return (
    <div className="max-w-3xl mx-auto">
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

      {/* Quoted Price Banner */}
      {detail.quotedPrice && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm text-green-700 font-medium">{t("customs.quotedPrice")}</p>
          <p className="text-2xl font-bold text-green-700">
            {Number(detail.quotedPrice).toLocaleString()} VNĐ
          </p>
          {detail.quotedAt && (
            <p className="text-xs text-green-500 mt-1">
              {t("customs.quotedAt")}: {new Date(detail.quotedAt).toLocaleString("vi-VN")}
            </p>
          )}
        </div>
      )}

      {/* Goods Info */}
      <Card className="mb-4">
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
        <Card className="mb-4">
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
        <Card className="mb-4">
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
        <Card className="mb-4">
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

      {/* Notes */}
      {(detail.customerNote || detail.adminNote) && (
        <Card className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            📝 {t("customs.notes")}
          </h3>
          {detail.customerNote && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">{t("customs.customerNote")}</p>
              <p className="text-sm text-gray-800">{detail.customerNote}</p>
            </div>
          )}
          {detail.adminNote && (
            <div className="border-t pt-3">
              <p className="text-xs text-gray-500 mb-1">{t("customs.adminNote")}</p>
              <p className="text-sm text-gray-800">{detail.adminNote}</p>
            </div>
          )}
        </Card>
      )}

      <div className="mb-8">
        <Link
          href="/customs"
          className="text-blue-600 text-sm hover:underline"
        >
          ← {t("customs.backToList")}
        </Link>
      </div>
    </div>
  );
}
