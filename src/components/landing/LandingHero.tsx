"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function LandingHero() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40" />
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border" style={{ backgroundColor: "#eef2ff", color: "var(--brand-navy)", borderColor: "#c7d2fe" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--brand-navy)" }} />
            {t("landing.badge")}
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">
            {t("landing.heroTitle1")}
            <br />
            <span className="bg-gradient-to-r bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(to right, var(--brand-navy), var(--brand-blue))" }}>
              {t("landing.heroTitle2")}
            </span>
          </h1>
          <p className="mt-6 text-lg lg:text-xl text-slate-500 leading-relaxed max-w-2xl">
            {t("landing.heroDesc")}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/register" className="inline-flex items-center justify-center px-6 py-3.5 text-white font-semibold rounded-xl transition-all shadow-lg text-sm" style={{ backgroundColor: "var(--brand-navy)" }}>
              {t("landing.startShipping")}
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center px-6 py-3.5 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-sm">
              {t("landing.signInDashboard")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
