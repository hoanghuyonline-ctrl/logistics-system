"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import OrderImageUploader from "@/components/order/OrderImageUploader";
import DocumentUploader from "@/components/order/DocumentUploader";
import { useI18n } from "@/lib/i18n";

interface UploadedDoc {
  path: string;
  url: string;
  name: string;
  type: string;
}

const ENTRUST_SERVICES = [
  { key: "PICKUP_CN", labelKey: "entrust.pickupCn" },
  { key: "CUSTOMS", labelKey: "entrust.customs" },
  { key: "SUPERVISION", labelKey: "entrust.supervision" },
  { key: "TRANSLOADING", labelKey: "entrust.transloading" },
  { key: "TRANSPORT", labelKey: "entrust.transport" },
] as const;

type OrderType = "ECOMMERCE" | "ENTRUST" | "CONSIGNMENT";

interface UploadedImage {
  path: string;
  url: string;
}

const ORDER_TYPE_ICONS: Record<OrderType, string> = {
  ECOMMERCE: "🛒",
  ENTRUST: "📦",
  CONSIGNMENT: "🚚",
};

export default function NewOrderPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [orderType, setOrderType] = useState<OrderType>("ECOMMERCE");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [exchangeRate, setExchangeRate] = useState(3500);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<{ fullName: string; phone: string; address: string } | null>(null);
  const [addressConfirmed, setAddressConfirmed] = useState(false);

  // Ecommerce fields
  const [ecomForm, setEcomForm] = useState({
    productName: "",
    productLink: "",
    productSpecs: "",
    quantity: "1",
    unitPriceCNY: "",
    notes: "",
  });

  // Entrust fields
  const [entrustForm, setEntrustForm] = useState({
    itemName: "",
    weight: "",
    volume: "",
    requiresVat: false,
    taxCode: "",
    companyName: "",
    companyAddress: "",
    notes: "",
    // Enhanced fields
    shipmentType: "LCL" as "FCL" | "LCL",
    services: [] as string[],
    cargoValueCurrency: "CNY" as "USD" | "CNY",
    cargoValueAmount: "",
    dimensionLength: "",
    dimensionWidth: "",
    dimensionHeight: "",
    entrustQuantity: "1",
    waybillCode: "",
    cnTruckPlate: "",
    cnDriverName: "",
    cnDriverPhone: "",
  });
  const [waybillImages, setWaybillImages] = useState<UploadedDoc[]>([]);
  const [relatedDocuments, setRelatedDocuments] = useState<UploadedDoc[]>([]);
  const [cnTruckImages, setCnTruckImages] = useState<UploadedDoc[]>([]);

  // Consignment fields
  const [consignForm, setConsignForm] = useState({
    consignmentTrackingNumber: "",
    consignmentNotes: "",
  });

  useEffect(() => {
    fetch("/api/settings/exchange-rate")
      .then((r) => r.json())
      .then((d) => setExchangeRate(parseFloat(d.exchange_rate)));
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUserProfile({ fullName: d.fullName || "", phone: d.phone || "", address: d.address || "" }))
      .catch(() => {});
  }, []);

  const estimatedCNY = parseFloat(ecomForm.unitPriceCNY || "0") * parseInt(ecomForm.quantity || "1");
  const estimatedVND = estimatedCNY * exchangeRate;

  function canSubmit(): boolean {
    if (loading || !addressConfirmed || !userProfile?.address) return false;
    if (orderType === "ECOMMERCE") {
      return images.length > 0 && !!ecomForm.productName && !!ecomForm.quantity && !!ecomForm.unitPriceCNY;
    }
    if (orderType === "ENTRUST") {
      return !!entrustForm.itemName;
    }
    if (orderType === "CONSIGNMENT") {
      return !!consignForm.consignmentTrackingNumber;
    }
    return false;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (orderType === "ECOMMERCE" && images.length === 0) {
      setError(t("newOrder.imageUploadRequired"));
      return;
    }

    setLoading(true);

    let payload: Record<string, unknown> = { orderType };

    if (orderType === "ECOMMERCE") {
      payload = {
        ...payload,
        ...ecomForm,
        productImage: images[0]?.url || "",
      };
    } else if (orderType === "ENTRUST") {
      const l = parseFloat(entrustForm.dimensionLength || "0");
      const w = parseFloat(entrustForm.dimensionWidth || "0");
      const h = parseFloat(entrustForm.dimensionHeight || "0");
      const cbm = l > 0 && w > 0 && h > 0 ? (l * w * h) / 1000000 : 0;
      const cargoVND = entrustForm.cargoValueAmount
        ? parseFloat(entrustForm.cargoValueAmount) * (entrustForm.cargoValueCurrency === "CNY" ? exchangeRate : exchangeRate * 7.2)
        : 0;

      payload = {
        ...payload,
        itemName: entrustForm.itemName,
        weight: entrustForm.weight || undefined,
        volume: entrustForm.volume || undefined,
        requiresVat: entrustForm.requiresVat,
        taxCode: entrustForm.taxCode || undefined,
        companyName: entrustForm.companyName || undefined,
        companyAddress: entrustForm.companyAddress || undefined,
        notes: entrustForm.notes || undefined,
        entrustShipmentType: entrustForm.shipmentType,
        entrustServices: entrustForm.services,
        cargoValueCurrency: entrustForm.cargoValueCurrency,
        cargoValueAmount: entrustForm.cargoValueAmount || undefined,
        cargoValueVND: cargoVND > 0 ? cargoVND.toString() : undefined,
        dimensionLength: entrustForm.dimensionLength || undefined,
        dimensionWidth: entrustForm.dimensionWidth || undefined,
        dimensionHeight: entrustForm.dimensionHeight || undefined,
        cbm: cbm > 0 ? cbm.toString() : undefined,
        entrustQuantity: entrustForm.entrustQuantity || undefined,
        waybillCode: entrustForm.waybillCode || undefined,
        waybillImages: waybillImages.map((d) => d.url),
        relatedDocuments: relatedDocuments.map((d) => d.url),
        cnTruckPlate: entrustForm.cnTruckPlate || undefined,
        cnDriverName: entrustForm.cnDriverName || undefined,
        cnDriverPhone: entrustForm.cnDriverPhone || undefined,
        cnTruckImages: cnTruckImages.map((d) => d.url),
        productImage: images[0]?.url || "",
      };
    } else {
      payload = {
        ...payload,
        ...consignForm,
      };
    }

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || t("newOrder.createFailed"));
      setLoading(false);
      return;
    }

    const order = await res.json();
    router.push(`/orders/${order.id}`);
  }

  const orderTypes: { key: OrderType; labelKey: string; descKey: string }[] = [
    { key: "ECOMMERCE", labelKey: "newOrder.typeEcommerce", descKey: "newOrder.typeEcommerceDesc" },
    { key: "ENTRUST", labelKey: "newOrder.typeEntrust", descKey: "newOrder.typeEntrustDesc" },
    { key: "CONSIGNMENT", labelKey: "newOrder.typeConsignment", descKey: "newOrder.typeConsignmentDesc" },
  ];

  return (
    <div className="max-w-3xl">
      <PageHeader title={t("newOrder.title")} subtitle={t("newOrder.subtitle")} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm border border-red-100">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Order Type Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                {t("newOrder.selectType")} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {orderTypes.map(({ key, labelKey, descKey }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setOrderType(key)}
                    className={`relative flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all text-center ${
                      orderType === key
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-2xl">{ORDER_TYPE_ICONS[key]}</span>
                    <span className={`text-sm font-semibold ${orderType === key ? "text-blue-700" : "text-slate-700"}`}>
                      {t(labelKey)}
                    </span>
                    <span className="text-xs text-slate-500 leading-tight">{t(descKey)}</span>
                    {orderType === key && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* ── ECOMMERCE FIELDS ── */}
              {orderType === "ECOMMERCE" && (
                <>
                  <OrderImageUploader images={images} onImagesChange={setImages} maxImages={5} />

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      {t("newOrder.productName")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ecomForm.productName}
                      onChange={(e) => setEcomForm({ ...ecomForm, productName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder={t("newOrder.productNamePlaceholder")}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      {t("newOrder.productLink")}
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        {t("newOrder.productLinkOptional")}
                      </span>
                    </label>
                    <input
                      type="url"
                      value={ecomForm.productLink}
                      onChange={(e) => setEcomForm({ ...ecomForm, productLink: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder={t("newOrder.productLinkPlaceholder")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      {t("newOrder.productSpecs")}
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        {t("newOrder.productLinkOptional")}
                      </span>
                    </label>
                    <textarea
                      value={ecomForm.productSpecs}
                      onChange={(e) => setEcomForm({ ...ecomForm, productSpecs: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      rows={2}
                      placeholder={t("newOrder.productSpecsPlaceholder")}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        {t("orderDetail.quantity")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={ecomForm.quantity}
                        onChange={(e) => setEcomForm({ ...ecomForm, quantity: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        {t("newOrder.unitPriceCny")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={ecomForm.unitPriceCNY}
                        onChange={(e) => setEcomForm({ ...ecomForm, unitPriceCNY: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("orderDetail.notes")}</label>
                    <textarea
                      value={ecomForm.notes}
                      onChange={(e) => setEcomForm({ ...ecomForm, notes: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      rows={3}
                      placeholder={t("newOrder.notesPlaceholder")}
                    />
                  </div>
                </>
              )}

              {/* ── ENTRUST FIELDS (Enhanced) ── */}
              {orderType === "ENTRUST" && (
                <>
                  {/* Section 1: Shipment Type FCL/LCL */}
                  <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/50">
                    <label className="block text-sm font-semibold text-emerald-800 mb-3">{t("entrust.shipmentType")}</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(["FCL", "LCL"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setEntrustForm({ ...entrustForm, shipmentType: type })}
                          className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                            entrustForm.shipmentType === type
                              ? "border-emerald-500 bg-white shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <span className="text-xl">{type === "FCL" ? "🚛" : "📦"}</span>
                          <span className={`text-sm font-semibold ${entrustForm.shipmentType === type ? "text-emerald-700" : "text-slate-600"}`}>{type}</span>
                          <span className="text-xs text-slate-500">{t(`entrust.${type.toLowerCase()}Desc`)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section 2: Services Selection */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <label className="block text-sm font-semibold text-slate-800 mb-2">{t("entrust.selectServices")}</label>
                    <p className="text-xs text-slate-500 mb-3">{t("entrust.selectServicesHint")}</p>
                    <div className="space-y-2">
                      {ENTRUST_SERVICES.map(({ key, labelKey }) => (
                        <label key={key} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                          <input
                            type="checkbox"
                            checked={entrustForm.services.includes(key)}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...entrustForm.services, key]
                                : entrustForm.services.filter((s) => s !== key);
                              setEntrustForm({ ...entrustForm, services: next });
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm text-slate-700">{t(labelKey)}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEntrustForm({ ...entrustForm, services: ENTRUST_SERVICES.map((s) => s.key) })}
                      className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      {t("entrust.selectAll")}
                    </button>
                  </div>

                  {/* Section 3: Product Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <span className="text-base">📋</span> {t("entrust.productInfo")}
                    </h3>

                    <OrderImageUploader images={images} onImagesChange={setImages} maxImages={10} />

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        {t("newOrder.itemName")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={entrustForm.itemName}
                        onChange={(e) => setEntrustForm({ ...entrustForm, itemName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder={t("newOrder.itemNamePlaceholder")}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{t("entrust.length")}</label>
                        <input
                          type="number" step="0.01" min="0"
                          value={entrustForm.dimensionLength}
                          onChange={(e) => setEntrustForm({ ...entrustForm, dimensionLength: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="cm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{t("entrust.width")}</label>
                        <input
                          type="number" step="0.01" min="0"
                          value={entrustForm.dimensionWidth}
                          onChange={(e) => setEntrustForm({ ...entrustForm, dimensionWidth: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="cm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{t("entrust.height")}</label>
                        <input
                          type="number" step="0.01" min="0"
                          value={entrustForm.dimensionHeight}
                          onChange={(e) => setEntrustForm({ ...entrustForm, dimensionHeight: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="cm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">CBM</label>
                        <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 font-mono">
                          {(() => {
                            const l = parseFloat(entrustForm.dimensionLength || "0");
                            const w = parseFloat(entrustForm.dimensionWidth || "0");
                            const h = parseFloat(entrustForm.dimensionHeight || "0");
                            if (l > 0 && w > 0 && h > 0) return (l * w * h / 1000000).toFixed(4);
                            return "—";
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{t("entrust.quantity")}</label>
                        <input
                          type="number" min="1"
                          value={entrustForm.entrustQuantity}
                          onChange={(e) => setEntrustForm({ ...entrustForm, entrustQuantity: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{t("newOrder.weight")}</label>
                        <input
                          type="number" step="0.001" min="0"
                          value={entrustForm.weight}
                          onChange={(e) => setEntrustForm({ ...entrustForm, weight: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="kg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{t("newOrder.volume")}</label>
                        <input
                          type="number" step="0.001" min="0"
                          value={entrustForm.volume}
                          onChange={(e) => setEntrustForm({ ...entrustForm, volume: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="m³"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Cargo Value */}
                  <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/50 space-y-3">
                    <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                      <span className="text-base">💰</span> {t("entrust.cargoValue")}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-slate-600 mb-1">{t("entrust.currency")}</label>
                        <select
                          value={entrustForm.cargoValueCurrency}
                          onChange={(e) => setEntrustForm({ ...entrustForm, cargoValueCurrency: e.target.value as "USD" | "CNY" })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="CNY">CNY (¥)</option>
                          <option value="USD">USD ($)</option>
                        </select>
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-slate-600 mb-1">{t("entrust.amount")}</label>
                        <input
                          type="number" step="0.01" min="0"
                          value={entrustForm.cargoValueAmount}
                          onChange={(e) => setEntrustForm({ ...entrustForm, cargoValueAmount: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-slate-600 mb-1">≈ VNĐ</label>
                        <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-medium">
                          {(() => {
                            const amt = parseFloat(entrustForm.cargoValueAmount || "0");
                            if (amt <= 0) return "—";
                            const rate = entrustForm.cargoValueCurrency === "CNY" ? exchangeRate : exchangeRate * 7.2;
                            return Math.round(amt * rate).toLocaleString();
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Waybill / Order Code */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <span className="text-base">📄</span> {t("entrust.waybill")}
                    </h3>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">{t("entrust.waybillCode")}</label>
                      <input
                        type="text"
                        value={entrustForm.waybillCode}
                        onChange={(e) => setEntrustForm({ ...entrustForm, waybillCode: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={t("entrust.waybillCodePlaceholder")}
                      />
                    </div>
                    <DocumentUploader
                      documents={waybillImages}
                      onDocumentsChange={setWaybillImages}
                      maxFiles={5}
                      label={t("entrust.waybillImages")}
                      hint={t("entrust.waybillImagesHint")}
                    />
                  </div>

                  {/* Section 6: Related Documents */}
                  <DocumentUploader
                    documents={relatedDocuments}
                    onDocumentsChange={setRelatedDocuments}
                    maxFiles={10}
                    label={t("entrust.relatedDocs")}
                    hint={t("entrust.relatedDocsHint")}
                  />

                  {/* Section 7: CN Truck Info */}
                  <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/50 space-y-3">
                    <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                      <span className="text-base">🚛</span> {t("entrust.cnTruckInfo")}
                    </h3>
                    <p className="text-xs text-amber-600">{t("entrust.cnTruckInfoHint")}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{t("entrust.truckPlate")}</label>
                        <input
                          type="text"
                          value={entrustForm.cnTruckPlate}
                          onChange={(e) => setEntrustForm({ ...entrustForm, cnTruckPlate: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={t("entrust.truckPlatePlaceholder")}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{t("entrust.driverName")}</label>
                        <input
                          type="text"
                          value={entrustForm.cnDriverName}
                          onChange={(e) => setEntrustForm({ ...entrustForm, cnDriverName: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={t("entrust.driverNamePlaceholder")}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{t("entrust.driverPhone")}</label>
                        <input
                          type="text"
                          value={entrustForm.cnDriverPhone}
                          onChange={(e) => setEntrustForm({ ...entrustForm, cnDriverPhone: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={t("entrust.driverPhonePlaceholder")}
                        />
                      </div>
                    </div>
                    <DocumentUploader
                      documents={cnTruckImages}
                      onDocumentsChange={setCnTruckImages}
                      maxFiles={5}
                      label={t("entrust.truckPhotos")}
                      hint={t("entrust.truckPhotosHint")}
                    />
                  </div>

                  {/* Section 8: VAT Toggle */}
                  <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={entrustForm.requiresVat}
                        onChange={(e) => setEntrustForm({ ...entrustForm, requiresVat: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-slate-700">{t("newOrder.requiresVat")}</span>
                        <p className="text-xs text-slate-500">{t("newOrder.requiresVatDesc")}</p>
                      </div>
                    </label>

                    {entrustForm.requiresVat && (
                      <div className="space-y-3 pt-2 border-t border-slate-200">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            {t("newOrder.taxCode")} <span className="text-red-500">*</span>
                          </label>
                          <input type="text" value={entrustForm.taxCode}
                            onChange={(e) => setEntrustForm({ ...entrustForm, taxCode: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={t("newOrder.taxCodePlaceholder")}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            {t("newOrder.companyName")} <span className="text-red-500">*</span>
                          </label>
                          <input type="text" value={entrustForm.companyName}
                            onChange={(e) => setEntrustForm({ ...entrustForm, companyName: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={t("newOrder.companyNamePlaceholder")}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            {t("newOrder.companyAddress")} <span className="text-red-500">*</span>
                          </label>
                          <input type="text" value={entrustForm.companyAddress}
                            onChange={(e) => setEntrustForm({ ...entrustForm, companyAddress: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={t("newOrder.companyAddressPlaceholder")}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("orderDetail.notes")}</label>
                    <textarea
                      value={entrustForm.notes}
                      onChange={(e) => setEntrustForm({ ...entrustForm, notes: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      rows={3}
                      placeholder={t("newOrder.notesPlaceholder")}
                    />
                  </div>
                </>
              )}

              {/* ── CONSIGNMENT FIELDS ── */}
              {orderType === "CONSIGNMENT" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      {t("newOrder.consignmentTracking")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={consignForm.consignmentTrackingNumber}
                      onChange={(e) => setConsignForm({ ...consignForm, consignmentTrackingNumber: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder={t("newOrder.consignmentTrackingPlaceholder")}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      {t("newOrder.consignmentNotes")}
                    </label>
                    <textarea
                      value={consignForm.consignmentNotes}
                      onChange={(e) => setConsignForm({ ...consignForm, consignmentNotes: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      rows={3}
                      placeholder={t("newOrder.consignmentNotesPlaceholder")}
                    />
                  </div>
                </>
              )}

              {/* Delivery address section */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📍</span>
                    <h3 className="text-sm font-semibold text-slate-800">{t("newOrder.deliveryAddress")}</h3>
                  </div>
                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors shadow-sm"
                  >
                    ✏️ {t("newOrder.editAddress")}
                  </Link>
                </div>
                {userProfile && userProfile.address ? (
                  <>
                    <dl className="space-y-1.5 text-sm">
                      <div className="flex gap-2">
                        <dt className="text-slate-500 shrink-0">{t("newOrder.fullName")}:</dt>
                        <dd className="text-slate-900 font-medium">{userProfile.fullName || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-slate-500 shrink-0">{t("newOrder.phone")}:</dt>
                        <dd className="text-slate-900 font-medium">{userProfile.phone || "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-slate-500 shrink-0">{t("newOrder.address")}:</dt>
                        <dd className="text-slate-900 font-medium">{userProfile.address}</dd>
                      </div>
                    </dl>
                    <label className="flex items-start gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={addressConfirmed}
                        onChange={(e) => setAddressConfirmed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{t("newOrder.addressConfirm")}</span>
                    </label>
                  </>
                ) : (
                  <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <span className="text-lg shrink-0">⚠️</span>
                    <div>
                      <p className="text-sm font-medium text-amber-900">{t("newOrder.noAddress")}</p>
                      <p className="text-sm text-amber-700 mt-0.5">{t("newOrder.updateProfile")}</p>
                      <Link
                        href="/profile"
                        className="inline-block mt-2 px-4 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        {t("newOrder.goToProfile")} →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!canSubmit()}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("newOrder.creating")}
                  </span>
                ) : t("newOrder.createOrder")}
              </button>
            </form>
          </Card>
        </div>

        {/* Cost estimate sidebar — only for ECOMMERCE */}
        {orderType === "ECOMMERCE" && (
          <div>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white sticky top-8">
              <h3 className="font-semibold mb-4 text-blue-100 text-sm uppercase tracking-wider">{t("newOrder.estimatedCost")}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-200">{t("newOrder.productTotal")}</span>
                  <span className="font-semibold">&yen;{estimatedCNY.toFixed(2)} CNY</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-200">{t("orderDetail.exchangeRate")}</span>
                  <span className="font-semibold">1 CNY = {exchangeRate.toLocaleString()} VND</span>
                </div>
                <div className="border-t border-white/20 pt-3 mt-3">
                  <div className="flex justify-between items-end">
                    <span className="text-blue-100 font-medium">{t("newOrder.estimatedTotal")}</span>
                    <div className="text-right">
                      <span className="text-xl font-bold">{estimatedVND.toLocaleString()} VND</span>
                      <span className="block text-xs text-blue-200 mt-0.5">({t("newOrder.estimateOnly")})</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white/10 rounded-xl border border-white/20">
                <p className="text-xs text-white leading-relaxed font-medium">
                  💡 {t("newOrder.contactCompanyNote")}
                </p>
                <p className="text-xs text-blue-200 mt-1 leading-relaxed">
                  {t("newOrder.priceConfirmNote")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info sidebar for ENTRUST */}
        {orderType === "ENTRUST" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white sticky top-8">
              <h3 className="font-semibold mb-4 text-emerald-100 text-sm uppercase tracking-wider">{t("newOrder.entrustInfo")}</h3>
              <div className="space-y-3 text-sm text-emerald-100 leading-relaxed">
                <p>{t("newOrder.entrustInfoDesc")}</p>
              </div>
              <div className="mt-4 space-y-2">
                <div className="p-3 bg-white/10 rounded-xl border border-white/20">
                  <p className="text-xs text-white leading-relaxed font-medium">
                    📋 {t("entrust.sidebarChecklist")}
                  </p>
                  <ul className="text-xs text-emerald-200 mt-2 space-y-1">
                    <li>✓ {t("entrust.checklistImages")}</li>
                    <li>✓ {t("entrust.checklistDimensions")}</li>
                    <li>✓ {t("entrust.checklistValue")}</li>
                    <li>✓ {t("entrust.checklistDocs")}</li>
                  </ul>
                </div>
                <div className="p-3 bg-white/10 rounded-xl border border-white/20">
                  <p className="text-xs text-white leading-relaxed font-medium">
                    💡 {t("newOrder.entrustNote")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info sidebar for CONSIGNMENT */}
        {orderType === "CONSIGNMENT" && (
          <div>
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-6 text-white sticky top-8">
              <h3 className="font-semibold mb-4 text-orange-100 text-sm uppercase tracking-wider">{t("newOrder.consignmentInfo")}</h3>
              <div className="space-y-3 text-sm text-orange-100 leading-relaxed">
                <p>{t("newOrder.consignmentInfoDesc")}</p>
              </div>
              <div className="mt-4 p-3 bg-white/10 rounded-xl border border-white/20">
                <p className="text-xs text-white leading-relaxed font-medium">
                  💡 {t("newOrder.consignmentNote")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
