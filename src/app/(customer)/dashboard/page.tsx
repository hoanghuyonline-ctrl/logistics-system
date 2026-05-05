"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import KPICard from "@/components/ui/KPICard";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Order {
  id: string;
  orderCode: string;
  productName: string;
  status: string;
  totalCostVND: string;
  createdAt: string;
}

interface Wallet {
  balance: string;
  debt: string;
}

export default function CustomerDashboard() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [ordersRes, walletRes] = await Promise.all([
        fetch("/api/orders?limit=5"),
        fetch("/api/wallet"),
      ]);
      const ordersData = await ordersRes.json();
      const walletData = await walletRes.json();
      setOrders(ordersData.orders || []);
      setWallet(walletData);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  const balance = wallet ? parseFloat(wallet.balance).toLocaleString() : "0";
  const debt = wallet ? parseFloat(wallet.debt).toLocaleString() : "0";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Welcome, {session?.user?.name}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KPICard title="Wallet Balance" value={`${balance} VND`} color="green" />
        <KPICard title="Outstanding Debt" value={`${debt} VND`} color="red" />
        <KPICard title="Total Orders" value={orders.length} color="blue" />
      </div>

      <div className="bg-white rounded-lg shadow border">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <Link href="/orders/new" className="text-sm text-blue-600 hover:underline">
            + New Order
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Order Code</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Product</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Total</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link href={`/orders/${order.id}`} className="text-blue-600 hover:underline">
                      {order.orderCode}
                    </Link>
                  </td>
                  <td className="px-6 py-4">{order.productName}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status as import("@prisma/client").OrderStatus} />
                  </td>
                  <td className="px-6 py-4">{parseFloat(order.totalCostVND).toLocaleString()} VND</td>
                  <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No orders yet. <Link href="/orders/new" className="text-blue-600 hover:underline">Create your first order</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
