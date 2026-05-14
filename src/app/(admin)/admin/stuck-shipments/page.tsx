"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

interface OrderItem {
  id: string;
  orderCode: string;
  productName: string;
  updatedAt: string;
  priority?: string;
  user?: { fullName: string };
}

interface PackageItem {
  id: string;
  packageCode: string;
  status: string;
  createdAt: string;
}

interface Category {
  key: string;
  label: string;
  level: "red" | "yellow" | "green";
  items: (OrderItem | PackageItem)[];
}

interface StuckData {
  thresholds: Record<string, number>;
  categories: Category[];
}

function LevelBadge({ level, count }: { level: string; count: number }) {
  const styles: Record<string, string> = {
    red: "bg-red-100 text-red-700 border-red-200",
    yellow: "bg-amber-100 text-amber-700 border-amber-200",
    green: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${styles[level] || styles.green}`}>
      {level === "red" ? "🔴" : level === "yellow" ? "🟡" : "🟢"} {count}
    </span>
  );
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (24 * 60 * 60 * 1000));
}

function isOrderItem(item: OrderItem | PackageItem): item is OrderItem {
  return "orderCode" in item;
}

export default function StuckShipmentsPage() {
  const [data, setData] = useState<StuckData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    fetch("/api/admin/stuck-shipments")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading && !data) return <LoadingSpinner text="Đang kiểm tra đơn hàng..." />;

  const totalIssues = data?.categories.reduce((sum, c) => sum + c.items.length, 0) || 0;

  return (
    <div>
      <PageHeader
        title="Giám Sát Đơn Chậm / Tắc"
        subtitle={`${totalIssues} vấn đề cần xử lý`}
      />

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {/* Summary cards */}
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {data.categories.map((cat) => (
              <div
                key={cat.key}
                className={`p-4 rounded-xl border ${
                  cat.items.length === 0
                    ? "bg-emerald-50 border-emerald-200"
                    : cat.level === "red"
                    ? "bg-red-50 border-red-200"
                    : "bg-amber-50 border-amber-200"
                }`}
              >
                <div className="text-2xl font-bold mb-1">
                  {cat.items.length}
                </div>
                <div className="text-xs text-slate-600">{cat.label}</div>
              </div>
            ))}
          </div>

          {/* Detail cards */}
          <div className="space-y-5">
            {data.categories
              .filter((cat) => cat.items.length > 0)
              .map((cat) => (
                <Card
                  key={cat.key}
                  title={cat.label}
                  action={<LevelBadge level={cat.level} count={cat.items.length} />}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                          <th className="pb-2 font-medium">Mã</th>
                          <th className="pb-2 font-medium">Chi tiết</th>
                          <th className="pb-2 font-medium">Chờ</th>
                          <th className="pb-2 font-medium">Ưu tiên</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cat.items.map((item) => {
                          const isOrder = isOrderItem(item);
                          const code = isOrder ? item.orderCode : (item as PackageItem).packageCode;
                          const dateField = isOrder ? item.updatedAt : (item as PackageItem).createdAt;
                          const days = daysSince(dateField);
                          const detail = isOrder
                            ? `${item.productName} — ${item.user?.fullName || ""}`
                            : `Trạng thái: ${(item as PackageItem).status}`;
                          const priority = isOrder ? item.priority : undefined;

                          return (
                            <tr key={item.id} className="border-b border-slate-50 last:border-0">
                              <td className="py-2.5">
                                {isOrder ? (
                                  <a
                                    href={`/admin/orders?search=${code}`}
                                    className="text-blue-600 hover:underline font-medium"
                                  >
                                    {code}
                                  </a>
                                ) : (
                                  <span className="font-medium text-slate-700">{code}</span>
                                )}
                              </td>
                              <td className="py-2.5 text-slate-600 max-w-[200px] truncate">
                                {detail}
                              </td>
                              <td className="py-2.5">
                                <span className={`font-semibold ${days >= 5 ? "text-red-600" : days >= 3 ? "text-amber-600" : "text-slate-600"}`}>
                                  {days} ngày
                                </span>
                              </td>
                              <td className="py-2.5">
                                {priority === "URGENT" && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">Khẩn</span>
                                )}
                                {priority === "HIGH" && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">Cao</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ))}

            {data.categories.every((cat) => cat.items.length === 0) && (
              <div className="text-center py-12 text-slate-400">
                <div className="text-4xl mb-3">✅</div>
                <div className="text-lg font-medium">Không có đơn chậm hoặc tắc</div>
                <div className="text-sm mt-1">Tất cả đơn hàng đang vận hành bình thường</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
