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
  const [zaloBound, setZaloBound] = useState<boolean | null>(null);
  const [zaloBannerDismissed, setZaloBannerDismissed] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [ordersRes, walletRes, meRes] = await Promise.all([
          fetch("/api/orders?limit=5"),
          fetch("/api/wallet"),
          fetch("/api/auth/me"),
        ]);
        if (!ordersRes.ok || !walletRes.ok || !meRes.ok) {
          setError(true);
          return;
        }
        const ordersData = await ordersRes.json();
        const walletData = await walletRes.json();
        const meData = await meRes.json();
        setOrders(ordersData.orders || []);
        setWallet(walletData);
        setZaloBound(!!meData?.zaloRecipientId);
      } catch (err) {
        console.error("[dashboard] load failed:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner text={t("common.loading")} />;
  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <span className="text-4xl">⚠️</span>
      <p className="text-sm text-slate-600">Không thể tải dữ liệu. Vui lòng thử lại.</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Tải lại</button>
    </div>
  );

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

      {zaloBound === false && !zaloBannerDismissed && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 relative">
          <button
            onClick={() => setZaloBannerDismissed(true)}
            className="absolute top-3 right-3 text-blue-400 hover:text-blue-600 text-sm leading-none"
            aria-label="Đóng"
          >
            ✕
          </button>
          <div className="flex items-start gap-3 pr-6">
            <span className="text-2xl shrink-0">💬</span>
            <div>
              <p className="text-sm font-semibold text-blue-900">Liên kết Zalo để nhận thông báo đơn hàng tự động</p>
              <p className="text-sm text-blue-700 mt-1">
                Quét mã QR Zalo OA (nút <strong>&quot;Zalo hỗ trợ&quot;</strong> góc trái màn hình), rồi nhắn mã đơn hàng bất kỳ. Hệ thống sẽ tự liên kết tài khoản Zalo của bạn.
              </p>
              <Link
                href="/notifications"
                className="inline-block mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2"
              >
                Xem hướng dẫn chi tiết →
              </Link>
            </div>
          </div>
        </div>
      )}

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
