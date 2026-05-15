"use client";

import { useState } from "react";
import Image from "next/image";

const ZALO_OA_URL =
  process.env.NEXT_PUBLIC_ZALO_OA_URL || "https://zalo.me";

export default function ZaloQRWidget({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={className ?? "fixed bottom-4 left-4 z-50"}>
      {open && (
        <div className="mb-3 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 w-[min(16rem,calc(100vw-2rem))] animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-800">
              Hỗ trợ Zalo
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>
          <div className="rounded-xl overflow-hidden border border-slate-100">
            <Image
              src="/zalo-qr.jpg"
              alt="Zalo QR Code"
              width={232}
              height={232}
              className="w-full h-auto"
            />
          </div>
          <p className="mt-3 text-xs text-center text-slate-600 leading-relaxed">
            Quét mã QR này để được Zalo hỗ trợ 24/7
          </p>
          <a
            href={ZALO_OA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-1.5 w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
              <path d="M3.505 2.365A41.37 41.37 0 0 1 9 2c1.91 0 3.76.16 5.495.365C16.28 2.56 17.5 4.21 17.5 6.1v4.3c0 1.89-1.22 3.54-3.005 3.736A41.37 41.37 0 0 1 9 14.5a41.37 41.37 0 0 1-5.495-.365C1.72 13.94.5 12.29.5 10.4V6.1c0-1.89 1.22-3.54 3.005-3.735Z" />
              <path fillRule="evenodd" d="M9 17.25a.75.75 0 0 1 .53.22l2.72 2.72V17.25a.75.75 0 0 1 .75-.75h.5c.966 0 1.893-.07 2.772-.197A4.405 4.405 0 0 0 19 14.4V9.6a4.405 4.405 0 0 0-2.728-4.053A42.878 42.878 0 0 0 10 5c-2.14 0-4.225.19-6.272.547A4.405 4.405 0 0 0 1 9.6v4.8a4.405 4.405 0 0 0 3.728 4.053A42.878 42.878 0 0 0 10 19c-.345 0-.687-.005-1.025-.016a.75.75 0 0 1 .025-.734Z" clipRule="evenodd" />
            </svg>
            Hoặc nhấn vào đây nếu dùng điện thoại
          </a>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2.5 shadow-lg transition-colors"
        aria-label="Hỗ trợ Zalo"
      >
        <svg
          viewBox="0 0 48 48"
          fill="currentColor"
          className="w-6 h-6"
        >
          <circle cx="24" cy="24" r="24" fill="white" fillOpacity="0.2" />
          <text
            x="24"
            y="30"
            textAnchor="middle"
            fontSize="18"
            fontWeight="bold"
            fill="white"
          >
            Z
          </text>
        </svg>
        <span className="text-sm font-medium">Zalo hỗ trợ</span>
      </button>
    </div>
  );
}
