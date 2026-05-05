"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { OrderStatus } from "@prisma/client";

interface Order {
  id: string;
  orderCode: string;
  productName: string;
  quantity: number;
  status: OrderStatus;
  totalCostVND: string;
  createdAt: string;
  user: { fullName: string; email: string };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (status) params.set("status", status);
    if (search) params.set("search", search);

    fetch(`/api/orders?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders || []);
        setTotalPages(d.totalPages || 1);
        setLoading(false);
      });
  }, [page, status, search]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Order Management</h1>

      <div className="flex gap-4 mb-4">
        <input type="text" placeholder="Search by order code or product..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-3 py-2 border rounded-lg text-sm w-64" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">All Statuses</option>
          {["PENDING","PURCHASED","SELLER_SHIPPED","ARRIVED_CHINA_WH","PACKING","SHIPPING_TO_VIETNAM","ARRIVED_VIETNAM_WH","OUT_FOR_DELIVERY","COMPLETED","CANCELLED"].map(s => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-lg shadow border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Order</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Product</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Total</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${o.id}`} className="text-blue-600 hover:underline font-medium">{o.orderCode}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <div>{o.user.fullName}</div>
                      <div className="text-xs text-gray-400">{o.user.email}</div>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">{o.productName} x{o.quantity}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3">{parseFloat(o.totalCostVND).toLocaleString()}</td>
                    <td className="px-4 py-3">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
