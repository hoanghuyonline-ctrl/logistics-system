"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { OrderStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/types";

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
  notes: string | null;
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

export default function OrderDetailPage() {
  const params = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setOrder(d);
        setLoading(false);
      });
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

  if (loading || !order) return <LoadingSpinner text="Loading order details..." />;

  const fmt = (v: string) => parseFloat(v).toLocaleString();

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title={`Order ${order.orderCode}`}
        subtitle={`Created on ${new Date(order.createdAt).toLocaleDateString()}`}
        action={<StatusBadge status={order.status} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Product Information">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between items-start">
              <dt className="text-slate-500">Product</dt>
              <dd className="font-medium text-slate-900 text-right max-w-[60%]">{order.productName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Link</dt>
              <dd><a href={order.productLink} target="_blank" className="text-blue-600 hover:text-blue-700 font-medium">View Product →</a></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Quantity</dt>
              <dd className="font-medium text-slate-900">{order.quantity}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Unit Price</dt>
              <dd className="font-medium text-slate-900">&yen;{fmt(order.unitPriceCNY)} CNY</dd>
            </div>
            {order.weightKg && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Weight</dt>
                <dd className="font-medium text-slate-900">{order.weightKg} kg</dd>
              </div>
            )}
            {order.notes && (
              <div className="flex justify-between items-start">
                <dt className="text-slate-500">Notes</dt>
                <dd className="text-slate-700 text-right max-w-[60%]">{order.notes}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card title="Cost Breakdown">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Product Cost (CNY)</dt>
              <dd className="font-medium text-slate-900">&yen;{fmt(order.totalPriceCNY)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Exchange Rate</dt>
              <dd className="font-medium text-slate-900">1 CNY = {fmt(order.exchangeRate)} VND</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Product Cost (VND)</dt>
              <dd className="font-medium text-slate-900">{fmt(order.totalPriceVND)} VND</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Service Fee ({order.serviceFeePercent}%)</dt>
              <dd className="font-medium text-slate-900">{fmt(order.serviceFeeVND)} VND</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">China Shipping</dt>
              <dd className="font-medium text-slate-900">{fmt(order.chinaShippingFee)} VND</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">International Shipping</dt>
              <dd className="font-medium text-slate-900">{fmt(order.internationalShippingFee)} VND</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Vietnam Delivery</dt>
              <dd className="font-medium text-slate-900">{fmt(order.vietnamDeliveryFee)} VND</dd>
            </div>
            <div className="flex justify-between items-end pt-3 border-t border-slate-100">
              <dt className="font-bold text-slate-900">TOTAL</dt>
              <dd className="text-xl font-bold text-blue-600">{fmt(order.totalCostVND)} VND</dd>
            </div>
          </dl>
        </Card>
      </div>

      {(order.trackingCodeChina || order.trackingCodeIntl) && (
        <Card title="Tracking Information">
          <dl className="space-y-3 text-sm">
            {order.trackingCodeChina && (
              <div className="flex justify-between">
                <dt className="text-slate-500">China Tracking</dt>
                <dd className="font-mono text-sm bg-slate-50 px-3 py-1 rounded-lg text-slate-900">{order.trackingCodeChina}</dd>
              </div>
            )}
            {order.trackingCodeIntl && (
              <div className="flex justify-between">
                <dt className="text-slate-500">International Tracking</dt>
                <dd className="font-mono text-sm bg-slate-50 px-3 py-1 rounded-lg text-slate-900">{order.trackingCodeIntl}</dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      <Card title="Status Timeline">
        <div className="space-y-1">
          {order.statusLogs.map((log, i) => (
            <div key={log.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-3.5 h-3.5 rounded-full border-2 ${i === order.statusLogs.length - 1 ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"}`} />
                {i < order.statusLogs.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
              </div>
              <div className="pb-6">
                <div className="flex items-center gap-2">
                  <StatusBadge status={log.toStatus as OrderStatus} />
                </div>
                {log.note && <p className="text-sm text-slate-500 mt-1.5">{log.note}</p>}
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(log.createdAt).toLocaleString()} — {log.changer.fullName}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Notes">
        <div className="space-y-3 mb-5">
          {order.orderNotes.map((note) => (
            <div key={note.id} className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-700">{note.content}</p>
              <p className="text-xs text-slate-400 mt-2">
                {note.user.fullName} ({note.user.role}) — {new Date(note.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
          {order.orderNotes.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">No notes yet</p>
          )}
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          <button onClick={addNote} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            Add
          </button>
        </div>
      </Card>
    </div>
  );
}
