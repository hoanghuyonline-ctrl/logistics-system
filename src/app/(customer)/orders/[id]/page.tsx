"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Card from "@/components/ui/Card";
import { OrderStatus } from "@prisma/client";

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

  if (loading || !order) return <LoadingSpinner />;

  const fmt = (v: string) => parseFloat(v).toLocaleString();

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order {order.orderCode}</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Product Information">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Product:</dt>
              <dd className="font-medium">{order.productName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Link:</dt>
              <dd><a href={order.productLink} target="_blank" className="text-blue-600 hover:underline">View Product</a></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Quantity:</dt>
              <dd>{order.quantity}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Unit Price:</dt>
              <dd>¥{fmt(order.unitPriceCNY)} CNY</dd>
            </div>
            {order.weightKg && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Weight:</dt>
                <dd>{order.weightKg} kg</dd>
              </div>
            )}
            {order.notes && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Notes:</dt>
                <dd>{order.notes}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card title="Cost Breakdown">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Product Cost (CNY):</dt>
              <dd>¥{fmt(order.totalPriceCNY)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Exchange Rate:</dt>
              <dd>1 CNY = {fmt(order.exchangeRate)} VND</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Product Cost (VND):</dt>
              <dd>{fmt(order.totalPriceVND)} VND</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Service Fee ({order.serviceFeePercent}%):</dt>
              <dd>{fmt(order.serviceFeeVND)} VND</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">China Shipping:</dt>
              <dd>{fmt(order.chinaShippingFee)} VND</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">International Shipping:</dt>
              <dd>{fmt(order.internationalShippingFee)} VND</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Vietnam Delivery:</dt>
              <dd>{fmt(order.vietnamDeliveryFee)} VND</dd>
            </div>
            <div className="flex justify-between font-bold border-t pt-2 mt-2">
              <dt>TOTAL:</dt>
              <dd className="text-lg">{fmt(order.totalCostVND)} VND</dd>
            </div>
          </dl>
        </Card>
      </div>

      {(order.trackingCodeChina || order.trackingCodeIntl) && (
        <Card title="Tracking Information">
          <dl className="space-y-2 text-sm">
            {order.trackingCodeChina && (
              <div className="flex justify-between">
                <dt className="text-gray-500">China Tracking:</dt>
                <dd className="font-mono">{order.trackingCodeChina}</dd>
              </div>
            )}
            {order.trackingCodeIntl && (
              <div className="flex justify-between">
                <dt className="text-gray-500">International Tracking:</dt>
                <dd className="font-mono">{order.trackingCodeIntl}</dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      <Card title="Status Timeline">
        <div className="space-y-4">
          {order.statusLogs.map((log, i) => (
            <div key={log.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${i === order.statusLogs.length - 1 ? "bg-blue-600" : "bg-gray-300"}`} />
                {i < order.statusLogs.length - 1 && <div className="w-0.5 flex-1 bg-gray-200" />}
              </div>
              <div className="pb-4">
                <p className="font-medium text-sm">
                  <StatusBadge status={log.toStatus as OrderStatus} />
                </p>
                {log.note && <p className="text-sm text-gray-500 mt-1">{log.note}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(log.createdAt).toLocaleString()} — {log.changer.fullName}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Notes">
        <div className="space-y-3 mb-4">
          {order.orderNotes.map((note) => (
            <div key={note.id} className="bg-gray-50 p-3 rounded">
              <p className="text-sm">{note.content}</p>
              <p className="text-xs text-gray-400 mt-1">
                {note.user.fullName} ({note.user.role}) — {new Date(note.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
          {order.orderNotes.length === 0 && (
            <p className="text-sm text-gray-500">No notes yet.</p>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          <button onClick={addNote} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            Add
          </button>
        </div>
      </Card>
    </div>
  );
}
