"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";

const ZALO_URL = "https://zalo.me/4158866809451089514";
const FB_URL = "https://www.facebook.com/profile.php?id=61589268346969";

export default function LandingMobileBar() {
  const { t } = useI18n();
  const pathname = usePathname();

  const base = "flex flex-col items-center py-2 transition-colors";
  const label = "text-[10px] tracking-tight font-medium mt-0.5";
  const inactive = "text-slate-500 hover:bg-slate-50";
  const active = "text-orange-600";

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <div className="grid grid-cols-5 gap-0">
        <Link href="/shop" className={`${base} ${isActive("/shop") ? active : inactive}`}>
          <span className="text-base">🛒</span>
          <span className={label}>Shop</span>
        </Link>
        <a
          href={ZALO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${base} ${inactive}`}
        >
          <span className="text-base">💬</span>
          <span className={label}>Zalo</span>
        </a>
        <a
          href={FB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${base} ${inactive}`}
        >
          <span className="text-base">📱</span>
          <span className={label}>Facebook</span>
        </a>
        <Link href="/register" className={`${base} ${isActive("/register") ? active : inactive}`}>
          <span className="text-base">📝</span>
          <span className={label}>{t("landing.mobileRegister")}</span>
        </Link>
        <Link href="/tracking" className={`${base} ${isActive("/tracking") ? active : inactive}`}>
          <span className="text-base">🔍</span>
          <span className={label}>{t("landing.mobileTrackOrder")}</span>
        </Link>
      </div>
    </div>
  );
}
