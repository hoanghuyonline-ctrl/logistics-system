"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import DocumentUploader from "@/components/order/DocumentUploader";
import { useI18n } from "@/lib/i18n";

interface UploadedDoc {
  path: string;
  url: string;
  name: string;
  type: string;
}

const DECLARATION_TYPES = [
  { value: "KINH_DOANH", icon: "🏪" },
  { value: "GIA_CONG", icon: "🏭" },
  { value: "SAN_XUAT_XUAT_KHAU", icon: "📦" },
  { value: "TAM_NHAP_TAI_XUAT", icon: "🔄" },
  { value: "PHI_MAU_DICH", icon: "📋" },
] as const;

const ACCOMPANYING_SERVICES = [
  "CO",
  "QUARANTINE",
  "FUMIGATION",
  "FOOD_DECLARATION",
  "QUALITY_CHECK",
  "IMPORT_LICENSE",
] as const;

const CURRENCIES = ["USD", "CNY", "VND"] as const;

export default function NewCustomsRequestPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    declarationType: "" as string,
    services: [] as string[],
    goodsDescription: "",
    hsCode: "",
    goodsValue: "",
    goodsCurrency: "USD" as string,
    goodsWeight: "",
    goodsQuantity: "",
    originCountry: "",
    destinationPort: "",
    companyName: "",
    taxCode: "",
    companyAddress: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    customerNote: "",
  });

  const [documents, setDocuments] = useState<UploadedDoc[]>([]);

  const updateForm = (field: string, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleService = (service: string) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.declarationType) {
      setError(t("customs.error.noDeclarationType"));
      return;
    }
    if (!form.goodsDescription.trim()) {
      setError(t("customs.error.noDescription"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/customs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          accompanyingServices: form.services.length > 0 ? form.services : undefined,
          documents: documents.length > 0 ? documents : undefined,
          goodsValue: form.goodsValue || undefined,
          goodsWeight: form.goodsWeight || undefined,
          goodsQuantity: form.goodsQuantity || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error");
        return;
      }

      router.push("/customs");
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={t("customs.newRequest")}
        subtitle={t("customs.newRequestDesc")}
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Declaration Type Selection */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          📋 {t("customs.declarationTypeLabel")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DECLARATION_TYPES.map(({ value, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => updateForm("declarationType", value)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                form.declarationType === value
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t(`customs.declarationType.${value}`)}
                </p>
                <p className="text-xs text-gray-500">
                  {t(`customs.declarationDesc.${value}`)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Accompanying Services */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          🔧 {t("customs.accompanyingServices")}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ACCOMPANYING_SERVICES.map((service) => (
            <button
              key={service}
              type="button"
              onClick={() => toggleService(service)}
              className={`p-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                form.services.includes(service)
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {form.services.includes(service) ? "✅ " : ""}
              {t(`customs.service.${service}`)}
            </button>
          ))}
        </div>
        {form.services.length > 0 && (
          <p className="mt-2 text-xs text-emerald-600">
            {t("customs.servicesSelected").replace("{count}", String(form.services.length))}
          </p>
        )}
      </Card>

      {/* Goods Information */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          📦 {t("customs.goodsInfo")}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              {t("customs.goodsDescription")} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.goodsDescription}
              onChange={(e) => updateForm("goodsDescription", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t("customs.goodsDescPlaceholder")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t("customs.hsCode")}
              </label>
              <input
                type="text"
                value={form.hsCode}
                onChange={(e) => updateForm("hsCode", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="8471.30.00"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t("customs.originCountry")}
              </label>
              <input
                type="text"
                value={form.originCountry}
                onChange={(e) => updateForm("originCountry", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t("customs.originPlaceholder")}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t("customs.goodsValue")}
              </label>
              <input
                type="number"
                value={form.goodsValue}
                onChange={(e) => updateForm("goodsValue", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t("customs.currency")}
              </label>
              <select
                value={form.goodsCurrency}
                onChange={(e) => updateForm("goodsCurrency", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t("customs.goodsWeight")}
              </label>
              <input
                type="number"
                value={form.goodsWeight}
                onChange={(e) => updateForm("goodsWeight", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="kg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t("customs.goodsQuantity")}
              </label>
              <input
                type="number"
                value={form.goodsQuantity}
                onChange={(e) => updateForm("goodsQuantity", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t("customs.destinationPort")}
              </label>
              <input
                type="text"
                value={form.destinationPort}
                onChange={(e) => updateForm("destinationPort", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t("customs.portPlaceholder")}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Company Information */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          🏢 {t("customs.companyInfo")}
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t("customs.companyName")}
              </label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => updateForm("companyName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t("customs.taxCode")}
              </label>
              <input
                type="text"
                value={form.taxCode}
                onChange={(e) => updateForm("taxCode", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              {t("customs.companyAddress")}
            </label>
            <input
              type="text"
              value={form.companyAddress}
              onChange={(e) => updateForm("companyAddress", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t("customs.contactName")}
              </label>
              <input
                type="text"
                value={form.contactName}
                onChange={(e) => updateForm("contactName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t("customs.contactPhone")}
              </label>
              <input
                type="text"
                value={form.contactPhone}
                onChange={(e) => updateForm("contactPhone", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t("customs.contactEmail")}
              </label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => updateForm("contactEmail", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Documents Upload */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          📎 {t("customs.documents")}
        </h3>
        <DocumentUploader
          documents={documents}
          onDocumentsChange={setDocuments}
          maxFiles={10}
          label={t("customs.uploadDocuments")}
          hint={t("customs.uploadHint")}
          acceptImages
        />
      </Card>

      {/* Notes */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          📝 {t("customs.notes")}
        </h3>
        <textarea
          value={form.customerNote}
          onChange={(e) => updateForm("customerNote", e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={t("customs.notesPlaceholder")}
        />
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3 mb-8">
        <button
          type="button"
          onClick={() => router.push("/customs")}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {submitting ? t("common.submitting") : t("customs.submit")}
        </button>
      </div>
    </div>
  );
}
