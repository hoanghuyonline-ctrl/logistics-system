"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function LandingCTA() {
  const { t } = useI18n();

  return (
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
  );
}
