"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n, SUPPORTED_LOCALES, LOCALE_LABELS } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

export default function LandingNavbar() {
  const { t, locale, setLocale } = useI18n();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-8 h-16">
        <div className="flex items-center gap-3">
          <Image src="/logo.jpg" alt="Bắc Trung Hải Logistics" width={40} height={40} className="rounded-lg" />
          <span className="text-lg font-bold" style={{ color: "var(--brand-navy)" }}>{t("common.appName")}</span>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-600 focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {SUPPORTED_LOCALES.map((l) => (
              <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
            ))}
          </select>
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            {t("common.signIn")}
          </Link>
          <Link href="/register" className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors shadow-sm" style={{ backgroundColor: "var(--brand-navy)" }}>
            {t("common.getStarted")}
          </Link>
        </div>
      </div>
    </nav>
  );
}
