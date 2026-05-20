"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import ZaloQRWidget from "@/components/ui/ZaloQRWidget";

const FB_URL = "https://www.facebook.com/profile.php?id=61589268346969";

export default function LandingFloatingCTA() {
  const { t } = useI18n();

  return (
    <div className="fixed right-4 bottom-24 sm:bottom-6 z-40 flex flex-col gap-3 items-end">
      <ZaloQRWidget className="relative" />

      <a
        href={FB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all"
        title={t("landing.floatingMsgFacebook")}
      >
        📱 {t("landing.floatingMsgFacebook")}
      </a>

      <Link
        href="/register"
        className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-full shadow-lg hover:opacity-90 hover:shadow-xl transition-all"
        style={{ backgroundColor: "var(--brand-navy)" }}
      >
        📦 {t("landing.floatingCreateOrder")}
      </Link>
    </div>
  );
}
