"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import KPICard from "@/components/ui/KPICard";
import StatusBadge from "@/components/ui/StatusBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Card from "@/components/ui/Card";

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
  const { t } = useI18n();
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

  if (loading) return <LoadingSpinner text={t("common.loading")} />;

  const balance = wallet ? parseFloat(wallet.balance).toLocaleString() : "0";
  const debt = wallet ? parseFloat(wallet.debt).toLocaleString() : "0";

  return (
    <div>
      <PageHeader
        title={`${t("dashboard.welcome")}, ${session?.user?.name || t("common.user")}`}
        subtitle={t("common.tagline")}
        action={
          <Link href="/orders/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            + {t("orders.newOrder")}
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <KPICard title={t("dashboard.walletBalance")} value={`${balance} VND`} icon={<span>💰</span>} color="green" />
        <KPICard title={t("dashboard.pendingOrders")} value={`${debt} VND`} icon={<span>📊</span>} color="red" />
        <KPICard title={t("dashboard.totalOrders")} value={orders.length} icon={<span>📦</span>} color="blue" />
      </div>

      <Card
        title={t("dashboard.recentOrders")}
        action={
          <Link href="/orders" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
            {t("common.viewAll")} →
          </Link>
        }
        noPadding
      >
        {orders.length === 0 ? (
          <EmptyState
            icon="📦"
            title={t("dashboard.noOrders")}
            description={t("dashboard.createFirst")}
            actionLabel={t("nav.newOrder")}
            actionHref="/orders/new"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("orders.orderCode")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("orderDetail.product")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.status")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.total")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.date")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/orders/${order.id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                        {order.orderCode}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{order.productName}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{parseFloat(order.totalCostVND).toLocaleString()} VND</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
