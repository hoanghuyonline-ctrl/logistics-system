"use client";

import { useI18n } from "@/lib/i18n";

function ClipboardIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function WarehouseIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V8l9-5 9 5v13" />
      <path d="M9 21V13h6v8" />
      <path d="M3 8h18" />
    </svg>
  );
}

function PlaneIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7z" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

const stepIcons = [ClipboardIcon, WarehouseIcon, PlaneIcon, HomeIcon];

export default function LandingHowItWorks() {
  const { t } = useI18n();

  const steps = [
    { step: "01", title: t("landing.step01"), desc: t("landing.step01Desc") },
    { step: "02", title: t("landing.step02"), desc: t("landing.step02Desc") },
    { step: "03", title: t("landing.step03"), desc: t("landing.step03Desc") },
    { step: "04", title: t("landing.step04"), desc: t("landing.step04Desc") },
  ];

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="animate-fade-up text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
            {t("landing.howItWorks")}
          </h2>
          <p className="mt-3 text-lg text-slate-500 max-w-2xl mx-auto">
            {t("landing.howItWorksDesc")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => {
            const Icon = stepIcons[i];
            return (
              <div key={s.step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-px bg-slate-200" />
                )}
                <div className="relative bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <span style={{ color: "var(--brand-blue)" }}><Icon /></span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ color: "var(--brand-navy)", backgroundColor: "#eef2ff" }}>
                      STEP {s.step}
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-slate-900 mb-2">{s.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
