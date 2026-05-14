export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";

const ISSUE_TYPES = [
  "THIEU_HANG",
  "GIAO_CHAM",
  "SAI_CAN",
  "HONG_HANG",
  "CHUA_NHAN",
  "PHI_SAI",
  "CHATBOT",
  "KHAC",
] as const;

const STATUSES = ["NEW", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED"] as const;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const issueType = searchParams.get("issueType");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (status && status !== "ALL") where.status = status;
  if (issueType && issueType !== "ALL") where.issueType = issueType;
  if (search) {
    where.OR = [
      { orderCode: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { customer: { fullName: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [issues, counts] = await Promise.all([
    prisma.customerIssue.findMany({
      where,
      include: {
        customer: { select: { fullName: true, phone: true, email: true } },
        assignee: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.customerIssue.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const c of counts) statusCounts[c.status] = c._count;

  return jsonResponse({ issues, statusCounts, issueTypes: ISSUE_TYPES, statuses: STATUSES });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { customerId, orderCode, issueType, description } = body as {
    customerId: string;
    orderCode?: string;
    issueType: string;
    description: string;
  };

  if (!customerId || !issueType || !description) {
    return errorResponse("Thiếu thông tin bắt buộc", 400);
  }

  const issue = await prisma.customerIssue.create({
    data: {
      customerId,
      orderCode: orderCode || null,
      issueType,
      description,
      assignedTo: user.id,
    },
    include: {
      customer: { select: { fullName: true } },
      assignee: { select: { fullName: true } },
    },
  });

  return jsonResponse(issue, 201);
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { id, status, resolution, assignedTo } = body as {
    id: string;
    status?: string;
    resolution?: string;
    assignedTo?: string;
  };

  if (!id) return errorResponse("Missing id", 400);

  const data: Record<string, unknown> = {};
  if (status) data.status = status;
  if (resolution !== undefined) data.resolution = resolution;
  if (assignedTo !== undefined) data.assignedTo = assignedTo || null;

  const updated = await prisma.customerIssue.update({
    where: { id },
    data,
    include: {
      customer: { select: { fullName: true } },
      assignee: { select: { fullName: true } },
    },
  });

  return jsonResponse(updated);
}
