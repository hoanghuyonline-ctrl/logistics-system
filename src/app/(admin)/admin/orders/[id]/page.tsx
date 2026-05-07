"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { OrderStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/types";
import { useToast } from "@/components/ui/Toast";

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
  status: OrderStatus;
  trackingCodeChina: string | null;
  trackingCodeIntl: string | null;
  createdAt: string;
  user: { fullName: string; email: string; phone: string; address: string };
  statusLogs: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    createdAt: string;
    changer: { fullName: string; role: string };
  }>;
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState({ trackingCodeChina: "", trackingCodeIntl: "" });
  const [weight, setWeight] = useState("");
  const [statusNote, setStatusNote] = useState("");

  function loadOrder() {
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setOrder(d);
        setTracking({ trackingCodeChina: d.trackingCodeChina || "", trackingCodeIntl: d.trackingCodeIntl || "" });
        setWeight(d.weightKg || "");
        setLoading(false);
      });
  }

  useEffect(() => { loadOrder(); }, [params.id]);

  async function updateStatus(newStatus: string) {
    const res = await fetch(`/api/orders/${params.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, note: statusNote }),
    });
    if (res.ok) {
      toast("Status updated successfully", "success");
      setStatusNote("");
      loadOrder();
    } else {
      const data = await res.json();
      toast(data.error || "Failed to update status", "error");
    }
  }

  async function saveTracking() {
    const res = await fetch(`/api/orders/${params.id}/tracking`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tracking),
    });
    toast(res.ok ? "Tracking codes saved" : "Failed to save tracking", res.ok ? "success" : "error");
  }

  async function saveWeight() {
    const res = await fetch(`/api/orders/${params.id}/weight`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weightKg: parseFloat(weight) }),
    });
    if (res.ok) {
      toast("Weight updated, costs recalculated", "success");
      loadOrder();
    } else {
      toast("Failed to update weight", "error");
    }
  }

  if (loading || !order) return <LoadingSpinner text="Loading order details..." />;

  const fmt = (v: string) => parseFloat(v).toLocaleString();
  const nextStatuses = TRANSITIONS[order.status] || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order ${order.orderCode}`}
        subtitle={`Customer: ${order.user.fullName} · ${new Date(order.createdAt).toLocaleDateString()}`}
        action={<StatusBadge status={order.status} />}
      />

      {/* Status transition */}
      {nextStatuses.length > 0 && (
        <Card title="Update Status">
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" placeholder="Status note (optional)" value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
            <div className="flex gap-2 flex-wrap">
              {nextStatuses.map((s) => (
                <button key={s} onClick={() => updateStatus(s)}
                  className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors shadow-sm ${
                    s === "CANCELLED" ? "bg-red-600 text-white hover:bg-red-700" : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}>
                  → {STATUS_LABELS[s as keyof typeof STATUS_LABELS] || s}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Customer Information">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Name</dt><dd className="font-medium text-slate-900">{order.user.fullName}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd className="font-medium text-slate-900">{order.user.email}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Phone</dt><dd className="font-medium text-slate-900">{order.user.phone || "—"}</dd></div>
            <div className="flex justify-between items-start"><dt className="text-slate-500">Address</dt><dd className="font-medium text-slate-900 text-right max-w-[60%]">{order.user.address || "—"}</dd></div>
          </dl>
        </Card>

        <Card title="Cost Breakdown">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Product</dt><dd className="font-medium text-slate-900">&yen;{fmt(order.totalPriceCNY)} = {fmt(order.totalPriceVND)} VND</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Service Fee</dt><dd className="font-medium text-slate-900">{fmt(order.serviceFeeVND)} VND</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">CN Shipping</dt><dd className="font-medium text-slate-900">{fmt(order.chinaShippingFee)} VND</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Intl Shipping</dt><dd className="font-medium text-slate-900">{fmt(order.internationalShippingFee)} VND</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">VN Delivery</dt><dd className="font-medium text-slate-900">{fmt(order.vietnamDeliveryFee)} VND</dd></div>
            <div className="flex justify-between items-end pt-3 border-t border-slate-100">
              <dt className="font-bold text-slate-900">TOTAL</dt>
              <dd className="text-xl font-bold text-blue-600">{fmt(order.totalCostVND)} VND</dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Tracking Codes">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">China Tracking</label>
              <input type="text" placeholder="China tracking code" value={tracking.trackingCodeChina}
                onChange={(e) => setTracking({ ...tracking, trackingCodeChina: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">International Tracking</label>
              <input type="text" placeholder="International tracking code" value={tracking.trackingCodeIntl}
                onChange={(e) => setTracking({ ...tracking, trackingCodeIntl: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
            </div>
            <button onClick={saveTracking} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
              Save Tracking
            </button>
          </div>
        </Card>

        <Card title="Package Weight">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Weight (kg)</label>
              <div className="flex gap-3">
                <input type="number" step="0.001" placeholder="Weight in kg" value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
                <button onClick={saveWeight} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                  Update
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400">Updating weight will recalculate international shipping and total cost.</p>
          </div>
        </Card>
      </div>

      <Card title="Status Timeline">
        <div className="space-y-1">
          {order.statusLogs.map((log, i) => (
            <div key={log.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-3.5 h-3.5 rounded-full border-2 ${i === order.statusLogs.length - 1 ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"}`} />
                {i < order.statusLogs.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
              </div>
              <div className="pb-6">
                <StatusBadge status={log.toStatus as OrderStatus} />
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
