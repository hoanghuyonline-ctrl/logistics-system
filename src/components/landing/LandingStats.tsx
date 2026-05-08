"use client";

import { useI18n } from "@/lib/i18n";

export default function LandingStats() {
  const { t } = useI18n();

  const stats = [
    { value: "10K+", label: t("landing.ordersDelivered") },
    { value: "99.5%", label: t("landing.deliveryRate") },
    { value: "5-7", label: t("landing.daysAverage") },
    { value: "24/7", label: t("landing.support") },
  ];

  return (
    <section className="border-y border-slate-100 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="animate-fade-up grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={s.label} className={`text-center ${i < stats.length - 1 ? "lg:border-r lg:border-slate-200" : ""}`}>
              <p className="text-3xl font-bold" style={{ color: "var(--brand-navy)" }}>{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
