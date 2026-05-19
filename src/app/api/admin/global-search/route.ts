export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { NextRequest } from "next/server";

const LIMIT = 5;

export const GET = withErrorHandler(async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 2) {
    return jsonResponse({ orders: [], packages: [], customers: [], leads: [], issues: [], query: q });
  }

  const [orders, packages, customers, leads, issues] = await Promise.all([
    // 1. Orders — by orderCode, trackingCodeChina, trackingCodeIntl
    prisma.order.findMany({
      where: {
        OR: [
          { orderCode: { contains: q, mode: "insensitive" } },
          { trackingCodeChina: { contains: q, mode: "insensitive" } },
          { trackingCodeIntl: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        orderCode: true,
        productName: true,
        status: true,
        user: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: LIMIT,
    }),

    // 2. Packages — by packageCode, barcode
    prisma.package.findMany({
      where: {
        OR: [
          { packageCode: { contains: q, mode: "insensitive" } },
          { barcode: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        packageCode: true,
        barcode: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
      take: LIMIT,
    }),

    // 3. Customers — by name, phone, email
    prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
      },
      orderBy: { createdAt: "desc" },
      take: LIMIT,
    }),

    // 4. Leads — by name, phone
    prisma.lead.findMany({
      where: {
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        source: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
      take: LIMIT,
    }),

    // 5. Customer issues — by description, orderCode
    prisma.customerIssue.findMany({
      where: {
        OR: [
          { description: { contains: q, mode: "insensitive" } },
          { orderCode: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        issueType: true,
        orderCode: true,
        status: true,
        description: true,
        customer: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: LIMIT,
    }),
  ]);

  return jsonResponse({
    orders: orders.map((o) => ({
      id: o.id,
      code: o.orderCode,
      label: `${o.orderCode} — ${o.productName}`,
      sub: o.user.fullName,
      status: o.status,
      href: `/admin/orders/${o.id}`,
    })),
    packages: packages.map((p) => ({
      id: p.id,
      code: p.packageCode,
      label: p.packageCode + (p.barcode ? ` (${p.barcode})` : ""),
      status: p.status,
      href: `/admin/packages/${p.id}`,
    })),
    customers: customers.map((c) => ({
      id: c.id,
      label: c.fullName,
      sub: c.phone || c.email || "",
      href: `/admin/users`,
    })),
    leads: leads.map((l) => ({
      id: l.id,
      label: l.fullName,
      sub: l.phone || "",
      source: l.source,
      status: l.status,
      href: `/admin/leads`,
    })),
    issues: issues.map((i) => ({
      id: i.id,
      label: `${i.issueType}${i.orderCode ? ` — ${i.orderCode}` : ""}`,
      sub: i.customer.fullName,
      description: i.description.slice(0, 60),
      status: i.status,
      href: `/admin/customer-issues`,
    })),
    query: q,
  });
});
