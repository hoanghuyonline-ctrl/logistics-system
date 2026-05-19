"use client";

import { useI18n } from "@/lib/i18n";

export default function LandingTrust() {
  const { t } = useI18n();

  const trustItems = [
    {
      icon: "\ud83c\udfed",
      titleKey: "landing.trustChinaWh",
      descKey: "landing.trustChinaWhDesc",
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: "\ud83d\udce1",
      titleKey: "landing.trustRealtime",
      descKey: "landing.trustRealtimeDesc",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: "\ud83c\uddfb\ud83c\uddf3",
      titleKey: "landing.trustVietnamese",
      descKey: "landing.trustVietnameseDesc",
      color: "bg-amber-50 text-amber-600",
    },
    {
      icon: "\ud83d\udd14",
      titleKey: "landing.trustZalo",
      descKey: "landing.trustZaloDesc",
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
            {t("landing.trustTitle")}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {t("landing.trustDesc")}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {trustItems.map((item) => (
            <div
              key={item.titleKey}
              className="rounded-xl border border-slate-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl mb-3 ${item.color}`}>
                {item.icon}
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">{t(item.titleKey)}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{t(item.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
