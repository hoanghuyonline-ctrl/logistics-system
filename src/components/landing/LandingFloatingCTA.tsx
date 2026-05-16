"use client";

import Link from "next/link";

const ZALO_URL = "https://zalo.me/0123456789"; // TODO: replace with actual Zalo OA link
const FB_URL = "https://m.me/bactrunghai"; // TODO: replace with actual FB page

export default function LandingFloatingCTA() {
  return (
    <div className="fixed right-4 bottom-24 sm:bottom-6 z-40 flex flex-col gap-3">
      {/* Chat Zalo */}
      <a
        href={ZALO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-full shadow-lg hover:bg-blue-600 hover:shadow-xl transition-all"
        title="Chat Zalo ngay"
      >
        💬 Chat Zalo
      </a>

      {/* Nhắn Facebook */}
      <a
        href={FB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all"
        title="Nhắn Facebook"
      >
        📱 Nhắn Facebook
      </a>

      {/* Tạo đơn hàng */}
      <Link
        href="/register"
        className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-full shadow-lg hover:opacity-90 hover:shadow-xl transition-all"
        style={{ backgroundColor: "var(--brand-navy)" }}
      >
        📦 Tạo đơn hàng
      </Link>
    </div>
  );
}
