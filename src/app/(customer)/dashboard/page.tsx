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
import MobileDataCard from "@/components/ui/MobileDataCard";

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
  const [ordersError, setOrdersError] = useState(false);
  const [walletError, setWalletError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [ordersRes, walletRes, meRes] = await Promise.allSettled([
          fetch("/api/orders?limit=5"),
          fetch("/api/wallet"),
          fetch("/api/auth/me"),
        ]);

        // Orders — isolated try/catch so JSON parse failure doesn't block wallet
        try {
          if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
            const d = await ordersRes.value.json();
            setOrders(d.orders || []);
          } else {
            const reason = ordersRes.status === "rejected"
              ? ordersRes.reason?.message
              : `status ${ordersRes.status === "fulfilled" ? ordersRes.value.status : "unknown"}`;
            console.warn("[dashboard] orders fetch failed:", reason);
            setOrdersError(true);
          }
        } catch (err) {
          console.warn("[dashboard] orders parse error:", err);
          setOrdersError(true);
        }

        // Wallet — isolated try/catch
        try {
          if (walletRes.status === "fulfilled" && walletRes.value.ok) {
            const d = await walletRes.value.json();
            setWallet(d);
          } else {
            const reason = walletRes.status === "rejected"
              ? walletRes.reason?.message
              : `status ${walletRes.status === "fulfilled" ? walletRes.value.status : "unknown"}`;
            console.warn("[dashboard] wallet fetch failed:", reason);
            setWalletError(true);
          }
        } catch (err) {
          console.warn("[dashboard] wallet parse error:", err);
          setWalletError(true);
        }

        // Zalo binding check — non-critical, silent fail
        try {
          if (meRes.status === "fulfilled" && meRes.value.ok) {
            const d = await meRes.value.json();
            setZaloBound(!!d?.zaloRecipientId);
          }
        } catch {
          // Zalo binding is non-critical — ignore
        }
      } catch (err) {
        console.error("[dashboard] load failed:", err);
        setOrdersError(true);
        setWalletError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner text={t("common.loading")} />;

  const balance = wallet ? (parseFloat(wallet.balance) || 0).toLocaleString() : "0";
  const debt = wallet ? (parseFloat(wallet.debt) || 0).toLocaleString() : "0";

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

      {walletError ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="col-span-full bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-sm text-amber-700">Chưa tải được ví</p>
            <button onClick={() => window.location.reload()} className="mt-2 text-xs text-amber-600 hover:text-amber-800 underline">Thử tải lại</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <KPICard title={t("dashboard.walletBalance")} value={`${balance} VND`} icon={<span>💰</span>} color="green" />
          <KPICard title={t("dashboard.pendingOrders")} value={`${debt} VND`} icon={<span>📊</span>} color="red" />
          <KPICard title={t("dashboard.totalOrders")} value={orders.length} icon={<span>📦</span>} color="blue" />
        </div>
      )}

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

      {ordersError ? (
        <Card title={t("dashboard.recentOrders")} noPadding>
          <div className="py-10 text-center">
            <p className="text-sm text-amber-700">Chưa tải được đơn hàng</p>
            <p className="text-xs text-slate-500 mt-1">Vui lòng thử tải lại từng phần</p>
            <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100">Tải lại</button>
          </div>
        </Card>
      ) : (
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
            <>
            {/* Mobile card view */}
            <div className="md:hidden flex flex-col gap-2 p-2">
              {orders.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <MobileDataCard
                    header={
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-blue-600">{order.orderCode}</span>
                        <StatusBadge status={order.status} />
                      </div>
                    }
                    fields={[
                      { label: t("orderDetail.product"), value: order.productName, fullWidth: true },
                      { label: t("common.total"), value: <span className="font-medium">{(parseFloat(order.totalCostVND) || 0).toLocaleString()} VND</span> },
                      { label: t("common.date"), value: order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "—" },
                    ]}
                  />
                </Link>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
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
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{(parseFloat(order.totalCostVND) || 0).toLocaleString()} VND</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
