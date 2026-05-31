"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function LandingHero() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      {/* Background gradients and industrial patterns */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.15),transparent_60%)]" />
      
      {/* Structural accent shapes */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%)" }} />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)" }} />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-28 lg:pt-32 lg:pb-40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-8 space-y-6">
            {/* Badge */}
            <div className="animate-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-orange-500/30 bg-orange-950/20 text-orange-400">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              {t("landing.badge")}
            </div>

            {/* Headline with Slogan */}
            <h1 className="animate-fade-up animation-delay-100 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
              Giải pháp vận tải toàn diện
              <br />
              <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 bg-clip-text text-transparent">
                Kết nối giao thương, nâng tầm logistics
              </span>
            </h1>

            {/* Description */}
            <p className="animate-fade-up animation-delay-200 text-lg text-slate-300 leading-relaxed max-w-2xl">
              {t("landing.heroDesc")}
            </p>

            {/* Actions */}
            <div className="animate-fade-up animation-delay-300 flex flex-wrap gap-4 pt-4">
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-600/20 hover:shadow-orange-600/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 text-sm"
              >
                {t("landing.startShipping")}
              </Link>
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center px-7 py-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-bold rounded-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 text-sm"
              >
                {t("landing.signInDashboard")}
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="animate-fade-up animation-delay-400 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-slate-400 pt-6">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                {t("landing.espPartner")}
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                10K+ {t("landing.ordersDelivered")}
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                5-7 {t("landing.daysAverage")}
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                24/7 {t("landing.support")}
              </span>
            </div>
          </div>

          {/* Decorative Cargo Art on Right */}
          <div className="hidden lg:col-span-4 lg:flex justify-center animate-fade-in animation-delay-300">
            <div className="relative w-72 h-72 rounded-3xl border border-slate-800 bg-slate-900/30 p-8 shadow-2xl flex flex-col justify-between overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
              <div className="flex justify-between items-start">
                <div className="p-3 bg-orange-500/10 text-orange-400 rounded-2xl border border-orange-500/20">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.59 2.5a6 6 0 0 0-5.84 7.38h4.8m5.84 4.49a14.98 14.98 0 0 1-6.16 12.12" />
                  </svg>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-orange-500/60 border border-orange-500/30 px-2.5 py-1 rounded-full">Active</span>
              </div>
              <div className="space-y-2">
                <h4 className="text-slate-400 text-xs font-semibold tracking-wide uppercase">Bắc Trung Hải Logistics</h4>
                <p className="text-white font-extrabold text-lg leading-tight">Vận tải hiệu quả, an toàn tối đa</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
