export const dynamic = "force-dynamic";

import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

interface RiskCustomer {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  debt: number;
  balance: number;
  totalOrders: number;
  unfinishedOrders: number;
  cancelledOrders: number;
  lastActivity: string | null;
  totalRevenue: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskReasons: string[];
  link: string;
}

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  // Run queries in parallel — all lightweight with limits
  const [
    highDebtCustomers,
    negativeBalanceCustomers,
    cancelledOrderCounts,
    inactiveWithOrders,
    topRevenueCustomers,
  ] = await Promise.all([
    // 1. Customers with highest debt (top 20)
    prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        wallet: { debt: { gt: 0 } },
      },
      orderBy: { wallet: { debt: "desc" } },
      take: 20,
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        updatedAt: true,
        wallet: { select: { balance: true, debt: true } },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    }),

    // 2. Customers with negative balance
    prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        wallet: { balance: { lt: 0 } },
      },
      take: 10,
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        updatedAt: true,
        wallet: { select: { balance: true, debt: true } },
      },
    }),

    // 3. Customers with most cancelled orders (top 10)
    prisma.order.groupBy({
      by: ["userId"],
      where: { status: "CANCELLED" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      having: { id: { _count: { gt: 1 } } },
      take: 10,
    }),

    // 4. Inactive customers with unfinished orders (no update in 30+ days)
    prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        updatedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        orders: {
          some: {
            status: { notIn: ["COMPLETED", "CANCELLED"] },
          },
        },
      },
      take: 10,
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        updatedAt: true,
        wallet: { select: { balance: true, debt: true } },
        _count: {
          select: { orders: true },
        },
      },
    }),

    // 5. Top revenue customers (top 10)
    prisma.order.groupBy({
      by: ["userId"],
      where: { status: "COMPLETED" },
      _sum: { totalCostVND: true },
      orderBy: { _sum: { totalCostVND: "desc" } },
      take: 10,
    }),
  ]);

  // Build consolidated customer risk map
  const riskMap = new Map<string, RiskCustomer>();

  const ensureCustomer = (id: string, name: string, email: string, phone: string | null, updatedAt: Date | null): RiskCustomer => {
    if (!riskMap.has(id)) {
      riskMap.set(id, {
        id,
        name,
        phone,
        email,
        debt: 0,
        balance: 0,
        totalOrders: 0,
        unfinishedOrders: 0,
        cancelledOrders: 0,
        lastActivity: updatedAt ? updatedAt.toISOString() : null,
        totalRevenue: 0,
        riskLevel: "LOW",
        riskReasons: [],
        link: `/admin/orders?search=${encodeURIComponent(name)}`,
      });
    }
    return riskMap.get(id)!;
  };

  // Process high-debt customers
  for (const c of highDebtCustomers) {
    const rc = ensureCustomer(c.id, c.fullName, c.email, c.phone, c.updatedAt);
    const debt = Number(c.wallet?.debt ?? 0);
    rc.debt = debt;
    rc.balance = Number(c.wallet?.balance ?? 0);
    rc.totalOrders = c._count.orders;
    if (debt > 0) rc.riskReasons.push(`Công nợ: ${debt.toLocaleString("vi-VN")} VND`);
  }

  // Process negative balances
  for (const c of negativeBalanceCustomers) {
    const rc = ensureCustomer(c.id, c.fullName, c.email, c.phone, c.updatedAt);
    const bal = Number(c.wallet?.balance ?? 0);
    rc.balance = bal;
    rc.debt = Number(c.wallet?.debt ?? 0);
    if (bal < 0) rc.riskReasons.push(`Số dư âm: ${bal.toLocaleString("vi-VN")} VND`);
  }

  // Process cancelled orders — need to fetch user details
  if (cancelledOrderCounts.length > 0) {
    const userIds = cancelledOrderCounts.map((c) => c.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true, email: true, phone: true, updatedAt: true, wallet: { select: { balance: true, debt: true } } },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    for (const c of cancelledOrderCounts) {
      const u = userMap.get(c.userId);
      if (!u) continue;
      const rc = ensureCustomer(u.id, u.fullName, u.email, u.phone, u.updatedAt);
      rc.cancelledOrders = c._count.id;
      rc.balance = Number(u.wallet?.balance ?? 0);
      rc.debt = Number(u.wallet?.debt ?? 0);
      rc.riskReasons.push(`${c._count.id} đơn bị hủy`);
    }
  }

  // Process inactive with orders
  for (const c of inactiveWithOrders) {
    const rc = ensureCustomer(c.id, c.fullName, c.email, c.phone, c.updatedAt);
    rc.balance = Number(c.wallet?.balance ?? 0);
    rc.debt = Number(c.wallet?.debt ?? 0);
    rc.totalOrders = c._count.orders;
    const daysSince = Math.floor((Date.now() - c.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    rc.riskReasons.push(`Không hoạt động ${daysSince} ngày, còn đơn chưa xong`);
  }

  // Process top revenue
  if (topRevenueCustomers.length > 0) {
    const userIds = topRevenueCustomers.map((c) => c.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true, email: true, phone: true, updatedAt: true, wallet: { select: { balance: true, debt: true } } },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    for (const c of topRevenueCustomers) {
      const u = userMap.get(c.userId);
      if (!u) continue;
      const rc = ensureCustomer(u.id, u.fullName, u.email, u.phone, u.updatedAt);
      rc.totalRevenue = Number(c._sum.totalCostVND ?? 0);
      rc.balance = Number(u.wallet?.balance ?? 0);
      rc.debt = Number(u.wallet?.debt ?? 0);
    }
  }

  // Fetch unfinished order counts for all risk customers
  const allRiskIds = Array.from(riskMap.keys());
  if (allRiskIds.length > 0) {
    const unfinishedCounts = await prisma.order.groupBy({
      by: ["userId"],
      where: {
        userId: { in: allRiskIds },
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
      _count: { id: true },
    });
    for (const uc of unfinishedCounts) {
      const rc = riskMap.get(uc.userId);
      if (rc) {
        rc.unfinishedOrders = uc._count.id;
        if (uc._count.id > 3) rc.riskReasons.push(`${uc._count.id} đơn chưa hoàn thành`);
      }
    }
  }

  // Calculate risk levels
  for (const rc of riskMap.values()) {
    let score = 0;
    if (rc.debt > 5000000) score += 3;
    else if (rc.debt > 2000000) score += 2;
    else if (rc.debt > 500000) score += 1;

    if (rc.balance < 0) score += 2;
    if (rc.cancelledOrders > 3) score += 2;
    else if (rc.cancelledOrders > 1) score += 1;

    if (rc.unfinishedOrders > 5) score += 2;
    else if (rc.unfinishedOrders > 3) score += 1;

    // Inactive with unfinished
    if (rc.lastActivity) {
      const daysSince = Math.floor((Date.now() - new Date(rc.lastActivity).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > 30 && rc.unfinishedOrders > 0) score += 2;
    }

    if (score >= 5) rc.riskLevel = "CRITICAL";
    else if (score >= 3) rc.riskLevel = "HIGH";
    else if (score >= 2) rc.riskLevel = "MEDIUM";
    else rc.riskLevel = "LOW";

    // Deduplicate reasons
    rc.riskReasons = [...new Set(rc.riskReasons)];
  }

  // Sort by risk level then debt
  const riskOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const results = Array.from(riskMap.values())
    .filter((r) => r.riskReasons.length > 0)
    .sort((a, b) => {
      const levelDiff = (riskOrder[a.riskLevel] ?? 9) - (riskOrder[b.riskLevel] ?? 9);
      if (levelDiff !== 0) return levelDiff;
      return b.debt - a.debt;
    })
    .slice(0, 20);

  const summary = {
    totalRiskCustomers: results.length,
    criticalCount: results.filter((r) => r.riskLevel === "CRITICAL").length,
    highCount: results.filter((r) => r.riskLevel === "HIGH").length,
    mediumCount: results.filter((r) => r.riskLevel === "MEDIUM").length,
    totalDebt: results.reduce((sum, r) => sum + r.debt, 0),
    totalUnfinished: results.reduce((sum, r) => sum + r.unfinishedOrders, 0),
  };

  return jsonResponse({ customers: results, summary });
});
