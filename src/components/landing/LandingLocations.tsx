"use client";

import { useI18n } from "@/lib/i18n";

function LocationPinIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  );
}

export default function LandingLocations() {
  const { t } = useI18n();

  const locations = [
    {
      name: t("landing.headOffice"),
      address: t("landing.headOfficeAddr"),
      phone: "0989 711 888",
    },
    {
      name: t("landing.chinaWarehouse"),
      address: t("landing.chinaWarehouseAddr"),
      phone: "19162296663",
    },
    {
      name: t("landing.bacNinhOffice"),
      address: t("landing.bacNinhOfficeAddr"),
      phone: null,
    },
    {
      name: t("landing.hanoiWarehouse"),
      address: t("landing.hanoiWarehouseAddr"),
      phone: null,
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="animate-fade-up text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
            {t("landing.ourLocations")}
          </h2>
          <p className="mt-3 text-lg text-slate-500 max-w-2xl mx-auto">
            {t("landing.ourLocationsDesc")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {locations.map((loc) => (
            <div key={loc.name} className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-300">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                  <LocationPinIcon />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold mb-1.5" style={{ color: "var(--brand-navy)" }}>{loc.name}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{loc.address}</p>
                  {loc.phone && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                      <PhoneIcon />
                      {loc.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
