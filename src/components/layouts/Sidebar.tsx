"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useI18n, SUPPORTED_LOCALES, LOCALE_LABELS } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import NotificationDropdown from "@/components/notifications/NotificationDropdown";

interface NavItem {
  labelKey: string;
  href: string;
  icon: string;
}

const customerNav: NavItem[] = [
  { labelKey: "nav.dashboard", href: "/dashboard", icon: "📊" },
  { labelKey: "nav.newOrder", href: "/orders/new", icon: "➕" },
  { labelKey: "nav.myOrders", href: "/orders", icon: "📦" },
  { labelKey: "nav.wallet", href: "/wallet", icon: "💰" },
  { labelKey: "nav.transactions", href: "/transactions", icon: "📋" },
  { labelKey: "nav.profile", href: "/profile", icon: "👤" },
];

const NOTIFICATION_NAV_ROLES = ["CUSTOMER", "ADMIN"];

const adminNav: NavItem[] = [
  { labelKey: "nav.dashboard", href: "/admin/dashboard", icon: "📊" },
  { labelKey: "nav.users", href: "/admin/users", icon: "👥" },
  { labelKey: "nav.orders", href: "/admin/orders", icon: "📦" },
  { labelKey: "nav.packages", href: "/admin/packages", icon: "📫" },
  { labelKey: "nav.finance", href: "/admin/finance", icon: "💰" },
  { labelKey: "nav.settings", href: "/admin/settings", icon: "⚙️" },
  { labelKey: "nav.analytics", href: "/admin/analytics", icon: "📈" },
  { labelKey: "nav.auditLog", href: "/admin/audit-log", icon: "📝" },
];

const warehouseCNNav: NavItem[] = [
  { labelKey: "nav.dashboard", href: "/warehouse/china/dashboard", icon: "📊" },
  { labelKey: "nav.scan", href: "/warehouse/china/scan", icon: "📱" },
  { labelKey: "nav.receiveGoods", href: "/warehouse/china/receive", icon: "📥" },
  { labelKey: "nav.packages", href: "/warehouse/china/packages", icon: "📦" },
];

const warehouseVNNav: NavItem[] = [
  { labelKey: "nav.dashboard", href: "/warehouse/vietnam/dashboard", icon: "📊" },
  { labelKey: "nav.scan", href: "/warehouse/vietnam/scan", icon: "📱" },
  { labelKey: "nav.receiveGoods", href: "/warehouse/vietnam/receive", icon: "📥" },
  { labelKey: "nav.delivery", href: "/warehouse/vietnam/delivery", icon: "🚚" },
];

const accountantNav: NavItem[] = [
  { labelKey: "nav.dashboard", href: "/accountant/dashboard", icon: "📊" },
  { labelKey: "nav.finance", href: "/admin/finance", icon: "💰" },
  { labelKey: "nav.analytics", href: "/admin/analytics", icon: "📈" },
];

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case "ADMIN": return adminNav;
    case "WAREHOUSE_CN": return warehouseCNNav;
    case "WAREHOUSE_VN": return warehouseVNNav;
    case "ACCOUNTANT": return accountantNav;
    default: return customerNav;
  }
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t, locale, setLocale } = useI18n();
  const role = (session?.user as Record<string, unknown>)?.role as string || "CUSTOMER";
  const navItems = getNavItems(role);

  return (
    <aside className="w-[260px] bg-white border-r border-slate-200 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
            <span className="text-white text-sm font-bold">VN</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">{t("common.appName")}</h1>
            <p className="text-[11px] text-slate-400 font-medium">{t("common.tagline")}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-blue-50 text-blue-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="text-base w-6 text-center flex-shrink-0">{item.icon}</span>
              <span>{t(item.labelKey)}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
            </Link>
          );
        })}
        {NOTIFICATION_NAV_ROLES.includes(role) && <NotificationDropdown />}
      </nav>

      {/* Language switcher */}
      <div className="px-4 py-3 border-t border-slate-100 mx-2">
        <label className="block text-[11px] text-slate-400 font-medium mb-1.5">{t("language.label")}</label>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
        >
          {SUPPORTED_LOCALES.map((l) => (
            <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
          ))}
        </select>
      </div>

      {/* User section */}
      <div className="px-4 py-4 border-t border-slate-100 mx-2 mb-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <span className="text-sm font-semibold text-slate-600">
              {session?.user?.name?.charAt(0) || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{session?.user?.name}</p>
            <p className="text-[11px] text-slate-400 font-medium">{t(`role.${role}`)}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <span className="text-base">🚪</span>
          {t("common.signOut")}
        </button>
      </div>
    </aside>
  );
}
