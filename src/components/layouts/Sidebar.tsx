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

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as Record<string, unknown>)?.role as string || "CUSTOMER";
  const navItems = getNavItems(role);

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">VN Logistics</h1>
        <p className="text-xs text-gray-400 mt-1">China → Vietnam Shipping</p>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="text-sm text-gray-300 mb-2">
          <p className="font-medium">{session?.user?.name}</p>
          <p className="text-xs text-gray-500">{role}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-left text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
