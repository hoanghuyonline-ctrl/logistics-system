"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n, SUPPORTED_LOCALES, LOCALE_LABELS } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

export default function Home() {
  const { t, locale, setLocale } = useI18n();

  const features = [
    {
      title: t("landing.easyOrdering"),
      desc: t("landing.easyOrderingDesc"),
      icon: "🛒",
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: t("landing.realTimeTracking"),
      desc: t("landing.realTimeTrackingDesc"),
      icon: "📍",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: t("landing.transparentPricing"),
      desc: t("landing.transparentPricingDesc"),
      icon: "💰",
      color: "bg-amber-50 text-amber-600",
    },
    {
      title: t("landing.secureWallet"),
      desc: t("landing.secureWalletDesc"),
      icon: "🔒",
      color: "bg-violet-50 text-violet-600",
    },
  ];

  const steps = [
    { step: "01", title: t("landing.step01"), desc: t("landing.step01Desc"), icon: "📝" },
    { step: "02", title: t("landing.step02"), desc: t("landing.step02Desc"), icon: "🏭" },
    { step: "03", title: t("landing.step03"), desc: t("landing.step03Desc"), icon: "✈️" },
    { step: "04", title: t("landing.step04"), desc: t("landing.step04Desc"), icon: "🏠" },
  ];

  const stats = [
    { value: "10K+", label: t("landing.ordersDelivered") },
    { value: "99.5%", label: t("landing.deliveryRate") },
    { value: "5-7", label: t("landing.daysAverage") },
    { value: "24/7", label: t("landing.support") },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
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

      {/* Hero */}
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

      {/* Stats bar */}
      <section className="border-y border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-slate-900">{s.value}</p>
                <p className="text-sm text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
              {t("landing.everythingYouNeed")}
            </h2>
            <p className="mt-3 text-lg text-slate-500 max-w-2xl mx-auto">
              {t("landing.platformDesc")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-300 group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
              {t("landing.howItWorks")}
            </h2>
            <p className="mt-3 text-lg text-slate-500 max-w-2xl mx-auto">
              {t("landing.howItWorksDesc")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={s.step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-px bg-slate-200" />
                )}
                <div className="relative bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{s.icon}</span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ color: "var(--brand-navy)", backgroundColor: "#eef2ff" }}>
                      STEP {s.step}
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-slate-900 mb-2">{s.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ background: "linear-gradient(to bottom right, var(--brand-navy), var(--brand-blue))" }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
            {t("landing.readyToStart")}
          </h2>
          <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
            {t("landing.readyToStartDesc")}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center px-8 py-3.5 bg-white font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-lg text-sm" style={{ color: "var(--brand-navy)" }}>
              {t("landing.createFreeAccount")}
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center px-8 py-3.5 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all text-sm">
              {t("common.signIn")} →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-slate-300 py-12" style={{ backgroundColor: "var(--brand-navy)" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Image src="/logo.jpg" alt="Bắc Trung Hải Logistics" width={36} height={36} className="rounded-lg" />
                <span className="text-sm font-semibold text-white">{t("common.appName")}</span>
              </div>
              <p className="text-xs text-slate-400">CÔNG TY TNHH BẮC TRUNG HẢI LOGISTICS</p>
              <p className="text-xs text-slate-400">MST: 4900940606</p>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold text-white mb-1">Liên hệ / Contact</h4>
              <p className="text-xs text-slate-400">📞 0989 711 888</p>
              <p className="text-xs text-slate-400">✉️ bactrunghailogistics@gmail.com</p>
              <p className="text-xs text-slate-400">📍 Số 260, Hùng Vương, Lạng Sơn</p>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold text-white mb-1">Đối tác / Partners</h4>
              <p className="text-xs text-slate-400">ESP · Alibaba · Taobao · 1688 · Tmall</p>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-6 text-center">
            <p className="text-xs text-slate-500">{t("common.copyright")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
