"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
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
      <PageHeader title="Order Management" subtitle="View and manage all customer orders" />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input type="text" placeholder="Search orders..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PURCHASED">Purchased</option>
          <option value="SELLER_SHIPPED">Seller Shipped</option>
          <option value="ARRIVED_CHINA_WH">Arrived China WH</option>
          <option value="SHIPPING_TO_VIETNAM">Shipping to Vietnam</option>
          <option value="ARRIVED_VIETNAM_WH">Arrived Vietnam WH</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? <LoadingSpinner text="Loading orders..." /> : (
        <Card noPadding>
          {orders.length === 0 ? (
            <EmptyState icon="📦" title="No orders found" description="Try adjusting your search or filters" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <Link href={`/admin/orders/${order.id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                            {order.orderCode}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900">{order.user.fullName}</div>
                          <div className="text-xs text-slate-400">{order.user.email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate">{order.productName}</td>
                        <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{parseFloat(order.totalCostVND).toLocaleString()} VND</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </Card>
      )}
    </div>
  );
}
