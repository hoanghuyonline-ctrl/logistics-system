"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const customerNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "New Order", href: "/orders/new", icon: "➕" },
  { label: "My Orders", href: "/orders", icon: "📦" },
  { label: "Wallet", href: "/wallet", icon: "💰" },
  { label: "Transactions", href: "/transactions", icon: "📋" },
  { label: "Notifications", href: "/notifications", icon: "🔔" },
  { label: "Profile", href: "/profile", icon: "👤" },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "📊" },
  { label: "Users", href: "/admin/users", icon: "👥" },
  { label: "Orders", href: "/admin/orders", icon: "📦" },
  { label: "Packages", href: "/admin/packages", icon: "📫" },
  { label: "Finance", href: "/admin/finance", icon: "💰" },
  { label: "Settings", href: "/admin/settings", icon: "⚙️" },
  { label: "Analytics", href: "/admin/analytics", icon: "📈" },
];

const warehouseCNNav: NavItem[] = [
  { label: "Dashboard", href: "/warehouse/china/dashboard", icon: "📊" },
  { label: "Receive Goods", href: "/warehouse/china/receive", icon: "📥" },
  { label: "Packages", href: "/warehouse/china/packages", icon: "📦" },
];

const warehouseVNNav: NavItem[] = [
  { label: "Dashboard", href: "/warehouse/vietnam/dashboard", icon: "📊" },
  { label: "Receive Goods", href: "/warehouse/vietnam/receive", icon: "📥" },
  { label: "Delivery", href: "/warehouse/vietnam/delivery", icon: "🚚" },
];

const accountantNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "📊" },
  { label: "Finance", href: "/admin/finance", icon: "💰" },
  { label: "Analytics", href: "/admin/analytics", icon: "📈" },
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

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: "Administrator",
    CUSTOMER: "Customer",
    WAREHOUSE_CN: "China Warehouse",
    WAREHOUSE_VN: "Vietnam Warehouse",
    ACCOUNTANT: "Accountant",
  };
  return labels[role] || role;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
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
            <h1 className="text-base font-bold text-slate-900 leading-tight">VN Logistics</h1>
            <p className="text-[11px] text-slate-400 font-medium">China → Vietnam Shipping</p>
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
              <span>{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
            </Link>
          );
        })}
      </nav>

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
            <p className="text-[11px] text-slate-400 font-medium">{getRoleLabel(role)}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <span className="text-base">🚪</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
