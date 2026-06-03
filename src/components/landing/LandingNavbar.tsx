"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useI18n, SUPPORTED_LOCALES, LOCALE_LABELS } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

export default function LandingNavbar() {
  const { t, locale, setLocale } = useI18n();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isLoggedIn = !!session?.user;
  const userName = session?.user?.name || session?.user?.email || "";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-8 h-16">
        <div className="flex items-center gap-3">
          <Image src="/logo.jpg" alt="Bắc Trung Hải Logistics" width={40} height={40} className="rounded-lg" />
          <span className="text-lg font-bold" style={{ color: "var(--brand-navy)" }}>{t("common.appName")}</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/shop" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            {t("publicShop.navLabel")}
          </Link>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-600 focus:ring-1 focus:ring-blue-500 cursor-pointer hover:border-slate-300 transition-colors"
          >
            {SUPPORTED_LOCALES.map((l) => (
              <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
            ))}
          </select>
          {isLoggedIn ? (
            <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl shadow-sm hover:opacity-90 active:scale-[0.98] transition-all" style={{ backgroundColor: "var(--brand-navy)" }}>
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{userName.charAt(0).toUpperCase()}</span>
              {t("publicShop.myAccount")}
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                {t("common.signIn")}
              </Link>
              <Link href="/register" className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm hover:opacity-90 active:scale-[0.98] transition-all" style={{ backgroundColor: "var(--brand-navy)" }}>
                {t("common.getStarted")}
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-lg px-6 py-4 space-y-3">
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-600 focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {SUPPORTED_LOCALES.map((l) => (
              <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
            ))}
          </select>
          <Link href="/shop" onClick={() => setMobileOpen(false)} className="block w-full text-center px-4 py-2.5 text-sm font-medium text-orange-600 hover:text-orange-700 border border-orange-200 rounded-xl transition-colors">
            {t("publicShop.navLabel")}
          </Link>
          {isLoggedIn ? (
            <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 active:scale-[0.98] transition-all" style={{ backgroundColor: "var(--brand-navy)" }}>
              {t("publicShop.myAccount")}
            </Link>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)} className="block w-full text-center px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl transition-colors">
                {t("common.signIn")}
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 active:scale-[0.98] transition-all" style={{ backgroundColor: "var(--brand-navy)" }}>
                {t("common.getStarted")}
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
