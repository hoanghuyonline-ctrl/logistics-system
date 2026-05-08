"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/lib/i18n";

export default function LandingFooter() {
  const { t } = useI18n();

  return (
    <footer className="text-slate-300 py-12" style={{ backgroundColor: "var(--brand-navy)" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Image src="/logo.jpg" alt="Bắc Trung Hải Logistics" width={36} height={36} className="rounded-lg" />
              <span className="text-sm font-semibold text-white">{t("common.appName")}</span>
            </div>
            <p className="text-xs text-slate-400">{t("landing.footerCompanyFull")}</p>
            <p className="text-xs text-slate-400">{t("landing.footerDirector")}: Phạm Văn Tuấn</p>
            <p className="text-xs text-slate-400">{t("landing.footerTaxCode")}: 4900940606</p>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold text-white mb-1">{t("landing.footerContact")}</h4>
            <p className="text-xs text-slate-400">0989 711 888</p>
            <p className="text-xs text-slate-400">bactrunghailogistics@gmail.com</p>
            <p className="text-xs text-slate-400">{t("landing.headOfficeAddr")}</p>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold text-white mb-1">{t("landing.footerBank")}</h4>
            <p className="text-xs text-slate-400">{t("landing.footerBankName")}</p>
            <p className="text-xs text-slate-400">{t("landing.footerAccountNumber")}: 110003049134</p>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold text-white mb-1">{t("landing.footerPartners")}</h4>
            <p className="text-xs text-slate-400">ESP · Alibaba · Taobao · 1688 · Tmall</p>
            <h4 className="text-sm font-semibold text-white mb-1 mt-3">{t("landing.footerQuickLinks")}</h4>
            <div className="flex flex-col gap-1">
              <Link href="/login" className="text-xs text-slate-400 hover:text-white transition-colors">{t("common.signIn")}</Link>
              <Link href="/register" className="text-xs text-slate-400 hover:text-white transition-colors">{t("common.getStarted")}</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-700 pt-6 text-center">
          <p className="text-xs text-slate-500">{t("common.copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
