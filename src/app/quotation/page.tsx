"use client";

import { useState } from "react";
import Link from "next/link";
import { LandingNavbar, LandingFooter, LandingMobileBar } from "@/components/landing";
import { useI18n } from "@/lib/i18n";

const SERVICE_TYPES = [
  { value: "IMPORT_EXPORT", icon: "🚢" },
  { value: "CUSTOMS_CLEARANCE", icon: "🛃" },
  { value: "DOMESTIC_TRANSPORT", icon: "🚛" },
  { value: "WAREHOUSE_STORAGE", icon: "🏭" },
  { value: "INTERNATIONAL_TRADE", icon: "🌐" },
  { value: "OTHER", icon: "📋" },
] as const;

export default function QuotationPage() {
  const { t } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    serviceType: "" as string,
    serviceDetail: "",
    cargoDescription: "",
    cargoWeight: "",
    cargoVolume: "",
    originCity: "",
    destinationCity: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    companyName: "",
  });

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.serviceType) { setError(t("quotation.error.noServiceType")); return; }
    if (!form.contactName) { setError(t("quotation.error.noContactName")); return; }
    if (!form.contactEmail) { setError(t("quotation.error.noContactEmail")); return; }
    if (!form.contactPhone) { setError(t("quotation.error.noContactPhone")); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/quotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          cargoWeight: form.cargoWeight || undefined,
          cargoVolume: form.cargoVolume || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error");
        return;
      }

      const data = await res.json();
      setSuccess(data.requestCode);
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      <LandingNavbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 pb-24 sm:pb-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            💰 {t("quotation.publicTitle")}
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">{t("quotation.publicSubtitle")}</p>
        </div>

        {success ? (
          <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-green-700 mb-2">{t("quotation.successTitle")}</h2>
            <p className="text-gray-600 mb-4">{t("quotation.successMessage")}</p>
            <div className="inline-block bg-green-50 px-4 py-2 rounded-xl mb-4">
              <p className="text-xs text-gray-500">{t("quotation.requestCode")}</p>
              <p className="text-lg font-mono font-bold text-green-700">{success}</p>
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => { setSuccess(null); setForm({ serviceType: "", serviceDetail: "", cargoDescription: "", cargoWeight: "", cargoVolume: "", originCity: "", destinationCity: "", contactName: "", contactEmail: "", contactPhone: "", companyName: "" }); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
              >
                {t("quotation.newRequest")}
              </button>
              <Link
                href="/"
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
              >
                {t("quotation.backToHome")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
            )}

            {/* Service Type */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">🚚 {t("quotation.serviceTypeLabel")} <span className="text-red-500">*</span></h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SERVICE_TYPES.map(({ value, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateForm("serviceType", value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${
                      form.serviceType === value
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-2xl">{icon}</span>
                    <span className="text-xs font-medium text-gray-900">{t(`quotation.serviceType.${value}`)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Service Detail */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">📝 {t("quotation.serviceDetail")}</h3>
              <textarea
                value={form.serviceDetail}
                onChange={(e) => updateForm("serviceDetail", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t("quotation.serviceDetailPlaceholder")}
              />
            </div>

            {/* Cargo & Route */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">📦 {t("quotation.cargoRoute")}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t("quotation.cargoDescription")}</label>
                  <textarea
                    value={form.cargoDescription}
                    onChange={(e) => updateForm("cargoDescription", e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t("quotation.cargoDescPlaceholder")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t("quotation.cargoWeight")}</label>
                    <input
                      type="number"
                      step="0.001"
                      value={form.cargoWeight}
                      onChange={(e) => updateForm("cargoWeight", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="kg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t("quotation.cargoVolume")}</label>
                    <input
                      type="number"
                      step="0.001"
                      value={form.cargoVolume}
                      onChange={(e) => updateForm("cargoVolume", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="m³"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t("quotation.originCity")}</label>
                    <input
                      type="text"
                      value={form.originCity}
                      onChange={(e) => updateForm("originCity", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t("quotation.originCityPlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t("quotation.destinationCity")}</label>
                    <input
                      type="text"
                      value={form.destinationCity}
                      onChange={(e) => updateForm("destinationCity", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t("quotation.destinationCityPlaceholder")}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">👤 {t("quotation.contactInfo")} <span className="text-red-500">*</span></h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t("quotation.contactName")} <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={form.contactName}
                      onChange={(e) => updateForm("contactName", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t("quotation.contactNamePlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t("quotation.companyName")}</label>
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={(e) => updateForm("companyName", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t("quotation.companyNamePlaceholder")}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t("quotation.contactEmail")} <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => updateForm("contactEmail", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t("quotation.contactPhone")} <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      value={form.contactPhone}
                      onChange={(e) => updateForm("contactPhone", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0912 345 678"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submitting ? t("common.submitting") : t("quotation.submitRequest")}
              </button>
            </div>
          </div>
        )}
      </main>

      <LandingFooter />
      <LandingMobileBar />
    </div>
  );
}
