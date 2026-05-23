"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function LandingHero() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40" />

      {/* Decorative blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, var(--brand-sky), transparent 70%)" }} />
      <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-15 blur-3xl" style={{ background: "radial-gradient(circle, var(--brand-blue), transparent 70%)" }} />
      <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle, var(--brand-navy), transparent 70%)" }} />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border" style={{ backgroundColor: "#eef2ff", color: "var(--brand-navy)", borderColor: "#c7d2fe" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--brand-navy)" }} />
            {t("landing.badge")}
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up animation-delay-100 text-4xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">
            {t("landing.heroTitle1")}
            <br />
            <span className="bg-gradient-to-r bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(to right, var(--brand-navy), var(--brand-blue))" }}>
              {t("landing.heroTitle2")}
            </span>
          </h1>

          {/* Description */}
          <p className="animate-fade-up animation-delay-200 mt-6 text-lg lg:text-xl text-slate-500 leading-relaxed max-w-2xl">
            {t("landing.heroDesc")}
          </p>

          {/* CTAs */}
          <div className="animate-fade-up animation-delay-300 mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/register" className="inline-flex items-center justify-center px-7 py-3.5 text-white font-semibold rounded-xl shadow-lg hover:opacity-90 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 text-sm" style={{ backgroundColor: "var(--brand-navy)" }}>
              {t("landing.startShipping")}
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center px-6 py-3.5 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 text-sm">
              {t("landing.signInDashboard")}
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="animate-fade-up animation-delay-400 mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              {t("landing.espPartner")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              10K+ {t("landing.ordersDelivered")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              5-7 {t("landing.daysAverage")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              24/7 {t("landing.support")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
