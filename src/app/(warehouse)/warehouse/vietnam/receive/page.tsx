"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n";
import { OrderStatus } from "@prisma/client";

interface Order {
  id: string;
  orderCode: string;
  productName: string;
  status: OrderStatus;
  user: { fullName: string };
}

export default function VietnamReceivePage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    fetch("/api/orders?status=SHIPPING_TO_VIETNAM&limit=50")
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders || []); setLoading(false); });
  }, []);

  async function receiveOrder(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/warehouse/vietnam/receive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: selectedOrder, note }),
    });
    if (res.ok) {
      toast(t("warehouse.receiveSuccessVN"), "success");
      setOrders((prev) => prev.filter((o) => o.id !== selectedOrder));
      setSelectedOrder("");
      setNote("");
    } else {
      const data = await res.json();
      toast(data.error || t("warehouse.receiveFailed"), "error");
    }
  }

  if (loading) return <LoadingSpinner text={t("warehouse.loadingOrders")} />;

  return (
    <div className="max-w-3xl">
      <PageHeader title={t("warehouse.receiveTitle")} subtitle={t("warehouse.receiveSubtitleVN")} />

      <Card title={t("warehouse.confirmReceipt")} className="mb-6">
        <form onSubmit={receiveOrder} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("warehouse.selectOrder")}</label>
            <select value={selectedOrder} onChange={(e) => setSelectedOrder(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" required>
              <option value="">{t("warehouse.selectOrderPlaceholder")}</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>{o.orderCode} — {o.productName} — {o.user.fullName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("warehouse.note")}</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              rows={2} placeholder={t("warehouse.notePlaceholder")} />
          </div>
          <button type="submit" disabled={!selectedOrder}
            className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm text-sm">
            {t("warehouse.confirmReceiptBtn")}
          </button>
        </form>
      </Card>

      <Card title={`${t("warehouse.incomingOrders")} (${orders.length})`} noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("warehouse.colOrder")}</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("warehouse.colProduct")}</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("warehouse.colCustomer")}</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("warehouse.colStatus")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((o) => (
                <tr key={o.id}
                  className={`cursor-pointer transition-colors ${selectedOrder === o.id ? "bg-blue-50" : "hover:bg-slate-50/50"}`}
                  onClick={() => setSelectedOrder(o.id)}>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">{o.orderCode}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{o.productName}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{o.user.fullName}</td>
                  <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
