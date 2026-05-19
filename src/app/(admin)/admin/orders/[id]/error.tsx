"use client";

import { useEffect } from "react";

export default function AdminOrderDetailError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[admin/orders/detail] render error:", error?.message, error?.digest);
  }, [error]);

  return (
    <div className="max-w-lg mx-auto mt-12 text-center">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
        <span className="text-4xl mb-4 block">⚠️</span>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">
          Trang chi tiết đơn hàng gặp lỗi
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Không thể hiển thị đơn hàng. Vui lòng thử lại.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => unstable_retry()}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
          <a
            href="/admin/orders"
            className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Quay lại danh sách
          </a>
        </div>
        {error?.digest && (
          <p className="mt-4 text-xs text-slate-400">Mã lỗi: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
