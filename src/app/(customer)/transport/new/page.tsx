"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n";

const SERVICE_TYPES = [
  { value: "TRUCK_NORTH_SOUTH", icon: "🚛" },
  { value: "INNER_CITY_DELIVERY", icon: "🏍️" },
  { value: "TRANSIT_WAREHOUSE", icon: "🏭" },
] as const;

export default function NewTransportRequestPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    serviceType: "" as string,
    pickupAddress: "",
    pickupCity: "",
    pickupContactName: "",
    pickupContactPhone: "",
    pickupDate: "",
    deliveryAddress: "",
    deliveryCity: "",
    deliveryContactName: "",
    deliveryContactPhone: "",
    cargoDescription: "",
    cargoWeight: "",
    cargoVolume: "",
    cargoQuantity: "",
    cargoType: "",
    requiresRefrigeration: false,
    warehouseCity: "",
    storageDuration: "",
    storageNote: "",
    customerNote: "",
  });

  const updateForm = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.serviceType) {
      setError(t("transport.error.noServiceType"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/transport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          cargoWeight: form.cargoWeight || undefined,
          cargoVolume: form.cargoVolume || undefined,
          cargoQuantity: form.cargoQuantity || undefined,
          storageDuration: form.storageDuration || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error");
        return;
      }

      router.push("/transport");
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const isWarehouse = form.serviceType === "TRANSIT_WAREHOUSE";
  const isTransport = form.serviceType === "TRUCK_NORTH_SOUTH" || form.serviceType === "INNER_CITY_DELIVERY";

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title={t("transport.newRequest")} subtitle={t("transport.newRequestDesc")} />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      {/* Service Type Selection */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">🚚 {t("transport.serviceTypeLabel")}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SERVICE_TYPES.map(({ value, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => updateForm("serviceType", value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${
                form.serviceType === value
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-3xl">{icon}</span>
              <span className="text-sm font-medium text-gray-900">{t(`transport.serviceType.${value}`)}</span>
              <span className="text-xs text-gray-500">{t(`transport.serviceTypeDesc.${value}`)}</span>
            </button>
          ))}
        </div>
      </Card>

      {form.serviceType && (
        <>
          {/* Pickup Info (for transport types) */}
          {isTransport && (
            <Card className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">📍 {t("transport.pickupInfo")}</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t("transport.pickupCity")}</label>
                    <input
                      type="text"
                      value={form.pickupCity}
                      onChange={(e) => updateForm("pickupCity", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t("transport.cityPlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t("transport.pickupDate")}</label>
                    <input
                      type="date"
                      value={form.pickupDate}
                      onChange={(e) => updateForm("pickupDate", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t("transport.pickupAddress")}</label>
                  <textarea
                    value={form.pickupAddress}
                    onChange={(e) => updateForm("pickupAddress", e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t("transport.addressPlaceholder")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t("transport.contactName")}</label>
                    <input
                      type="text"
                      value={form.pickupContactName}
                      onChange={(e) => updateForm("pickupContactName", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t("transport.contactPhone")}</label>
                    <input
                      type="text"
                      value={form.pickupContactPhone}
                      onChange={(e) => updateForm("pickupContactPhone", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Delivery Info (for transport types) */}
          {isTransport && (
            <Card className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">🏠 {t("transport.deliveryInfo")}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t("transport.deliveryCity")}</label>
                  <input
                    type="text"
                    value={form.deliveryCity}
                    onChange={(e) => updateForm("deliveryCity", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t("transport.cityPlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t("transport.deliveryAddress")}</label>
                  <textarea
                    value={form.deliveryAddress}
                    onChange={(e) => updateForm("deliveryAddress", e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t("transport.addressPlaceholder")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t("transport.contactName")}</label>
                    <input
                      type="text"
                      value={form.deliveryContactName}
                      onChange={(e) => updateForm("deliveryContactName", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t("transport.contactPhone")}</label>
                    <input
                      type="text"
                      value={form.deliveryContactPhone}
                      onChange={(e) => updateForm("deliveryContactPhone", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Warehouse Info (for TRANSIT_WAREHOUSE) */}
          {isWarehouse && (
            <Card className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">🏭 {t("transport.warehouseInfo")}</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t("transport.warehouseCity")}</label>
                    <input
                      type="text"
                      value={form.warehouseCity}
                      onChange={(e) => updateForm("warehouseCity", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t("transport.cityPlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t("transport.storageDuration")}</label>
                    <input
                      type="number"
                      value={form.storageDuration}
                      onChange={(e) => updateForm("storageDuration", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t("transport.storageDurationPlaceholder")}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t("transport.storageNote")}</label>
                  <textarea
                    value={form.storageNote}
                    onChange={(e) => updateForm("storageNote", e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t("transport.storageNotePlaceholder")}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Cargo Info */}
          <Card className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">📦 {t("transport.cargoInfo")}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t("transport.cargoDescription")}</label>
                <textarea
                  value={form.cargoDescription}
                  onChange={(e) => updateForm("cargoDescription", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t("transport.cargoDescPlaceholder")}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t("transport.cargoWeight")}</label>
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
                  <label className="block text-xs text-gray-500 mb-1">{t("transport.cargoVolume")}</label>
                  <input
                    type="number"
                    step="0.001"
                    value={form.cargoVolume}
                    onChange={(e) => updateForm("cargoVolume", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="m³"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t("transport.cargoQuantity")}</label>
                  <input
                    type="number"
                    value={form.cargoQuantity}
                    onChange={(e) => updateForm("cargoQuantity", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t("transport.cargoType")}</label>
                  <input
                    type="text"
                    value={form.cargoType}
                    onChange={(e) => updateForm("cargoType", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t("transport.cargoTypePlaceholder")}
                  />
                </div>
              </div>
              {isTransport && (
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiresRefrigeration}
                    onChange={(e) => updateForm("requiresRefrigeration", e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  ❄️ {t("transport.requiresRefrigeration")}
                </label>
              )}
            </div>
          </Card>

          {/* Notes */}
          <Card className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">📝 {t("transport.notes")}</h3>
            <textarea
              value={form.customerNote}
              onChange={(e) => updateForm("customerNote", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t("transport.notesPlaceholder")}
            />
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3 mb-8">
            <button
              type="button"
              onClick={() => router.push("/transport")}
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
              {submitting ? t("common.submitting") : t("transport.submitRequest")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
