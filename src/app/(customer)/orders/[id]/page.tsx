"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { useI18n } from "@/lib/i18n";
import { getStatusInfo, getDelayWarning, getProgressSteps } from "@/lib/shipment-timeline-info";

const ORDER_TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  ECOMMERCE: { icon: "🛒", color: "bg-blue-100 text-blue-700" },
  ENTRUST: { icon: "📦", color: "bg-emerald-100 text-emerald-700" },
  CONSIGNMENT: { icon: "🚚", color: "bg-orange-100 text-orange-700" },
};

const ORDER_TYPE_KEYS: Record<string, string> = {
  ECOMMERCE: "customerOrder.typeEcommerce",
  ENTRUST: "customerOrder.typeEntrust",
  CONSIGNMENT: "customerOrder.typeConsignment",
};

interface OrderDetail {
  id: string;
  orderCode: string;
  orderType: string;
  productName: string;
  productLink: string;
  productSpecs: string | null;
  quantity: number;
  unitPriceCNY: string;
  totalPriceCNY: string;
  exchangeRate: string;
  totalPriceVND: string;
  serviceFeePercent: string;
  serviceFeeVND: string;
  chinaShippingFee: string;
  weightKg: string | null;
  volume: string | null;
  requiresVat: boolean;
  taxCode: string | null;
  companyName: string | null;
  companyAddress: string | null;
  entrustShipmentType: string | null;
  entrustServices: string | null;
  cargoValueCurrency: string | null;
  cargoValueAmount: string | null;
  cargoValueVND: string | null;
  dimensionLength: string | null;
  dimensionWidth: string | null;
  dimensionHeight: string | null;
  cbm: string | null;
  entrustQuantity: number | null;
  waybillCode: string | null;
  waybillImages: string | null;
  relatedDocuments: string | null;
  cnTruckPlate: string | null;
  cnDriverName: string | null;
  cnDriverPhone: string | null;
  cnTruckImages: string | null;
  consignmentTrackingNumber: string | null;
  consignmentNotes: string | null;
  shippingAddress: string | null;
  chinaWarehouse: {
    id: string;
    nameVi: string;
    nameZh: string;
    nameEn: string;
    addressVi: string;
    addressZh: string;
    addressEn: string;
  } | null;
  internationalShippingRate: string;
  internationalShippingFee: string;
  vietnamDeliveryFee: string;
  totalCostVND: string;
  confirmedProductCost: string | null;
  confirmedShippingCost: string | null;
  confirmedServiceFee: string | null;
  confirmedTotalCost: string | null;
  confirmedAt: string | null;
  status: string;
  trackingCodeChina: string | null;
  trackingCodeIntl: string | null;
  notes: string | null;
  customStatusNote: string | null;
  createdAt: string;
  user: { id: string; fullName: string; email: string; phone: string | null; address: string | null };
  statusLogs: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    createdAt: string;
    changer: { fullName: string; role: string };
  }>;
  orderNotes: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: { fullName: string; role: string };
  }>;
}

const ISSUE_TYPE_KEYS: Record<string, string> = {
  THIEU_HANG: "customerOrder.issueShortage",
  GIAO_CHAM: "customerOrder.issueLateDel",
  SAI_CAN: "customerOrder.issueWrongWeight",
  HONG_HANG: "customerOrder.issueDamaged",
  CHUA_NHAN: "customerOrder.issueNotReceived",
  PHI_SAI: "customerOrder.issueWrongFee",
  CHATBOT: "customerOrder.issueChatbot",
  KHAC: "customerOrder.issueOther",
};

