"use client";

import { useI18n } from "@/lib/i18n";

export default function LandingHowItWorks() {
  const { t } = useI18n();

  const steps = [
    { step: "01", title: t("landing.step01"), desc: t("landing.step01Desc"), icon: "📝" },
    { step: "02", title: t("landing.step02"), desc: t("landing.step02Desc"), icon: "🏭" },
    { step: "03", title: t("landing.step03"), desc: t("landing.step03Desc"), icon: "✈️" },
    { step: "04", title: t("landing.step04"), desc: t("landing.step04Desc"), icon: "🏠" },
  ];

  return (
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
  );
}
