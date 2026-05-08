"use client";

import { useI18n } from "@/lib/i18n";

export default function LandingServices() {
  const { t } = useI18n();

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

  return (
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
  );
}