export default function OrderDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueType, setIssueType] = useState("KHAC");
  const [issueDesc, setIssueDesc] = useState("");
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState(false);
  const [zaloBound, setZaloBound] = useState<boolean | null>(null);
  const [orderCodeCopied, setOrderCodeCopied] = useState(false);
  const [warehouseCopied, setWarehouseCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setOrder(d);
        setLoading(false);
      });
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setZaloBound(!!data?.zaloRecipientId))
      .catch(() => {});
  }, [params.id]);

  async function addNote() {
    if (!newNote.trim()) return;
    await fetch(`/api/orders/${params.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newNote }),
    });
    setNewNote("");
    const res = await fetch(`/api/orders/${params.id}`);
    setOrder(await res.json());
  }

  async function submitIssue() {
    if (!issueDesc.trim() || !order) return;
    setIssueSubmitting(true);
    try {
      const res = await fetch("/api/customer/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderCode: order.orderCode,
          issueType,
          description: issueDesc,
        }),
      });
      if (res.ok) {
        setIssueSuccess(true);
        setShowIssueForm(false);
        setIssueDesc("");
        setIssueType("KHAC");
      }
    } finally {
      setIssueSubmitting(false);
    }
  }

  if (loading || !order) return <LoadingSpinner text={t("orderDetail.loading")} />;

  const fmt = (v: string) => parseFloat(v).toLocaleString();

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2 flex-wrap">
            {t("orders.order")} {order.orderCode}
            {(() => {
              const typeInfo = ORDER_TYPE_ICONS[order.orderType] || ORDER_TYPE_ICONS.ECOMMERCE;
              const typeKey = ORDER_TYPE_KEYS[order.orderType] || ORDER_TYPE_KEYS.ECOMMERCE;
              return (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${typeInfo.color}`}>
                  {typeInfo.icon} {t(typeKey)}
                </span>
              );
            })()}
          </span>
        }
        subtitle={`${t("orders.createdOn")} ${new Date(order.createdAt).toLocaleDateString()}`}
        action={<StatusBadge status={order.status} />}
      />

      {order.customStatusNote && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <span className="text-sm font-medium text-amber-700">{t("customerOrder.statusNote")}: {order.customStatusNote}</span>
        </div>
      )}

      {/* Current status explanation + next step */}
      {order.status !== "CANCELLED" && (() => {
        const info = getStatusInfo(order.status);
        const lastLog = order.statusLogs[order.statusLogs.length - 1];
        const delayMsg = lastLog ? getDelayWarning(order.status, lastLog.createdAt) : null;
        return (
          <Card>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{info.icon}</span>
                <div>
                  <p className="text-sm font-medium text-slate-800">{t(`status.${order.status}.description`, info.description)}</p>
                  <p className="text-sm text-blue-600 mt-1">{t(`status.${order.status}.nextStep`, info.nextStep)}</p>
                </div>
              </div>
              {delayMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-base">⏰</span>
                  <span className="text-sm font-medium text-amber-700">{delayMsg}</span>
                </div>
              )}
              {/* Progress bar */}
              <div className="pt-2">
                <div className="flex justify-between">
                  {getProgressSteps(order.status).map((step) => (
                    <div key={step.status} className="flex flex-col items-center" style={{ width: "11%" }}>
                      <span className={`text-sm ${step.current ? "" : step.completed ? "opacity-60" : "opacity-25 grayscale"}`}>
                        {step.icon}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${(() => { const steps = getProgressSteps(order.status); const idx = steps.findIndex(s => s.current); return Math.round(((idx >= 0 ? idx : 0) / (steps.length - 1)) * 100); })()}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        );
      })()}

      {/* Status helper blocks */}
      {order.status !== "CANCELLED" && (() => {
        const lastLog = order.statusLogs[order.statusLogs.length - 1];
        const delayMsg = lastLog ? getDelayWarning(order.status, lastLog.createdAt) : null;
        const isSellerShipped = order.status === "SELLER_SHIPPED";
        const isShippingIntl = order.status === "SHIPPING_TO_VIETNAM";
        const isAtVietnamWh = order.status === "ARRIVED_VIETNAM_WH";
        const isOutForDelivery = order.status === "OUT_FOR_DELIVERY";
        const isCompleted = order.status === "COMPLETED";

        return (
          <>
            {delayMsg && !isCompleted && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-lg shrink-0">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-amber-900">{t("customerOrder.orderDelayed")}</p>
                  <p className="text-sm text-amber-700 mt-1">{t(`status.${order.status}.delayWarning`, delayMsg!)}</p>
                  <p className="text-xs text-amber-600 mt-2">{t("customerOrder.orderDelayedHint")}</p>
                </div>
              </div>
            )}
            {isSellerShipped && !delayMsg && (
              <div className="flex items-start gap-3 p-3 bg-sky-50 border border-sky-200 rounded-xl">
                <span className="text-lg shrink-0">📦</span>
                <div>
                  <p className="text-sm font-semibold text-sky-900">{t("customerOrder.sellerShipping")}</p>
                  <p className="text-sm text-sky-700 mt-0.5">{t("customerOrder.sellerShippingDesc")}</p>
                </div>
              </div>
            )}
            {isShippingIntl && !delayMsg && (
              <div className="flex items-start gap-3 p-3 bg-sky-50 border border-sky-200 rounded-xl">
                <span className="text-lg shrink-0">🚛</span>
                <div>
                  <p className="text-sm font-semibold text-sky-900">{t("customerOrder.intlShipping")}</p>
                  <p className="text-sm text-sky-700 mt-0.5">{t("customerOrder.intlShippingDesc")}</p>
                </div>
              </div>
            )}
            {isAtVietnamWh && !delayMsg && (
              <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-lg shrink-0">🏠</span>
                <div>
                  <p className="text-sm font-semibold text-emerald-900">{t("customerOrder.vnWarehouseProcessing")}</p>
                  <p className="text-sm text-emerald-700 mt-0.5">{t("customerOrder.vnWarehouseProcessingDesc")}</p>
                </div>
              </div>
            )}
            {isOutForDelivery && !delayMsg && (
              <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-lg shrink-0">🚚</span>
                <div>
                  <p className="text-sm font-semibold text-emerald-900">{t("customerOrder.outForDelivery")}</p>
                  <p className="text-sm text-emerald-700 mt-0.5">{t("customerOrder.outForDeliveryDesc")}</p>
                </div>
              </div>
            )}
            {isCompleted && (
              <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-lg shrink-0">✅</span>
                <div>
                  <p className="text-sm font-semibold text-emerald-900">{t("customerOrder.orderCompleted")}</p>
                  <p className="text-sm text-emerald-700 mt-0.5">{t("customerOrder.orderCompletedDesc")}</p>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {zaloBound === false && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <span className="text-lg shrink-0">📱</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900">{t("customerOrder.zaloAutoNotify")}</p>
            <p className="text-sm text-blue-700 mt-1">
              {t("customerOrder.zaloLinkPrompt")}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-mono bg-white px-2.5 py-1.5 rounded border border-blue-200 text-blue-900 font-semibold text-sm">{order.orderCode}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(order.orderCode).then(() => {
                    setOrderCodeCopied(true);
                    setTimeout(() => setOrderCodeCopied(false), 2000);
                  });
                }}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                {orderCodeCopied ? t("customerOrder.copied") : t("customerOrder.copyOrderCode")}
              </button>
            </div>
            <Link
              href="/notifications"
              className="inline-block mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2"
            >
              {t("customerOrder.setupNotifChannel")}
            </Link>
          </div>
        </div>
      )}

      {zaloBound === true && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <span className="text-sm shrink-0">✅</span>
          <div>
            <p className="text-sm font-medium text-emerald-800">{t("customerOrder.zaloLinked")}</p>
            <p className="text-xs text-emerald-700 mt-0.5">{t("customerOrder.zaloLinkedDesc")}</p>
          </div>
        </div>
      )}

      {/* Liên hệ hỗ trợ */}
      {order.status !== "CANCELLED" && order.status !== "COMPLETED" && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">💬</span>
            <p className="text-sm font-semibold text-slate-800">{t("customerOrder.contactSupport")}</p>
          </div>
          <div className="space-y-1.5 text-sm text-slate-600">
            {zaloBound ? (
              <p>{t("customerOrder.zaloSupportBound")}</p>
            ) : (
              <p>
                {t("customerOrder.zaloSupportUnbound")}{" "}
                <Link href="/notifications" className="font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2">
                  {t("customerOrder.setupNotifChannel")}
                </Link>
              </p>
            )}
            <p className="text-xs text-slate-500">{t("customerOrder.orSubmitComplaint")}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Info — dynamic per order type */}
        {order.orderType === "ECOMMERCE" && (
          <Card title={t("orderDetail.productInfo")}>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between items-start">
                <dt className="text-slate-500">{t("orderDetail.product")}</dt>
                <dd className="font-medium text-slate-900 text-right max-w-[60%]">{order.productName}</dd>
              </div>
              {order.productLink && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">{t("orderDetail.link")}</dt>
                  <dd><a href={order.productLink} target="_blank" className="text-blue-600 hover:text-blue-700 font-medium">{t("orderDetail.viewProduct")}</a></dd>
                </div>
              )}
              {order.productSpecs && (
                <div className="flex justify-between items-start">
                  <dt className="text-slate-500">{t("orderDetail.specs")}</dt>
                  <dd className="text-slate-700 text-right max-w-[60%]">{order.productSpecs}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate-500">{t("orderDetail.quantity")}</dt>
                <dd className="font-medium text-slate-900">{order.quantity}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">{t("orderDetail.unitPrice")}</dt>
                <dd className="font-medium text-slate-900">&yen;{fmt(order.unitPriceCNY)} CNY</dd>
              </div>
              {order.weightKg && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">{t("orderDetail.weight")}</dt>
                  <dd className="font-medium text-slate-900">{order.weightKg} kg</dd>
                </div>
              )}
              {order.notes && (
                <div className="flex justify-between items-start">
                  <dt className="text-slate-500">{t("orderDetail.notes")}</dt>
                  <dd className="text-slate-700 text-right max-w-[60%]">{order.notes}</dd>
                </div>
              )}
            </dl>
          </Card>
        )}

        {order.orderType === "ENTRUST" && (
          <Card title={t("orderDetail.entrustDetails")}>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between items-start"><dt className="text-slate-500">{t("newOrder.itemName")}</dt><dd className="font-medium text-slate-900 text-right max-w-[60%]">{order.productName}</dd></div>
              {order.entrustShipmentType && (
                <div className="flex justify-between"><dt className="text-slate-500">{t("entrust.shipmentType")}</dt><dd><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-xs font-semibold">{order.entrustShipmentType === "FCL" ? "🚛" : "📦"} {order.entrustShipmentType}</span></dd></div>
              )}
              {order.entrustServices && (() => { try { const svc = JSON.parse(order.entrustServices); return Array.isArray(svc) && svc.length > 0 ? (
                <div className="flex justify-between items-start"><dt className="text-slate-500">{t("entrust.selectServices")}</dt><dd className="flex flex-wrap gap-1 justify-end max-w-[60%]">{svc.map((s: string) => <span key={s} className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs">{t(`entrust.${s === "PICKUP_CN" ? "pickupCn" : s === "CUSTOMS" ? "customs" : s === "SUPERVISION" ? "supervision" : s === "TRANSLOADING" ? "transloading" : "transport"}`)}</span>)}</dd></div>
              ) : null; } catch { return null; } })()}
              {(order.dimensionLength || order.dimensionWidth || order.dimensionHeight) && (
                <div className="flex justify-between"><dt className="text-slate-500">{t("entrust.productInfo")}</dt><dd className="font-medium text-slate-900">{order.dimensionLength || "—"} × {order.dimensionWidth || "—"} × {order.dimensionHeight || "—"} cm</dd></div>
              )}
              {order.cbm && <div className="flex justify-between"><dt className="text-slate-500">CBM</dt><dd className="font-medium text-slate-900">{order.cbm} m³</dd></div>}
              {order.entrustQuantity && <div className="flex justify-between"><dt className="text-slate-500">{t("entrust.quantity")}</dt><dd className="font-medium text-slate-900">{order.entrustQuantity}</dd></div>}
              {order.weightKg && <div className="flex justify-between"><dt className="text-slate-500">{t("newOrder.weight")}</dt><dd className="font-medium text-slate-900">{order.weightKg} kg</dd></div>}
              {order.volume && <div className="flex justify-between"><dt className="text-slate-500">{t("newOrder.volume")}</dt><dd className="font-medium text-slate-900">{order.volume} m³</dd></div>}
              {order.cargoValueAmount && (
                <div className="flex justify-between"><dt className="text-slate-500">{t("entrust.cargoValue")}</dt><dd className="font-medium text-slate-900">{order.cargoValueCurrency} {parseFloat(order.cargoValueAmount).toLocaleString()}{order.cargoValueVND ? ` ≈ ${parseFloat(order.cargoValueVND).toLocaleString()} VNĐ` : ""}</dd></div>
              )}
              {order.waybillCode && <div className="flex justify-between"><dt className="text-slate-500">{t("entrust.waybillCode")}</dt><dd className="font-mono font-medium text-slate-900">{order.waybillCode}</dd></div>}
              {order.waybillImages && (() => { try { const imgs = JSON.parse(order.waybillImages); return Array.isArray(imgs) && imgs.length > 0 ? (
                <div><dt className="text-slate-500 mb-2">{t("entrust.waybillImages")}</dt><dd className="flex gap-2 flex-wrap">{imgs.map((url: string, i: number) => <a key={i} href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={`waybill-${i}`} className="w-16 h-16 rounded-lg object-cover border border-slate-200" /></a>)}</dd></div>
              ) : null; } catch { return null; } })()}
              {order.relatedDocuments && (() => { try { const docs = JSON.parse(order.relatedDocuments); return Array.isArray(docs) && docs.length > 0 ? (
                <div><dt className="text-slate-500 mb-2">{t("entrust.relatedDocs")}</dt><dd className="space-y-1">{docs.map((url: string, i: number) => <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline text-xs truncate">📎 {url.split("/").pop()}</a>)}</dd></div>
              ) : null; } catch { return null; } })()}
              {(order.cnTruckPlate || order.cnDriverName || order.cnDriverPhone) && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <dt className="text-slate-500 font-medium">{t("entrust.cnTruckInfo")}</dt>
                  {order.cnTruckPlate && <div className="flex justify-between"><span className="text-slate-400">{t("entrust.truckPlate")}</span><span className="font-medium text-slate-900">{order.cnTruckPlate}</span></div>}
                  {order.cnDriverName && <div className="flex justify-between"><span className="text-slate-400">{t("entrust.driverName")}</span><span className="font-medium text-slate-900">{order.cnDriverName}</span></div>}
                  {order.cnDriverPhone && <div className="flex justify-between"><span className="text-slate-400">{t("entrust.driverPhone")}</span><span className="font-medium text-slate-900">{order.cnDriverPhone}</span></div>}
                </div>
              )}
              {order.cnTruckImages && (() => { try { const imgs = JSON.parse(order.cnTruckImages); return Array.isArray(imgs) && imgs.length > 0 ? (
                <div><dt className="text-slate-500 mb-2">{t("entrust.truckPhotos")}</dt><dd className="flex gap-2 flex-wrap">{imgs.map((url: string, i: number) => <a key={i} href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={`truck-${i}`} className="w-16 h-16 rounded-lg object-cover border border-slate-200" /></a>)}</dd></div>
              ) : null; } catch { return null; } })()}
              {order.requiresVat && (
                <>
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{t("newOrder.requiresVat")}</span>
                  </div>
                  {order.taxCode && <div className="flex justify-between"><dt className="text-slate-500">{t("newOrder.taxCode")}</dt><dd className="font-medium text-slate-900">{order.taxCode}</dd></div>}
                  {order.companyName && <div className="flex justify-between items-start"><dt className="text-slate-500">{t("newOrder.companyName")}</dt><dd className="font-medium text-slate-900 text-right max-w-[60%]">{order.companyName}</dd></div>}
                  {order.companyAddress && <div className="flex justify-between items-start"><dt className="text-slate-500">{t("newOrder.companyAddress")}</dt><dd className="font-medium text-slate-900 text-right max-w-[60%]">{order.companyAddress}</dd></div>}
                </>
              )}
              {order.notes && (
                <div className="flex justify-between items-start"><dt className="text-slate-500">{t("orderDetail.notes")}</dt><dd className="text-slate-700 text-right max-w-[60%]">{order.notes}</dd></div>
              )}
            </dl>
          </Card>
        )}

        {order.orderType === "CONSIGNMENT" && (
          <Card title={t("orderDetail.consignmentDetails")}>
            <dl className="space-y-3 text-sm">
              {order.consignmentTrackingNumber && (
                <div className="flex justify-between">
                  <dt className="text-slate-500">{t("newOrder.consignmentTracking")}</dt>
                  <dd className="font-mono font-medium text-slate-900">{order.consignmentTrackingNumber}</dd>
                </div>
              )}
              {order.consignmentNotes && (
                <div className="flex justify-between items-start">
                  <dt className="text-slate-500">{t("newOrder.consignmentNotes")}</dt>
                  <dd className="text-slate-700 text-right max-w-[60%]">{order.consignmentNotes}</dd>
                </div>
              )}
              {order.notes && (
                <div className="flex justify-between items-start">
                  <dt className="text-slate-500">{t("orderDetail.notes")}</dt>
                  <dd className="text-slate-700 text-right max-w-[60%]">{order.notes}</dd>
                </div>
              )}
            </dl>
          </Card>
        )}

        {order.chinaWarehouse && (() => {
          const wh = order.chinaWarehouse;
          const whName = locale === "zh" ? wh.nameZh : locale === "en" ? wh.nameEn : wh.nameVi;
          const whAddress = locale === "zh" ? wh.addressZh : locale === "en" ? wh.addressEn : wh.addressVi;
          const copyText = `${whName}\n${whAddress}`;
          return (
            <Card title={t("adminOrder.shippingAddressTitle")}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🏭</span>
                  <span className="text-sm font-semibold text-slate-900">{whName}</span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-line pl-7">{whAddress}</p>
                <div className="pl-7">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(copyText).then(() => {
                        setWarehouseCopied(true);
                        setTimeout(() => setWarehouseCopied(false), 2000);
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    {warehouseCopied ? t("customerOrder.copied") : t("customerOrder.copyAddress")}
                  </button>
                </div>
              </div>
            </Card>
          );
        })()}

        {order.orderType === "CONSIGNMENT" && order.shippingAddress && !order.chinaWarehouse && (
          <Card title={t("adminOrder.shippingAddressTitle")}>
            <div className="flex items-start gap-3">
              <p className="flex-1 text-sm text-slate-800 whitespace-pre-line">{order.shippingAddress}</p>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(order.shippingAddress!)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {t("customerOrder.copyAddress")}
              </button>
            </div>
          </Card>
        )}

        <Card title={t("orderDetail.costBreakdown")}>
          {order.confirmedTotalCost ? (
            <>
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-800">{t("pricing.companyConfirmed")}</span>
                </div>
                <dl className="space-y-2 text-sm">
                  {order.confirmedProductCost && (
                    <div className="flex justify-between">
                      <dt className="text-emerald-700">{t("pricing.confirmedProduct")}</dt>
                      <dd className="font-medium text-emerald-900">{fmt(order.confirmedProductCost)} VND</dd>
                    </div>
                  )}
                  {order.confirmedShippingCost && (
                    <div className="flex justify-between">
                      <dt className="text-emerald-700">{t("pricing.confirmedShipping")}</dt>
                      <dd className="font-medium text-emerald-900">{fmt(order.confirmedShippingCost)} VND</dd>
                    </div>
                  )}
                  {order.confirmedServiceFee && (
                    <div className="flex justify-between">
                      <dt className="text-emerald-700">{t("pricing.confirmedService")}</dt>
                      <dd className="font-medium text-emerald-900">{fmt(order.confirmedServiceFee)} VND</dd>
                    </div>
                  )}
                  <div className="flex justify-between items-end pt-2 border-t border-emerald-200">
                    <dt className="font-bold text-emerald-900">{t("pricing.finalCost")}</dt>
                    <dd className="text-xl font-bold text-emerald-700">{fmt(order.confirmedTotalCost)} VND</dd>
                  </div>
                </dl>
              </div>
              <details className="group">
                <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
                  {t("pricing.showEstimate")}
                </summary>
                <dl className="space-y-2 text-sm mt-3 opacity-60">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">{t("orderDetail.productCostCNY")}</dt>
                    <dd className="font-medium text-slate-900">&yen;{fmt(order.totalPriceCNY)}</dd>
                  </div>
                  <div className="flex justify-between items-end pt-2 border-t border-slate-100">
                    <dt className="font-bold text-slate-900">{t("pricing.systemEstimate")}</dt>
                    <dd className="text-lg font-bold text-slate-400 line-through">{fmt(order.totalCostVND)} VND</dd>
                  </div>
                </dl>
              </details>
            </>
          ) : (
            <>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">{t("orderDetail.productCostCNY")}</dt>
                  <dd className="font-medium text-slate-900">&yen;{fmt(order.totalPriceCNY)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">{t("orderDetail.exchangeRate")}</dt>
                  <dd className="font-medium text-slate-900">1 CNY = {fmt(order.exchangeRate)} VND</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">{t("orderDetail.productCostVND")}</dt>
                  <dd className="font-medium text-slate-900">{fmt(order.totalPriceVND)} VND</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">{t("orderDetail.serviceFee")} ({order.serviceFeePercent}%)</dt>
                  <dd className="font-medium text-slate-900">{fmt(order.serviceFeeVND)} VND</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">{t("orderDetail.chinaShipping")}</dt>
                  <dd className="font-medium text-slate-900">{fmt(order.chinaShippingFee)} VND</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">{t("orderDetail.intlShipping")}</dt>
                  <dd className="font-medium text-slate-900">{fmt(order.internationalShippingFee)} VND</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">{t("orderDetail.vnDelivery")}</dt>
                  <dd className="font-medium text-slate-900">{fmt(order.vietnamDeliveryFee)} VND</dd>
                </div>
                <div className="flex justify-between items-end pt-3 border-t border-slate-100">
                  <dt className="font-bold text-slate-900">{t("pricing.systemEstimate")}</dt>
                  <dd className="text-xl font-bold text-blue-600">{fmt(order.totalCostVND)} VND</dd>
                </div>
              </dl>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    {t("pricing.awaitingConfirmation")}
                  </p>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {(order.trackingCodeChina || order.trackingCodeIntl) && (
        <Card title={t("orderDetail.trackingInfo")}>
          <dl className="space-y-3 text-sm">
            {order.trackingCodeChina && (
              <div className="flex justify-between">
                <dt className="text-slate-500">{t("orderDetail.chinaTracking")}</dt>
                <dd className="font-mono text-sm bg-slate-50 px-3 py-1 rounded-lg text-slate-900">{order.trackingCodeChina}</dd>
              </div>
            )}
            {order.trackingCodeIntl && (
              <div className="flex justify-between">
                <dt className="text-slate-500">{t("orderDetail.intlTracking")}</dt>
                <dd className="font-mono text-sm bg-slate-50 px-3 py-1 rounded-lg text-slate-900">{order.trackingCodeIntl}</dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      <Card title={t("orderDetail.statusTimeline")}>
        <div className="space-y-1">
          {order.statusLogs.map((log, i) => (
            <div key={log.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-3.5 h-3.5 rounded-full border-2 ${i === order.statusLogs.length - 1 ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"}`} />
                {i < order.statusLogs.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
              </div>
              <div className="pb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{getStatusInfo(log.toStatus).icon}</span>
                  <StatusBadge status={log.toStatus} />
                </div>
                <p className="text-xs text-slate-500 mt-1">{t(`status.${log.toStatus}.description`, getStatusInfo(log.toStatus).description)}</p>
                {log.note && <p className="text-sm text-slate-600 mt-1 italic">{log.note}</p>}
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(log.createdAt).toLocaleString("vi-VN")} — {log.changer.fullName}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t("orderDetail.notes")}>
        <div className="space-y-3 mb-5">
          {order.orderNotes.map((note) => (
            <div key={note.id} className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-700">{note.content}</p>
              <p className="text-xs text-slate-400 mt-2">
                {note.user.fullName} ({t(`role.${note.user.role}`, note.user.role)}) — {new Date(note.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
          {order.orderNotes.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">{t("orderDetail.noNotes")}</p>
          )}
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder={t("orderDetail.addNotePlaceholder")}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          <button onClick={addNote} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            {t("orderDetail.addNote")}
          </button>
        </div>
      </Card>

      {/* Issue / Complaint submission */}
      {issueSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <span className="text-base">✅</span>
          <span className="text-sm font-medium text-emerald-700">
            {t("customerOrder.issueSubmitted")}
          </span>
        </div>
      )}
      <Card>
        {!showIssueForm ? (
          <button
            onClick={() => setShowIssueForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
          >
            <span className="text-base">📋</span>
            {t("customerOrder.submitIssueBtn")}
          </button>
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">{t("customerOrder.issueFormTitle")} {order.orderCode}</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("customerOrder.issueTypeLabel")}</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(ISSUE_TYPE_KEYS).map(([key, tKey]) => (
                  <option key={key} value={key}>{t(tKey)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("customerOrder.issueDescLabel")}</label>
              <textarea
                value={issueDesc}
                onChange={(e) => setIssueDesc(e.target.value)}
                placeholder={t("customerOrder.issueDescPlaceholder")}
                rows={3}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={submitIssue}
                disabled={issueSubmitting || !issueDesc.trim()}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {issueSubmitting ? t("customerOrder.submitting") : t("customerOrder.submitComplaint")}
              </button>
              <button
                onClick={() => { setShowIssueForm(false); setIssueDesc(""); }}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                {t("customerOrder.cancel")}
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
