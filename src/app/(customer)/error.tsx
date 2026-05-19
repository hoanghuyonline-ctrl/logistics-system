"use client";

import { useEffect } from "react";

export default function CustomerRouteError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[customer] route error:", error?.message, error?.digest);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">
            Đã xảy ra lỗi
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Trang không tải được. Vui lòng thử lại.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => unstable_retry()}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Thử lại
            </button>
            <a
              href="/dashboard"
              className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Về trang chủ
            </a>
          </div>
          {error?.digest && (
            <p className="mt-4 text-xs text-slate-400">Mã lỗi: {error.digest}</p>
          )}
        </div>
      </div>
    </div>
  );
}
