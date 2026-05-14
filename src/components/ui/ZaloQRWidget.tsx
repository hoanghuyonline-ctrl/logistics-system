"use client";

import { useState } from "react";
import Image from "next/image";

export default function ZaloQRWidget({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={className ?? "fixed bottom-4 left-4 z-50"}>
      {open && (
        <div className="mb-3 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 w-64 animate-in fade-in slide-in-from-bottom-2">
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
