"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Card from "@/components/ui/Card";
import { ORDER_STATUS_TRANSITIONS, STATUS_LABELS, OrderStatus } from "@/types";

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
  internationalShippingFee: string;
  vietnamDeliveryFee: string;
  totalCostVND: string;
  status: OrderStatus;
  trackingCodeChina: string | null;
  trackingCodeIntl: string | null;
  notes: string | null;
  createdAt: string;
  user: { fullName: string; email: string; phone: string; address: string };
  statusLogs: Array<{ id: string; fromStatus: string | null; toStatus: string; note: string | null; createdAt: string; changer: { fullName: string } }>;
  orderNotes: Array<{ id: string; content: string; createdAt: string; user: { fullName: string; role: string } }>;
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusNote, setStatusNote] = useState("");
  const [tracking, setTracking] = useState({ trackingCodeChina: "", trackingCodeIntl: "" });
  const [weight, setWeight] = useState("");
  const [msg, setMsg] = useState("");

  async function reload() {
    const res = await fetch(`/api/orders/${params.id}`);
    const d = await res.json();
    setOrder(d);
    setTracking({ trackingCodeChina: d.trackingCodeChina || "", trackingCodeIntl: d.trackingCodeIntl || "" });
    setWeight(d.weightKg || "");
  }

  useEffect(() => { reload().then(() => setLoading(false)); }, [params.id]);

  async function updateStatus(newStatus: string) {
    await fetch(`/api/orders/${params.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, note: statusNote }),
    });
    setStatusNote("");
    setMsg(`Status updated to ${newStatus}`);
    reload();
    setTimeout(() => setMsg(""), 3000);
  }

  async function saveTracking() {
    await fetch(`/api/orders/${params.id}/tracking`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tracking),
    });
    setMsg("Tracking codes updated");
    reload();
    setTimeout(() => setMsg(""), 3000);
  }

  async function saveWeight() {
    await fetch(`/api/orders/${params.id}/weight`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weightKg: weight }),
    });
    setMsg("Weight updated, costs recalculated");
    reload();
    setTimeout(() => setMsg(""), 3000);
  }

  if (loading || !order) return <LoadingSpinner />;

  const nextStatuses = ORDER_STATUS_TRANSITIONS[order.status];
  const fmt = (v: string) => parseFloat(v).toLocaleString();

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order {order.orderCode}</h1>
        <StatusBadge status={order.status} />
      </div>

      {msg && <div className="bg-green-50 text-green-700 p-3 rounded text-sm">{msg}</div>}

      {nextStatuses.length > 0 && (
        <Card title="Update Status">
          <div className="flex flex-wrap gap-2 mb-3">
            {nextStatuses.map((s) => (
              <button key={s} onClick={() => updateStatus(s)}
                className={`px-3 py-1.5 rounded text-sm font-medium border transition ${
                  s === "CANCELLED" ? "border-red-300 text-red-700 hover:bg-red-50" : "border-blue-300 text-blue-700 hover:bg-blue-50"
                }`}>
                → {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <input type="text" placeholder="Status change note (optional)" value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Customer Info">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Name:</dt><dd>{order.user.fullName}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Email:</dt><dd>{order.user.email}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Phone:</dt><dd>{order.user.phone || "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Address:</dt><dd>{order.user.address || "-"}</dd></div>
          </dl>
        </Card>

        <Card title="Cost Breakdown">
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Product:</dt><dd>¥{fmt(order.totalPriceCNY)} = {fmt(order.totalPriceVND)} VND</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Service Fee:</dt><dd>{fmt(order.serviceFeeVND)} VND</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">CN Shipping:</dt><dd>{fmt(order.chinaShippingFee)} VND</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Intl Shipping:</dt><dd>{fmt(order.internationalShippingFee)} VND</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">VN Delivery:</dt><dd>{fmt(order.vietnamDeliveryFee)} VND</dd></div>
            <div className="flex justify-between font-bold border-t pt-1"><dt>TOTAL:</dt><dd>{fmt(order.totalCostVND)} VND</dd></div>
          </dl>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Tracking Codes">
          <div className="space-y-3">
            <input type="text" placeholder="China tracking code" value={tracking.trackingCodeChina}
              onChange={(e) => setTracking({ ...tracking, trackingCodeChina: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
            <input type="text" placeholder="International tracking code" value={tracking.trackingCodeIntl}
              onChange={(e) => setTracking({ ...tracking, trackingCodeIntl: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
            <button onClick={saveTracking} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Save Tracking</button>
          </div>
        </Card>

        <Card title="Weight (kg)">
          <div className="flex gap-2">
            <input type="number" step="0.001" placeholder="Weight in kg" value={weight}
              onChange={(e) => setWeight(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
            <button onClick={saveWeight} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Update</button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Updating weight will recalculate international shipping and total cost.</p>
        </Card>
      </div>

      <Card title="Status Timeline">
        <div className="space-y-3">
          {order.statusLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 text-sm">
              <StatusBadge status={log.toStatus as OrderStatus} />
              <div>
                {log.note && <span className="text-gray-600">{log.note} — </span>}
                <span className="text-gray-400">{log.changer.fullName}, {new Date(log.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
