"use client";

import { useI18n } from "@/lib/i18n";

function WarehouseIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V8l9-5 9 5v13" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V13h6v8" />
    </svg>
  );
}

function SignalIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 010-5.304m5.304 0a3.75 3.75 0 010 5.304m-7.425 2.121a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

export default function LandingTrust() {
  const { t } = useI18n();

  const trustItems = [
    {
      icon: <WarehouseIcon />,
      titleKey: "landing.trustChinaWh",
      descKey: "landing.trustChinaWhDesc",
      bg: "bg-blue-50",
      fg: "text-blue-600",
    },
    {
      icon: <SignalIcon />,
      titleKey: "landing.trustRealtime",
      descKey: "landing.trustRealtimeDesc",
      bg: "bg-emerald-50",
      fg: "text-emerald-600",
    },
    {
      icon: <GlobeIcon />,
      titleKey: "landing.trustVietnamese",
      descKey: "landing.trustVietnameseDesc",
      bg: "bg-amber-50",
      fg: "text-amber-600",
    },
    {
      icon: <BellIcon />,
      titleKey: "landing.trustZalo",
      descKey: "landing.trustZaloDesc",
      bg: "bg-purple-50",
      fg: "text-purple-600",
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
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-3 ${item.bg} ${item.fg}`}>
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
