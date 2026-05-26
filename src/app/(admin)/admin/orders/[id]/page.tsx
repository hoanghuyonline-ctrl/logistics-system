"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n";

const TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PURCHASED", "CANCELLED"],
  PURCHASED: ["SELLER_SHIPPED", "CANCELLED"],
  SELLER_SHIPPED: ["ARRIVED_CHINA_WH"],
  ARRIVED_CHINA_WH: ["PACKING"],
  PACKING: ["SHIPPING_TO_VIETNAM"],
  SHIPPING_TO_VIETNAM: ["ARRIVED_VIETNAM_WH"],
  ARRIVED_VIETNAM_WH: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["COMPLETED"],
};

const ORDER_TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  ECOMMERCE: { label: "Thương mại điện tử", icon: "🛒", color: "bg-blue-100 text-blue-700" },
  ENTRUST: { label: "Ủy thác XNK", icon: "📦", color: "bg-emerald-100 text-emerald-700" },
  CONSIGNMENT: { label: "Ký gửi", icon: "🚚", color: "bg-orange-100 text-orange-700" },
};

interface OrderDetail {
  id: string;
  orderCode: string;
  orderType: string;
  productName: string;
  productLink: string;
  productImage: string | null;
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
  priority: string;
  trackingCodeChina: string | null;
  trackingCodeIntl: string | null;
  notes: string | null;
  customStatusNote: string | null;
  createdAt: string;
  user: { id: string; fullName: string; email: string; phone: string | null; address: string | null; zaloRecipientId: string | null };
  package: { packageCode: string; barcode: string | null } | null;
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

export default function AdminOrderDetailPage() {
  const { t } = useI18n();
  const params = useParams();
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState({ trackingCodeChina: "", trackingCodeIntl: "" });
  const [weight, setWeight] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [customNoteEditing, setCustomNoteEditing] = useState(false);
  const [customNoteSaving, setCustomNoteSaving] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [pricingForm, setPricingForm] = useState({
    productValueCNY: "",
    serviceFee: "",
    chinaShipping: "",
    internationalShipping: "",
    vietnamDelivery: "",
  });
  const [pricingSaving, setPricingSaving] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingAddressSaving, setShippingAddressSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function copyToClipboard(value: string) {
    navigator.clipboard.writeText(value).then(() => {
      toast("Đã sao chép", "success");
    });
  }

  function applyOrder(d: OrderDetail) {
    setOrder(d);
    setTracking({ trackingCodeChina: d.trackingCodeChina || "", trackingCodeIntl: d.trackingCodeIntl || "" });
    setWeight(d.weightKg || "");
    setCustomNote(d.customStatusNote || "");
    const rate = parseFloat(String(d.exchangeRate)) || 0;
    setPricingForm({
      productValueCNY: d.confirmedProductCost && rate > 0
        ? (parseFloat(d.confirmedProductCost) / rate).toFixed(2)
        : "",
      serviceFee: d.confirmedServiceFee || "",
      chinaShipping: d.chinaShippingFee || "",
      internationalShipping: d.internationalShippingFee || "",
      vietnamDelivery: d.vietnamDeliveryFee || "",
    });
    setShippingAddress(d.shippingAddress || d.user?.address || "");
  }

  const loadOrder = useCallback(() => {
    fetch(`/api/orders/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (!d || d.error) throw new Error(d?.error || "Invalid response");
        applyOrder(d);
        setError(null);
      })
      .catch((err) => {
        console.error("[admin/orders/detail] load failed:", err);
        setError(err?.message || "Không thể tải đơn hàng");
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  async function updateStatus(newStatus: string) {
    const res = await fetch(`/api/orders/${params.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      toast(t("orderDetail.statusUpdated"), "success");
      loadOrder();
    } else {
      const data = await res.json();
      toast(data.error || t("orderDetail.statusUpdateFailed"), "error");
    }
  }

  async function saveTracking() {
    const res = await fetch(`/api/orders/${params.id}/tracking`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tracking),
    });
    toast(res.ok ? t("orderDetail.trackingSaved") : t("orderDetail.trackingSaveFailed"), res.ok ? "success" : "error");
  }

  async function saveCustomNote() {
    setCustomNoteSaving(true);
    const res = await fetch(`/api/orders/${params.id}/custom-status-note`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customStatusNote: customNote }),
    });
    if (res.ok) {
      toast("Đã lưu ghi chú trạng thái", "success");
      setCustomNoteEditing(false);
      loadOrder();
    } else {
      toast("Không thể lưu ghi chú", "error");
    }
    setCustomNoteSaving(false);
  }

  async function clearCustomNote() {
    setCustomNoteSaving(true);
    const res = await fetch(`/api/orders/${params.id}/custom-status-note`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customStatusNote: "" }),
    });
    if (res.ok) {
      toast("Đã xoá ghi chú trạng thái", "success");
      setCustomNote("");
      setCustomNoteEditing(false);
      loadOrder();
    } else {
      toast("Không thể xoá ghi chú", "error");
    }
    setCustomNoteSaving(false);
  }

  async function sendNote() {
    if (!newNote.trim()) return;
    const res = await fetch(`/api/orders/${params.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newNote.trim() }),
    });
    if (res.ok) {
      toast("Đã gửi cập nhật cho khách", "success");
      setNewNote("");
      loadOrder();
    } else {
      toast("Không thể gửi cập nhật", "error");
    }
  }

  async function updatePriority(newPriority: string) {
    const res = await fetch(`/api/orders/${params.id}/priority`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: newPriority }),
    });
    if (res.ok) {
      toast("Đã cập nhật độ ưu tiên", "success");
      loadOrder();
    } else {
      toast("Không thể cập nhật độ ưu tiên", "error");
    }
  }

  async function saveWeight() {
    const res = await fetch(`/api/orders/${params.id}/weight`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weightKg: parseFloat(weight) }),
    });
    if (res.ok) {
      toast(t("orderDetail.weightUpdated"), "success");
      loadOrder();
    } else {
      toast(t("orderDetail.weightUpdateFailed"), "error");
    }
  }

  async function saveShippingAddress() {
    setShippingAddressSaving(true);
    const res = await fetch(`/api/orders/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shippingAddress }),
    });
    if (res.ok) {
      toast("Đã lưu địa chỉ nhận hàng", "success");
      loadOrder();
    } else {
      toast("Không thể lưu địa chỉ nhận hàng", "error");
    }
    setShippingAddressSaving(false);
  }

  const orderExchangeRate = parseFloat(String(order?.exchangeRate)) || 0;
  const productValueVND = (parseFloat(pricingForm.productValueCNY) || 0) * orderExchangeRate;
  const serviceFeeVal = parseFloat(pricingForm.serviceFee) || 0;
  const chinaShippingVal = parseFloat(pricingForm.chinaShipping) || 0;
  const intlShippingVal = parseFloat(pricingForm.internationalShipping) || 0;
  const vnDeliveryVal = parseFloat(pricingForm.vietnamDelivery) || 0;
  const calculatedTotal = productValueVND + serviceFeeVal + chinaShippingVal + intlShippingVal + vnDeliveryVal;

  async function confirmPricing() {
    if (calculatedTotal <= 0) {
      toast("Vui lòng nhập chi phí cuối cùng", "error");
      return;
    }
    setPricingSaving(true);
    const res = await fetch(`/api/orders/${params.id}/confirm-pricing`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productValueCNY: parseFloat(pricingForm.productValueCNY) || 0,
        confirmedProductCost: productValueVND || null,
        confirmedServiceFee: serviceFeeVal || null,
        chinaShippingFee: chinaShippingVal || null,
        internationalShippingFee: intlShippingVal || null,
        vietnamDeliveryFee: vnDeliveryVal || null,
        confirmedShippingCost: chinaShippingVal + intlShippingVal + vnDeliveryVal || null,
        confirmedTotalCost: calculatedTotal,
      }),
    });
    if (res.ok) {
      toast("Đã xác nhận giá đơn hàng", "success");
      loadOrder();
    } else {
      const data = await res.json();
      toast(data.error || "Không thể xác nhận giá", "error");
    }
    setPricingSaving(false);
  }

  if (loading) return <LoadingSpinner text={t("orderDetail.loading")} />;

  if (error || !order) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Không thể tải chi tiết đơn hàng</h2>
          <p className="text-sm text-slate-600 mb-4">{error || "Đơn hàng không tồn tại hoặc đã bị xoá."}</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={loadOrder} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors">Thử lại</button>
            <Link href="/admin/orders" className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Quay lại danh sách</Link>
          </div>
        </div>
      </div>
    );
  }

  const fmt = (v: string | null | undefined) => {
    if (v == null) return "0";
    const n = parseFloat(String(v));
    return isNaN(n) ? "0" : n.toLocaleString();
  };
  const nextStatuses = TRANSITIONS[order.status] || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            {t("orders.order")} {order.orderCode}
            <button
              type="button"
              onClick={() => copyToClipboard(order.orderCode)}
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Sao chép mã đơn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          </span>
        }
        subtitle={`${t("orders.customer")}: ${order.user?.fullName || "—"} · ${order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "—"}`}
        action={
          <div className="flex items-center gap-2">
            {(() => {
              const typeInfo = ORDER_TYPE_LABELS[order.orderType] || ORDER_TYPE_LABELS.ECOMMERCE;
              return (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${typeInfo.color}`}>
                  {typeInfo.icon} {typeInfo.label}
                </span>
              );
            })()}
            <StatusBadge status={order.status} />
          </div>
        }
      />

      {/* Priority */}
      <Card title="Độ ưu tiên">
        <div className="flex gap-2 flex-wrap">
          {(["NORMAL", "HIGH", "URGENT"] as const).map((p) => {
            const config: Record<string, { label: string; active: string; inactive: string }> = {
              NORMAL: { label: "Bình thường", active: "bg-slate-600 text-white", inactive: "bg-white text-slate-600 border-slate-300 hover:bg-slate-50" },
              HIGH: { label: "Ưu tiên", active: "bg-amber-500 text-white", inactive: "bg-white text-amber-600 border-amber-300 hover:bg-amber-50" },
              URGENT: { label: "Khẩn cấp", active: "bg-red-600 text-white", inactive: "bg-white text-red-600 border-red-300 hover:bg-red-50" },
            };
            const c = config[p];
            const isActive = order.priority === p;
            return (
              <button key={p} onClick={() => updatePriority(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${isActive ? c.active : c.inactive}`}>
                {c.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Status transition */}
      {nextStatuses.length > 0 && (
        <Card title={t("orderDetail.updateStatus")}>
          <div className="flex gap-2 flex-wrap">
            {nextStatuses.map((s) => (
              <button key={s} onClick={() => updateStatus(s)}
                className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors shadow-sm ${
                  s === "CANCELLED" ? "bg-red-600 text-white hover:bg-red-700" : "bg-blue-600 text-white hover:bg-blue-700"
                }`}>
                → {t(`status.${s}`, s)}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Order Type Specific Info */}
      {order.orderType === "ECOMMERCE" && (
        <Card title={t("orderDetail.productInfo")}>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between items-start"><dt className="text-slate-500">{t("orderDetail.product")}</dt><dd className="font-medium text-slate-900 text-right max-w-[60%]">{order.productName}</dd></div>
            {order.productLink ? (() => {
              const domainLabels: Record<string, string> = { "taobao.com": "Taobao", "1688.com": "1688", "tmall.com": "Tmall", "alibaba.com": "Alibaba" };
              let hostname = "";
              try { hostname = new URL(order.productLink).hostname; } catch {}
              const matched = Object.entries(domainLabels).find(([d]) => hostname.includes(d));
              const label = matched ? `Mở link ${matched[1]}` : "Mở sản phẩm";
              return (
                <div className="flex justify-between">
                  <dt className="text-slate-500">{t("orderDetail.link")}</dt>
                  <dd><a href={order.productLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium">🔗 {label} ↗</a></dd>
                </div>
              );
            })() : null}
            {order.productSpecs && (
              <div className="flex justify-between items-start"><dt className="text-slate-500">{t("orderDetail.specs")}</dt><dd className="text-slate-700 text-right max-w-[60%]">{order.productSpecs}</dd></div>
            )}
            <div className="flex justify-between"><dt className="text-slate-500">{t("orderDetail.quantity")}</dt><dd className="font-medium text-slate-900">{order.quantity}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">{t("orderDetail.unitPrice")}</dt><dd className="font-medium text-slate-900">&yen;{fmt(order.unitPriceCNY)} CNY</dd></div>
            {order.notes && (
              <div className="flex justify-between items-start"><dt className="text-slate-500">{t("orderDetail.notes")}</dt><dd className="text-slate-700 text-right max-w-[60%]">{order.notes}</dd></div>
            )}
          </dl>
        </Card>
      )}

      {order.orderType === "ENTRUST" && (
        <Card title={t("orderDetail.entrustDetails")}>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between items-start"><dt className="text-slate-500">{t("newOrder.itemName")}</dt><dd className="font-medium text-slate-900 text-right max-w-[60%]">{order.productName}</dd></div>
            {order.entrustShipmentType && (
              <div className="flex justify-between"><dt className="text-slate-500">{t("entrust.shipmentType")}</dt><dd className="font-medium text-slate-900"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-xs font-semibold">{order.entrustShipmentType === "FCL" ? "🚛" : "📦"} {order.entrustShipmentType}</span></dd></div>
            )}
            {order.entrustServices && (() => { try { const svc = JSON.parse(order.entrustServices); return Array.isArray(svc) && svc.length > 0 ? (
              <div className="flex justify-between items-start"><dt className="text-slate-500">{t("entrust.selectServices")}</dt><dd className="flex flex-wrap gap-1 justify-end max-w-[60%]">{svc.map((s: string) => <span key={s} className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs">{t(`entrust.${s === "PICKUP_CN" ? "pickupCn" : s === "CUSTOMS" ? "customs" : s === "SUPERVISION" ? "supervision" : s === "TRANSLOADING" ? "transloading" : "transport"}`)}</span>)}</dd></div>
            ) : null; } catch { return null; } })()}
            {(order.dimensionLength || order.dimensionWidth || order.dimensionHeight) && (
              <div className="flex justify-between"><dt className="text-slate-500">{t("entrust.productInfo")}</dt><dd className="font-medium text-slate-900">{order.dimensionLength || "—"} × {order.dimensionWidth || "—"} × {order.dimensionHeight || "—"} cm</dd></div>
            )}
            {order.cbm && (
              <div className="flex justify-between"><dt className="text-slate-500">CBM</dt><dd className="font-medium text-slate-900">{order.cbm} m³</dd></div>
            )}
            {order.entrustQuantity && (
              <div className="flex justify-between"><dt className="text-slate-500">{t("entrust.quantity")}</dt><dd className="font-medium text-slate-900">{order.entrustQuantity}</dd></div>
            )}
            {order.weightKg && (
              <div className="flex justify-between"><dt className="text-slate-500">{t("newOrder.weight")}</dt><dd className="font-medium text-slate-900">{order.weightKg} kg</dd></div>
            )}
            {order.volume && (
              <div className="flex justify-between"><dt className="text-slate-500">{t("newOrder.volume")}</dt><dd className="font-medium text-slate-900">{order.volume} m³</dd></div>
            )}
            {order.cargoValueAmount && (
              <div className="flex justify-between"><dt className="text-slate-500">{t("entrust.cargoValue")}</dt><dd className="font-medium text-slate-900">{order.cargoValueCurrency} {parseFloat(order.cargoValueAmount).toLocaleString()}{order.cargoValueVND ? ` ≈ ${parseFloat(order.cargoValueVND).toLocaleString()} VNĐ` : ""}</dd></div>
            )}
            {order.waybillCode && (
              <div className="flex justify-between items-center"><dt className="text-slate-500">{t("entrust.waybillCode")}</dt><dd className="font-medium text-slate-900 font-mono">{order.waybillCode}</dd></div>
            )}
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
            <div className="flex justify-between">
              <dt className="text-slate-500">{t("newOrder.requiresVat")}</dt>
              <dd className={`font-medium ${order.requiresVat ? "text-emerald-600" : "text-slate-400"}`}>{order.requiresVat ? "Có" : "Không"}</dd>
            </div>
            {order.requiresVat && (
              <>
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
              <div className="flex justify-between items-center">
                <dt className="text-slate-500">{t("newOrder.consignmentTracking")}</dt>
                <dd className="font-medium text-slate-900 inline-flex items-center gap-1.5">
                  <span className="font-mono">{order.consignmentTrackingNumber}</span>
                  <button type="button" onClick={() => copyToClipboard(order.consignmentTrackingNumber!)} className="inline-flex items-center justify-center w-6 h-6 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Sao chép">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                  </button>
                </dd>
              </div>
            )}
            {order.consignmentNotes && (
              <div className="flex justify-between items-start"><dt className="text-slate-500">{t("newOrder.consignmentNotes")}</dt><dd className="text-slate-700 text-right max-w-[60%]">{order.consignmentNotes}</dd></div>
            )}
            {order.notes && (
              <div className="flex justify-between items-start"><dt className="text-slate-500">{t("orderDetail.notes")}</dt><dd className="text-slate-700 text-right max-w-[60%]">{order.notes}</dd></div>
            )}
          </dl>

          {/* Itemized consignment products table */}
          {order.productSpecs && (() => {
            try {
              const items = JSON.parse(order.productSpecs);
              if (!Array.isArray(items) || items.length === 0) return null;
              return (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="text-base">📋</span> Thông tin ký gửi chi tiết
                  </h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left">
                          <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase">#</th>
                          <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase">Tên sản phẩm</th>
                          <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase">Thuộc tính</th>
                          <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase text-right">Số lượng</th>
                          <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase text-right">Đơn giá (¥)</th>
                          <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((item: { productName?: string; specs?: string; quantity?: string; unitPriceCNY?: string; notes?: string }, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 text-slate-400 text-xs">{idx + 1}</td>
                            <td className="px-3 py-2 font-medium text-slate-900">{item.productName || "—"}</td>
                            <td className="px-3 py-2 text-slate-600">{item.specs || "—"}</td>
                            <td className="px-3 py-2 text-slate-900 text-right">{item.quantity || "—"}</td>
                            <td className="px-3 py-2 text-slate-900 text-right font-mono">¥{item.unitPriceCNY || "0"}</td>
                            <td className="px-3 py-2 text-slate-500 text-xs">{item.notes || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-blue-50/50 font-semibold">
                          <td colSpan={3} className="px-3 py-2 text-slate-700 text-right">Tổng</td>
                          <td className="px-3 py-2 text-slate-900 text-right">{items.reduce((s: number, i: { quantity?: string }) => s + parseInt(i.quantity || "0"), 0)}</td>
                          <td className="px-3 py-2 text-blue-700 text-right font-mono">¥{items.reduce((s: number, i: { unitPriceCNY?: string; quantity?: string }) => s + parseFloat(i.unitPriceCNY || "0") * parseInt(i.quantity || "0"), 0).toFixed(2)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            } catch {
              return null;
            }
          })()}
        </Card>
      )}

      {order.package && (
        <Card title="Kiện hàng">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <dt className="text-slate-500">Mã kiện</dt>
              <dd className="font-medium text-slate-900 inline-flex items-center gap-1.5">
                {order.package.packageCode}
                <button
                  type="button"
                  onClick={() => copyToClipboard(order.package!.packageCode)}
                  className="inline-flex items-center justify-center w-6 h-6 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Sao chép mã kiện"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </dd>
            </div>
            {order.package.barcode && (
              <div className="flex justify-between items-center">
                <dt className="text-slate-500">Barcode</dt>
                <dd className="font-medium text-slate-900 inline-flex items-center gap-1.5">
                  {order.package.barcode}
                  <button
                    type="button"
                    onClick={() => copyToClipboard(order.package!.barcode!)}
                    className="inline-flex items-center justify-center w-6 h-6 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Sao chép barcode"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                </dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title={t("orderDetail.customerInfo")}>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">{t("orderDetail.name")}</dt><dd className="font-medium text-slate-900">{order.user?.fullName || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">{t("orderDetail.email")}</dt><dd className="font-medium text-slate-900">{order.user?.email || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">{t("orderDetail.phone")}</dt><dd className="font-medium text-slate-900">{order.user?.phone || "—"}</dd></div>
            <div className="flex justify-between items-start"><dt className="text-slate-500">{t("orderDetail.address")}</dt><dd className="font-medium text-slate-900 text-right max-w-[60%]">{order.user?.address || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Zalo</dt><dd className={`font-medium ${order.user?.zaloRecipientId ? "text-emerald-600" : "text-amber-600"}`}>{order.user?.zaloRecipientId ? "Đã liên kết" : "Chưa liên kết"}</dd></div>
          </dl>

          {/* Quick contact actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            {order.user?.phone && (
              <>
                <button
                  onClick={() => copyToClipboard(order.user.phone!)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
                >
                  Sao chép SĐT
                </button>
                <a
                  href={`https://zalo.me/${order.user?.phone?.replace(/^0/, "84") || ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                >
                  Mở Zalo
                </a>
              </>
            )}
            <button
              onClick={() => copyToClipboard(order.user?.email || "")}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
            >
              Sao chép email
            </button>
            <button
              onClick={() => copyToClipboard(order.orderCode)}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
            >
              Sao chép mã đơn
            </button>
          </div>

          {order.user?.zaloRecipientId && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs font-medium text-emerald-700">Đã liên kết Zalo OA</span>
            </div>
          )}

          {!order.user?.zaloRecipientId && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 space-y-2">
              <p className="font-medium">Khách chưa liên kết Zalo — không nhận được thông báo qua Zalo</p>
              <p>Hướng dẫn khách liên kết: Mở Zalo, quét mã QR OA Bắc Trung Hải, rồi nhắn mã đơn bên dưới.</p>
              <div className="flex items-center gap-2">
                <span className="font-mono bg-white px-2 py-1 rounded border border-amber-300 text-amber-900 font-semibold">{order.orderCode}</span>
                <button
                  onClick={() => copyToClipboard(order.orderCode)}
                  className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-medium hover:bg-amber-200 transition-colors"
                >
                  Sao chép mã đơn
                </button>
              </div>
              <p className="text-xs text-amber-600">Sau khi khách nhắn mã đơn, hệ thống sẽ tự động liên kết tài khoản Zalo.</p>
            </div>
          )}
        </Card>

        <Card title={t("orderDetail.costBreakdown")}>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">{t("orderDetail.product")}</dt><dd className="font-medium text-slate-900">&yen;{fmt(order.totalPriceCNY)} = {fmt(order.totalPriceVND)} VND</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">{t("orderDetail.serviceFee")}</dt><dd className="font-medium text-slate-900">{fmt(order.serviceFeeVND)} VND</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">{t("orderDetail.cnShipping")}</dt><dd className="font-medium text-slate-900">{fmt(order.chinaShippingFee)} VND</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">{t("orderDetail.intlShippingShort")}</dt><dd className="font-medium text-slate-900">{fmt(order.internationalShippingFee)} VND</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">{t("orderDetail.vnDeliveryShort")}</dt><dd className="font-medium text-slate-900">{fmt(order.vietnamDeliveryFee)} VND</dd></div>
            <div className="flex justify-between items-end pt-3 border-t border-slate-100">
              <dt className="font-bold text-slate-900">{t("pricing.systemEstimate")}</dt>
              <dd className={`text-xl font-bold ${order.confirmedTotalCost ? "text-slate-400 line-through" : "text-blue-600"}`}>{fmt(order.totalCostVND)} VND</dd>
            </div>
          </dl>

          {order.confirmedTotalCost && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold text-emerald-800">{t("pricing.companyConfirmed")}</span>
                <span className="text-xs text-emerald-600 ml-auto">{order.confirmedAt ? new Date(order.confirmedAt).toLocaleString("vi-VN") : ""}</span>
              </div>
              <dl className="space-y-2 text-sm">
                {order.confirmedProductCost && (
                  <div className="flex justify-between"><dt className="text-emerald-700">{t("pricing.confirmedProduct")}</dt><dd className="font-medium text-emerald-900">{fmt(order.confirmedProductCost)} VND</dd></div>
                )}
                {order.confirmedShippingCost && (
                  <div className="flex justify-between"><dt className="text-emerald-700">{t("pricing.confirmedShipping")}</dt><dd className="font-medium text-emerald-900">{fmt(order.confirmedShippingCost)} VND</dd></div>
                )}
                {order.confirmedServiceFee && (
                  <div className="flex justify-between"><dt className="text-emerald-700">{t("pricing.confirmedService")}</dt><dd className="font-medium text-emerald-900">{fmt(order.confirmedServiceFee)} VND</dd></div>
                )}
                <div className="flex justify-between items-end pt-2 border-t border-emerald-200">
                  <dt className="font-bold text-emerald-900">{t("pricing.finalCost")}</dt>
                  <dd className="text-xl font-bold text-emerald-700">{fmt(order.confirmedTotalCost)} VND</dd>
                </div>
              </dl>
            </div>
          )}
        </Card>
      </div>

      {/* Shipping address */}
      <Card title="Địa chỉ nhận hàng">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Địa chỉ nhận hàng</label>
            <textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              rows={2}
              placeholder="Nhập hoặc chỉnh sửa địa chỉ nhận hàng..."
            />
          </div>
          {order.user?.address && shippingAddress !== order.user.address && (
            <p className="text-xs text-slate-400">Địa chỉ mặc định của khách: {order.user.address}</p>
          )}
          <button onClick={saveShippingAddress} disabled={shippingAddressSaving}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm">
            {shippingAddressSaving ? "Đang lưu..." : "Lưu địa chỉ"}
          </button>
        </div>
      </Card>

      {/* Confirm pricing form */}
      <Card title={order.confirmedTotalCost ? "Cập nhật giá xác nhận" : "Xác nhận giá đơn hàng"}>
        {orderExchangeRate > 0 && (
          <p className="text-xs text-slate-400 mb-4">Tỷ giá hệ thống: 1 ¥ = {orderExchangeRate.toLocaleString()} VND</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tiền hàng Sản phẩm (¥)</label>
            <input type="number" min="0" step="0.01" value={pricingForm.productValueCNY}
              onChange={(e) => setPricingForm({ ...pricingForm, productValueCNY: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0.00" />
            <p className="text-xs text-slate-400 mt-1">¥{(parseFloat(pricingForm.productValueCNY) || 0).toLocaleString()} = {productValueVND.toLocaleString()} VND</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Phí dịch vụ (VND)</label>
            <input type="number" min="0" step="1000" value={pricingForm.serviceFee}
              onChange={(e) => setPricingForm({ ...pricingForm, serviceFee: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Phí Ship Trung Quốc (VND)</label>
            <input type="number" min="0" step="1000" value={pricingForm.chinaShipping}
              onChange={(e) => setPricingForm({ ...pricingForm, chinaShipping: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Phí Ship Quốc tế (VND)</label>
            <input type="number" min="0" step="1000" value={pricingForm.internationalShipping}
              onChange={(e) => setPricingForm({ ...pricingForm, internationalShipping: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Phí Giao hàng VN (VND)</label>
            <input type="number" min="0" step="1000" value={pricingForm.vietnamDelivery}
              onChange={(e) => setPricingForm({ ...pricingForm, vietnamDelivery: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Chi phí cuối cùng (VND) <span className="text-red-500">*</span></label>
            <input type="text" readOnly value={calculatedTotal.toLocaleString()}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 font-semibold text-emerald-700 cursor-not-allowed" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={confirmPricing} disabled={pricingSaving}
            className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50">
            {pricingSaving ? "Đang lưu..." : (order.confirmedTotalCost ? "Cập nhật giá" : "Xác nhận giá")}
          </button>
          <p className="text-xs text-slate-400">Khách hàng sẽ nhận thông báo khi giá được xác nhận.</p>
        </div>
      </Card>

      {/* Custom status note — separate from system status */}
      <Card title="Ghi chú trạng thái">
        {!customNoteEditing ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              {order.customStatusNote ? (
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-sm font-medium text-amber-700">{order.customStatusNote}</span>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Chưa có ghi chú trạng thái</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setCustomNoteEditing(true)}
              className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
            >
              {order.customStatusNote ? "Sửa" : "Thêm"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Ví dụ: Đang kiểm đếm, Chờ khách xác nhận, Hàng thiếu kiện..."
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveCustomNote}
                disabled={customNoteSaving}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Lưu
              </button>
              {order.customStatusNote && (
                <button
                  type="button"
                  onClick={clearCustomNote}
                  disabled={customNoteSaving}
                  className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  Xoá
                </button>
              )}
              <button
                type="button"
                onClick={() => { setCustomNoteEditing(false); setCustomNote(order.customStatusNote || ""); }}
                className="px-4 py-2 border border-slate-300 text-sm rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Huỷ
              </button>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title={t("orderDetail.trackingCodes")}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("orderDetail.chinaTracking")}</label>
              <div className="flex gap-2">
                <input type="text" placeholder={t("orderDetail.chinaTrackingPlaceholder")} value={tracking.trackingCodeChina}
                  onChange={(e) => setTracking({ ...tracking, trackingCodeChina: e.target.value })}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
                {tracking.trackingCodeChina && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(tracking.trackingCodeChina)}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-300 text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors shrink-0"
                    title="Sao chép mã vận đơn TQ"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("orderDetail.intlTracking")}</label>
              <div className="flex gap-2">
                <input type="text" placeholder={t("orderDetail.intlTrackingPlaceholder")} value={tracking.trackingCodeIntl}
                  onChange={(e) => setTracking({ ...tracking, trackingCodeIntl: e.target.value })}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
                {tracking.trackingCodeIntl && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(tracking.trackingCodeIntl)}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-300 text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors shrink-0"
                    title="Sao chép mã vận đơn quốc tế"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <button onClick={saveTracking} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
              {t("orderDetail.saveTracking")}
            </button>
          </div>
        </Card>

        <Card title={t("orderDetail.packageWeight")}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("orderDetail.weightKg")}</label>
              <div className="flex gap-3">
                <input type="number" step="0.001" placeholder={t("orderDetail.weightPlaceholder")} value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
                <button onClick={saveWeight} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                  {t("orderDetail.update")}
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400">{t("orderDetail.weightRecalcNote")}</p>
          </div>
        </Card>
      </div>

      <Card title="Cập nhật cho khách hàng">
        <div className="space-y-3 mb-4">
          {order.orderNotes.map((note) => (
            <div key={note.id} className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-700">{note.content}</p>
              <p className="text-xs text-slate-400 mt-2">
                {note.user?.fullName || "—"} ({t(`role.${note.user?.role}`, note.user?.role || "")}) — {note.createdAt ? new Date(note.createdAt).toLocaleString("vi-VN") : "—"}
              </p>
            </div>
          ))}
          {order.orderNotes.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-2">Chưa có cập nhật nào cho khách</p>
          )}
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Nhập nội dung cập nhật cho khách..."
            className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          <button onClick={sendNote} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap">
            Gửi cập nhật cho khách
          </button>
        </div>
      </Card>

      <Card title={t("orderDetail.statusTimeline")}>
        <div className="space-y-1">
          {order.statusLogs.map((log, i) => (
            <div key={log.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-3.5 h-3.5 rounded-full border-2 ${i === order.statusLogs.length - 1 ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"}`} />
                {i < order.statusLogs.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
              </div>
              <div className="pb-6">
                <StatusBadge status={log.toStatus} />
                {log.note && <p className="text-sm text-slate-500 mt-1.5">{log.note}</p>}
                <p className="text-xs text-slate-400 mt-1">{log.changer?.fullName || "—"} — {log.createdAt ? new Date(log.createdAt).toLocaleString("vi-VN") : "—"}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
