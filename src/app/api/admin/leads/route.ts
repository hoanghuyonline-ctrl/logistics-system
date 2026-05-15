import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "20"));
  const search = url.searchParams.get("search") || "";
  const source = url.searchParams.get("source") || "";
  const status = url.searchParams.get("status") || "";
  const mode = url.searchParams.get("mode") || "";

  if (mode === "stats") {
    const [total, newCount, convertedCount, todayCount] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "NEW" } }),
      prisma.lead.count({ where: { status: "CONVERTED" } }),
      prisma.lead.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);
    return jsonResponse({
      total,
      newCount,
      convertedCount,
      todayCount,
      conversionRate: total > 0 ? Math.round((convertedCount / total) * 100) : 0,
    });
  }

  const where: Prisma.LeadWhereInput = {};
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (source) {
    where.source = source as Prisma.EnumLeadSourceFilter;
  }
  if (status) {
    where.status = status as Prisma.EnumLeadStatusFilter;
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, fullName: true } },
        convertedUser: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ]);

  return jsonResponse({
    leads,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { fullName, phone, email, zaloName, facebookName, source, notes, assignedToId } = body;

  if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
    return errorResponse("Họ tên là bắt buộc", 400);
  }

  const lead = await prisma.lead.create({
    data: {
      fullName: fullName.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      zaloName: zaloName?.trim() || null,
      facebookName: facebookName?.trim() || null,
      source: source || "OTHER",
      notes: notes?.trim() || null,
      assignedToId: assignedToId || null,
    },
    include: {
      assignedTo: { select: { id: true, fullName: true } },
    },
  });

  return jsonResponse(lead, 201);
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return errorResponse("Thiếu ID lead", 400);
  }

  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) {
    return errorResponse("Không tìm thấy lead", 404);
  }

  const data: Prisma.LeadUpdateInput = {};
  if (updates.fullName !== undefined) data.fullName = updates.fullName.trim();
  if (updates.phone !== undefined) data.phone = updates.phone?.trim() || null;
  if (updates.email !== undefined) data.email = updates.email?.trim() || null;
  if (updates.zaloName !== undefined) data.zaloName = updates.zaloName?.trim() || null;
  if (updates.facebookName !== undefined) data.facebookName = updates.facebookName?.trim() || null;
  if (updates.source !== undefined) data.source = updates.source;
  if (updates.status !== undefined) data.status = updates.status;
  if (updates.notes !== undefined) data.notes = updates.notes?.trim() || null;
  if (updates.assignedToId !== undefined) {
    data.assignedTo = updates.assignedToId
      ? { connect: { id: updates.assignedToId } }
      : { disconnect: true };
  }

  const lead = await prisma.lead.update({
    where: { id },
    data,
    include: {
      assignedTo: { select: { id: true, fullName: true } },
      convertedUser: { select: { id: true, fullName: true, email: true } },
    },
  });

  return jsonResponse(lead);
}
