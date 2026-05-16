"use client";

import Link from "next/link";

const ZALO_URL = "https://zalo.me/0123456789";
const FB_URL = "https://m.me/bactrunghai";

export default function LandingMobileBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <div className="grid grid-cols-4 gap-0">
        <a
          href={ZALO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center py-2.5 text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <span className="text-lg">💬</span>
          <span className="text-[10px] font-medium mt-0.5">Zalo</span>
        </a>
        <a
          href={FB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center py-2.5 text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <span className="text-lg">📱</span>
          <span className="text-[10px] font-medium mt-0.5">Facebook</span>
        </a>
        <Link
          href="/register"
          className="flex flex-col items-center py-2.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
        >
          <span className="text-lg">📝</span>
          <span className="text-[10px] font-medium mt-0.5">Đăng ký</span>
        </Link>
        <Link
          href="/tracking"
          className="flex flex-col items-center py-2.5 text-amber-600 hover:bg-amber-50 transition-colors"
        >
          <span className="text-lg">🔍</span>
          <span className="text-[10px] font-medium mt-0.5">Theo dõi đơn</span>
        </Link>
      </div>
    </div>
  );
}
