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

const ISSUE_TYPES: Record<string, string> = {
  THIEU_HANG: "Thiếu hàng",
  GIAO_CHAM: "Giao chậm",
  SAI_CAN: "Sai cân nặng",
  HONG_HANG: "Hỏng hàng",
  CHUA_NHAN: "Chưa nhận được hàng",
  PHI_SAI: "Phí sai",
  CHATBOT: "Chatbot/Hỗ trợ",
  KHAC: "Khác",
};

export default function OrderDetailPage() {
  const { t } = useI18n();
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
        title={`${t("orders.order")} ${order.orderCode}`}
        subtitle={`${t("orders.createdOn")} ${new Date(order.createdAt).toLocaleDateString()}`}
        action={<StatusBadge status={order.status} />}
      />

      {order.customStatusNote && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <span className="text-sm font-medium text-amber-700">Ghi chú trạng thái: {order.customStatusNote}</span>
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
                  <p className="text-sm font-medium text-slate-800">{info.description}</p>
                  <p className="text-sm text-blue-600 mt-1">{info.nextStep}</p>
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
                  <p className="text-sm font-semibold text-amber-900">Đơn hàng đang xử lý chậm hơn dự kiến</p>
                  <p className="text-sm text-amber-700 mt-1">{delayMsg}</p>
                  <p className="text-xs text-amber-600 mt-2">Đơn hàng đang chậm hơn dự kiến. Vui lòng theo dõi thêm hoặc liên hệ hỗ trợ nếu cần.</p>
                </div>
              </div>
            )}
            {isSellerShipped && !delayMsg && (
              <div className="flex items-start gap-3 p-3 bg-sky-50 border border-sky-200 rounded-xl">
                <span className="text-lg shrink-0">📦</span>
                <div>
                  <p className="text-sm font-semibold text-sky-900">Người bán đang gửi hàng</p>
                  <p className="text-sm text-sky-700 mt-0.5">Người bán đang chuẩn bị giao hàng tới kho Trung Quốc.</p>
                </div>
              </div>
            )}
            {isShippingIntl && !delayMsg && (
              <div className="flex items-start gap-3 p-3 bg-sky-50 border border-sky-200 rounded-xl">
                <span className="text-lg shrink-0">🚛</span>
                <div>
                  <p className="text-sm font-semibold text-sky-900">Đang vận chuyển quốc tế</p>
                  <p className="text-sm text-sky-700 mt-0.5">Đơn hàng đang vận chuyển quốc tế, thời gian có thể thay đổi.</p>
                </div>
              </div>
            )}
            {isAtVietnamWh && !delayMsg && (
              <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-lg shrink-0">🏠</span>
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Kho Việt Nam đang xử lý</p>
                  <p className="text-sm text-emerald-700 mt-0.5">Kho Việt Nam đang xử lý và chuẩn bị giao.</p>
                </div>
              </div>
            )}
            {isOutForDelivery && !delayMsg && (
              <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-lg shrink-0">🚚</span>
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Đang chuẩn bị giao hàng</p>
                  <p className="text-sm text-emerald-700 mt-0.5">Hàng đang được giao đến địa chỉ của bạn. Vui lòng giữ điện thoại.</p>
                </div>
              </div>
            )}
            {isCompleted && (
              <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-lg shrink-0">✅</span>
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Đơn hàng đã giao thành công</p>
                  <p className="text-sm text-emerald-700 mt-0.5">Cảm ơn bạn đã sử dụng dịch vụ Bắc Trung Hải Logistics.</p>
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
            <p className="text-sm font-semibold text-blue-900">Nhận thông báo Zalo tự động</p>
            <p className="text-sm text-blue-700 mt-1">
              Liên kết Zalo để nhận cập nhật trạng thái đơn hàng ngay khi kho xử lý.
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
                {orderCodeCopied ? "Đã sao chép!" : "Sao chép mã đơn"}
              </button>
            </div>
            <Link
              href="/notifications"
              className="inline-block mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2"
            >
              Cài đặt kênh thông báo →
            </Link>
          </div>
        </div>
      )}

      {zaloBound === true && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <span className="text-sm shrink-0">✅</span>
          <div>
            <p className="text-sm font-medium text-emerald-800">Zalo đã liên kết</p>
            <p className="text-xs text-emerald-700 mt-0.5">Bạn sẽ tự động nhận cập nhật trạng thái đơn hàng qua Zalo.</p>
          </div>
        </div>
      )}

      {/* Liên hệ hỗ trợ */}
      {order.status !== "CANCELLED" && order.status !== "COMPLETED" && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">💬</span>
            <p className="text-sm font-semibold text-slate-800">Liên hệ hỗ trợ</p>
          </div>
          <div className="space-y-1.5 text-sm text-slate-600">
            {zaloBound ? (
              <p>Bạn có thể nhắn tin trực tiếp qua <span className="font-medium text-blue-700">Zalo OA Bắc Trung Hải Logistics</span> để được hỗ trợ nhanh nhất. Gửi mã đơn hàng để tra cứu trạng thái.</p>
            ) : (
              <p>
                Liên kết Zalo để nhắn tin hỗ trợ trực tiếp và nhận thông báo tự động.{" "}
                <Link href="/notifications" className="font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2">
                  Cài đặt kênh thông báo →
                </Link>
              </p>
            )}
            <p className="text-xs text-slate-500">Hoặc gửi khiếu nại bên dưới nếu cần hỗ trợ chi tiết hơn.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title={t("orderDetail.productInfo")}>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between items-start">
              <dt className="text-slate-500">{t("orderDetail.product")}</dt>
              <dd className="font-medium text-slate-900 text-right max-w-[60%]">{order.productName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">{t("orderDetail.link")}</dt>
              <dd><a href={order.productLink} target="_blank" className="text-blue-600 hover:text-blue-700 font-medium">{t("orderDetail.viewProduct")}</a></dd>
            </div>
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
                <p className="text-xs text-slate-500 mt-1">{getStatusInfo(log.toStatus).description}</p>
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
            Khiếu nại đã được gửi thành công. Chúng tôi sẽ xử lý sớm nhất.
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
            Gửi khiếu nại / yêu cầu hỗ trợ
          </button>
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">Gửi khiếu nại cho đơn {order.orderCode}</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Loại vấn đề</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(ISSUE_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả chi tiết</label>
              <textarea
                value={issueDesc}
                onChange={(e) => setIssueDesc(e.target.value)}
                placeholder="Vui lòng mô tả vấn đề của bạn..."
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
                {issueSubmitting ? "Đang gửi..." : "Gửi khiếu nại"}
              </button>
              <button
                onClick={() => { setShowIssueForm(false); setIssueDesc(""); }}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
