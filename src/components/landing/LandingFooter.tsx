"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/lib/i18n";

export default function LandingFooter() {
  const { t } = useI18n();

  return (
    <footer className="bg-slate-50 border-t border-slate-200/80 pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Column 1 — Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Image src="/logo.jpg" alt="Bắc Trung Hải Logistics" width={36} height={36} className="rounded-lg" />
              <span className="text-sm font-semibold text-slate-900">{t("common.appName")}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{t("landing.footerCompanyFull")}</p>
            <p className="text-xs text-slate-500">{t("landing.footerDirector")}: Phạm Văn Tuấn</p>
            <p className="text-xs text-slate-500">{t("landing.footerTaxCode")}: 4900940606</p>
          </div>

          {/* Column 2 — Quick Links */}
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold text-slate-900 mb-1">{t("landing.footerQuickLinks")}</h4>
            <Link href="/" className="text-xs text-slate-600 hover:text-orange-600 transition-colors">Trang chủ</Link>
            <Link href="/shop" className="text-xs text-slate-600 hover:text-orange-600 transition-colors">Shop</Link>
            <Link href="/tracking" className="text-xs text-slate-600 hover:text-orange-600 transition-colors">Tra cứu đơn hàng</Link>
            <Link href="/login" className="text-xs text-slate-600 hover:text-orange-600 transition-colors">{t("common.signIn")}</Link>
            <Link href="/register" className="text-xs text-slate-600 hover:text-orange-600 transition-colors">{t("common.getStarted")}</Link>
          </div>

          {/* Column 3 — Contact */}
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold text-slate-900 mb-1">{t("landing.footerContact")}</h4>
            <p className="text-xs text-slate-600">0989 711 888</p>
            <p className="text-xs text-slate-600">bactrunghailogistics@gmail.com</p>
            <p className="text-xs text-slate-600 leading-relaxed">{t("landing.headOfficeAddr")}</p>
            <div className="mt-2">
              <h4 className="text-sm font-semibold text-slate-900 mb-1">{t("landing.footerBank")}</h4>
              <p className="text-xs text-slate-600">{t("landing.footerBankName")}</p>
              <p className="text-xs text-slate-600">{t("landing.footerAccountNumber")}: 110003049134</p>
            </div>
          </div>

          {/* Column 4 — Partners & Notes */}
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold text-slate-900 mb-1">{t("landing.footerPartners")}</h4>
            <p className="text-xs text-slate-600">ESP · Alibaba · Taobao · 1688 · Tmall</p>
            <div className="mt-3 p-3 rounded-lg bg-white border border-slate-200">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Hệ thống quản lý nội bộ dành cho nhân viên và khách hàng của Bắc Trung Hải Logistics. Vui lòng đăng nhập để truy cập bảng điều khiển.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6 text-center">
          <p className="text-xs text-slate-400">{t("common.copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
