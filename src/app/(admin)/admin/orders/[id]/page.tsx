"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

interface OrderDetail {
  id: string;
  orderCode: string;
  productName: string;
  productLink: string;
  quantity: number;
  unitPriceCNY: string;
  totalPriceCNY: string;
  exchangeRate: string;
  totalPriceVND: string;
  serviceFeePercent: string;
  serviceFeeVND: string;
  chinaShippingFee: string;
  weightKg: string | null;
  internationalShippingRate: string;
  internationalShippingFee: string;
  vietnamDeliveryFee: string;
  totalCostVND: string;
  status: string;
  trackingCodeChina: string | null;
  trackingCodeIntl: string | null;
  customStatusNote: string | null;
  createdAt: string;
  user: { fullName: string; email: string; phone: string; address: string };
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

  function copyToClipboard(value: string) {
    navigator.clipboard.writeText(value).then(() => {
      toast("Đã sao chép", "success");
    });
  }

  const loadOrder = useCallback(() => {
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setOrder(d);
        setTracking({ trackingCodeChina: d.trackingCodeChina || "", trackingCodeIntl: d.trackingCodeIntl || "" });
        setWeight(d.weightKg || "");
        setCustomNote(d.customStatusNote || "");
        setLoading(false);
      });
  }, [params.id]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setOrder(d);
        setTracking({ trackingCodeChina: d.trackingCodeChina || "", trackingCodeIntl: d.trackingCodeIntl || "" });
        setWeight(d.weightKg || "");
        setCustomNote(d.customStatusNote || "");
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [params.id]);

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

  if (loading || !order) return <LoadingSpinner text={t("orderDetail.loading")} />;

  const fmt = (v: string) => parseFloat(v).toLocaleString();
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
        subtitle={`${t("orders.customer")}: ${order.user.fullName} · ${new Date(order.createdAt).toLocaleDateString()}`}
        action={<StatusBadge status={order.status} />}
      />

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

      <Card title="Link sản phẩm">
        {order.productLink ? (() => {
          const domainLabels: Record<string, string> = {
            "taobao.com": "Taobao",
            "1688.com": "1688",
            "tmall.com": "Tmall",
            "alibaba.com": "Alibaba",
          };
          let hostname = "";
          try { hostname = new URL(order.productLink).hostname; } catch {}
          const matched = Object.entries(domainLabels).find(([d]) => hostname.includes(d));
          const label = matched ? `Mở link ${matched[1]}` : "Mở sản phẩm";
          return (
            <div>
              <a
                href={order.productLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                🔗 {label} ↗
              </a>
              <p className="text-xs text-slate-400 mt-1 truncate max-w-full" title={order.productLink}>
                {hostname || order.productLink}
              </p>
            </div>
          );
        })() : (
          <p className="text-sm text-slate-400">Chưa có link sản phẩm</p>
        )}
      </Card>

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
            <div className="flex justify-between"><dt className="text-slate-500">{t("orderDetail.name")}</dt><dd className="font-medium text-slate-900">{order.user.fullName}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">{t("orderDetail.email")}</dt><dd className="font-medium text-slate-900">{order.user.email}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">{t("orderDetail.phone")}</dt><dd className="font-medium text-slate-900">{order.user.phone || "—"}</dd></div>
            <div className="flex justify-between items-start"><dt className="text-slate-500">{t("orderDetail.address")}</dt><dd className="font-medium text-slate-900 text-right max-w-[60%]">{order.user.address || "—"}</dd></div>
          </dl>
        </Card>

        <Card title={t("orderDetail.costBreakdown")}>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">{t("orderDetail.product")}</dt><dd className="font-medium text-slate-900">&yen;{fmt(order.totalPriceCNY)} = {fmt(order.totalPriceVND)} VND</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">{t("orderDetail.serviceFee")}</dt><dd className="font-medium text-slate-900">{fmt(order.serviceFeeVND)} VND</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">{t("orderDetail.cnShipping")}</dt><dd className="font-medium text-slate-900">{fmt(order.chinaShippingFee)} VND</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">{t("orderDetail.intlShippingShort")}</dt><dd className="font-medium text-slate-900">{fmt(order.internationalShippingFee)} VND</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">{t("orderDetail.vnDeliveryShort")}</dt><dd className="font-medium text-slate-900">{fmt(order.vietnamDeliveryFee)} VND</dd></div>
            <div className="flex justify-between items-end pt-3 border-t border-slate-100">
              <dt className="font-bold text-slate-900">{t("orderDetail.total")}</dt>
              <dd className="text-xl font-bold text-blue-600">{fmt(order.totalCostVND)} VND</dd>
            </div>
          </dl>
        </Card>
      </div>

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
                {note.user.fullName} ({t(`role.${note.user.role}`, note.user.role)}) — {new Date(note.createdAt).toLocaleString()}
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
                <p className="text-xs text-slate-400 mt-1">{log.changer.fullName} — {new Date(log.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
