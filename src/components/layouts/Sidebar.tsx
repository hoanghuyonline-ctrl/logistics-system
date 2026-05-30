"use client";

import { useState, useEffect } from "react";
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

interface NavGroup {
  label: string;
  items: NavItem[];
}

const customerNav: NavItem[] = [
  { labelKey: "nav.dashboard", href: "/dashboard", icon: "📊" },
  { labelKey: "nav.sourceSearch", href: "/source-search", icon: "🔍" },
  { labelKey: "nav.shop", href: "/shop", icon: "🛒" },
  { labelKey: "nav.shopRequests", href: "/shop/requests", icon: "🧾" },
  { labelKey: "nav.newOrder", href: "/orders/new", icon: "➕" },
  { labelKey: "nav.myOrders", href: "/orders", icon: "📦" },
  { labelKey: "nav.wallet", href: "/wallet", icon: "💰" },
  { labelKey: "nav.transactions", href: "/transactions", icon: "📋" },
  { labelKey: "nav.customs", href: "/customs", icon: "🛃" },
  { labelKey: "nav.knowledge", href: "/knowledge", icon: "📚" },
  { labelKey: "nav.transport", href: "/transport", icon: "🚚" },
  { labelKey: "nav.quotation", href: "/quotation", icon: "💰" },
  { labelKey: "nav.issues", href: "/issues", icon: "📝" },
  { labelKey: "nav.channelLinking", href: "/notifications", icon: "🔔" },
  { labelKey: "nav.profile", href: "/profile", icon: "👤" },
  { labelKey: "nav.security", href: "/profile", icon: "🔐" },
];

const NOTIFICATION_NAV_ROLES = ["CUSTOMER", "ADMIN", "STAFF"];

const STAFF_ALLOWED_GROUPS = new Set([
  "TỔNG QUAN",
  "QUẢN LÝ ĐƠN HÀNG",
  "HỖ TRỢ KHÁCH HÀNG",
]);

function getStaffNavGroups(): NavGroup[] {
  return adminNavGroups
    .filter((g) => STAFF_ALLOWED_GROUPS.has(g.label))
    .filter((g) => g.items.length > 0);
}

const adminNavGroups: NavGroup[] = [
  {
    label: "TỔNG QUAN",
    items: [
      { labelKey: "nav.operations", href: "/admin/operations", icon: "🏠" },
      { labelKey: "nav.dashboard", href: "/admin/dashboard", icon: "📊" },
      { labelKey: "nav.users", href: "/admin/users", icon: "👥" },
    ],
  },
  {
    label: "QUẢN LÝ ĐƠN HÀNG",
    items: [
      { labelKey: "nav.orders", href: "/admin/orders", icon: "📦" },
      { labelKey: "nav.packages", href: "/admin/packages", icon: "📫" },
      { labelKey: "nav.stuckShipments", href: "/admin/stuck-shipments", icon: "⚠️" },
      { labelKey: "nav.adminSales", href: "/admin/sales", icon: "🛒" },
      { labelKey: "nav.customs", href: "/admin/customs", icon: "🛃" },
      { labelKey: "nav.transport", href: "/admin/transport", icon: "🚚" },
    ],
  },
  {
    label: "TÀI CHÍNH & PHÂN TÍCH",
    items: [
      { labelKey: "nav.finance", href: "/admin/finance", icon: "💰" },
      { labelKey: "nav.analytics", href: "/admin/analytics", icon: "📈" },
      { labelKey: "nav.analyticsSummary", href: "/admin/analytics-summary", icon: "📈" },
    ],
  },
  {
    label: "HỖ TRỢ KHÁCH HÀNG",
    items: [
      { labelKey: "nav.supportKnowledge", href: "/admin/support-knowledge", icon: "📚" },
      { labelKey: "nav.customerIssues", href: "/admin/customer-issues", icon: "📋" },
      { labelKey: "nav.customerAlerts", href: "/admin/customer-alerts", icon: "⚠️" },
      { labelKey: "nav.leads", href: "/admin/leads", icon: "📥" },
      { labelKey: "nav.crm", href: "/admin/crm", icon: "🎯" },
      { labelKey: "nav.campaigns", href: "/admin/campaigns", icon: "📣" },
      { labelKey: "nav.staffNotes", href: "/admin/staff-notes", icon: "🔖" },
    ],
  },
  {
    label: "NỘI DUNG & MARKETING",
    items: [
      { labelKey: "nav.knowledgeBase", href: "/admin/knowledge", icon: "📚" },
      { labelKey: "nav.quotationManagement", href: "/admin/quotation", icon: "💰" },
    ],
  },
  {
    label: "CÀI ĐẶT HỆ THỐNG",
    items: [
      { labelKey: "nav.chinaWarehouses", href: "/admin/china-warehouses", icon: "🏭" },
      { labelKey: "nav.settings", href: "/admin/settings", icon: "⚙️" },
      { labelKey: "nav.systemHealth", href: "/admin/system-health", icon: "🩺" },
      { labelKey: "nav.auditLog", href: "/admin/audit-log", icon: "📝" },
      { labelKey: "nav.notificationFailures", href: "/admin/notification-failures", icon: "🔔" },
      { labelKey: "nav.security", href: "/profile", icon: "🔐" },
    ],
  },
];

const adminNav: NavItem[] = adminNavGroups.flatMap((g) => g.items);

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
    case "STAFF": return getStaffNavGroups().flatMap((g) => g.items);
    case "WAREHOUSE_CN": return warehouseCNNav;
    case "WAREHOUSE_VN": return warehouseVNNav;
    case "ACCOUNTANT": return accountantNav;
    default: return customerNav;
  }
}

function NavLink({ item, pathname, onNavigate, t }: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
  t: (key: string) => string;
}) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
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
}

function CollapsibleGroup({ group, pathname, onNavigate, t }: {
  group: NavGroup;
  pathname: string;
  onNavigate?: () => void;
  t: (key: string) => string;
}) {
  const hasActive = group.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );
  const [open, setOpen] = useState(hasActive);

  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center w-full px-3 py-2 text-[11px] font-semibold tracking-wide text-slate-400 hover:text-slate-600 transition-colors"
      >
        <span className="flex-1 text-left">{group.label}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="space-y-0.5 mt-0.5">
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t, locale, setLocale } = useI18n();
  const role = (session?.user as Record<string, unknown>)?.role as string || "CUSTOMER";
  const navItems = getNavItems(role);
  const isAdmin = role === "ADMIN" || role === "STAFF";
  const navGroups = role === "STAFF" ? getStaffNavGroups() : adminNavGroups;

  return (
    <>
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
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {isAdmin ? (
          <div className="space-y-2">
            {navGroups.map((group) => (
              <CollapsibleGroup
                key={group.label}
                group={group}
                pathname={pathname}
                onNavigate={onNavigate}
                t={t}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} t={t} />
            ))}
          </div>
        )}
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
    </>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useI18n();

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile top header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Mở menu"
          >
            <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">VN</span>
            </div>
            <span className="text-sm font-bold text-slate-900">{t("common.appName")}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400 font-medium">
            {session?.user?.name?.split(" ").pop() || ""}
          </span>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute top-0 left-0 bottom-0 w-[280px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            {/* Close button */}
            <div className="absolute top-4 right-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Đóng menu"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[260px] bg-white border-r border-slate-200 min-h-screen flex-col flex-shrink-0">
        <SidebarContent />
      </aside>
    </>
  );
}
