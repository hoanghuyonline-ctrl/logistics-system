"use client";

import { useI18n } from "@/lib/i18n";

function CartIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

function CurrencyIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

export default function LandingServices() {
  const { t } = useI18n();

  const features = [
    {
      title: t("landing.easyOrdering"),
      desc: t("landing.easyOrderingDesc"),
      icon: <CartIcon />,
      bg: "bg-blue-50",
      fg: "text-blue-600",
    },
    {
      title: t("landing.realTimeTracking"),
      desc: t("landing.realTimeTrackingDesc"),
      icon: <MapPinIcon />,
      bg: "bg-emerald-50",
      fg: "text-emerald-600",
    },
    {
      title: t("landing.transparentPricing"),
      desc: t("landing.transparentPricingDesc"),
      icon: <CurrencyIcon />,
      bg: "bg-amber-50",
      fg: "text-amber-600",
    },
    {
      title: t("landing.secureWallet"),
      desc: t("landing.secureWalletDesc"),
      icon: <ShieldIcon />,
      bg: "bg-violet-50",
      fg: "text-violet-600",
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="animate-fade-up text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
            {t("landing.everythingYouNeed")}
          </h2>
          <p className="mt-3 text-lg text-slate-500 max-w-2xl mx-auto">
            {t("landing.platformDesc")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-slate-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.bg} ${f.fg}`}>
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
