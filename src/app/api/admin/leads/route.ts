import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import type { Prisma } from "@prisma/client";
import { recordLeadActivity } from "@/lib/lead-activity";

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
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const [total, newCount, convertedCount, todayCount, followUpTodayCount, overdueCount] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "NEW" } }),
      prisma.lead.count({ where: { status: "CONVERTED" } }),
      prisma.lead.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.lead.count({
        where: {
          nextFollowUpAt: { gte: todayStart, lte: todayEnd },
          status: { notIn: ["CONVERTED", "LOST"] },
        },
      }),
      prisma.lead.count({
        where: {
          nextFollowUpAt: { lt: todayStart },
          status: { notIn: ["CONVERTED", "LOST"] },
        },
      }),
    ]);
    return jsonResponse({
      total,
      newCount,
      convertedCount,
      todayCount,
      followUpTodayCount,
      overdueCount,
      conversionRate: total > 0 ? Math.round((convertedCount / total) * 100) : 0,
    });
  }

  const followUp = url.searchParams.get("followUp") || "";

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
  if (followUp === "today") {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    where.nextFollowUpAt = { gte: todayStart, lte: todayEnd };
    where.status = { notIn: ["CONVERTED", "LOST"] };
  } else if (followUp === "overdue") {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    where.nextFollowUpAt = { lt: todayStart };
    where.status = { notIn: ["CONVERTED", "LOST"] };
  }

  const sort = url.searchParams.get("sort") || "";
  const orderBy: Prisma.LeadOrderByWithRelationInput[] =
    sort === "activity"
      ? [{ lastContactedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }]
      : [{ createdAt: "desc" }];

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, fullName: true } },
        convertedUser: { select: { id: true, fullName: true, email: true } },
      },
      orderBy,
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

  recordLeadActivity(lead.id, "CREATED", `Nguồn: ${source || "OTHER"}`, user.id).catch(() => {});

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
  if (updates.nextFollowUpAt !== undefined) {
    data.nextFollowUpAt = updates.nextFollowUpAt ? new Date(updates.nextFollowUpAt) : null;
  }
  if (updates.lastContactedAt !== undefined) {
    data.lastContactedAt = updates.lastContactedAt ? new Date(updates.lastContactedAt) : null;
  }
  if (updates.followUpNote !== undefined) {
    data.followUpNote = updates.followUpNote?.trim() || null;
  }
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

  if (updates.status !== undefined && updates.status !== existing.status) {
    recordLeadActivity(id, "STATUS_CHANGED", `${existing.status} → ${updates.status}`, user.id).catch(() => {});
  }
  if (updates.notes !== undefined) {
    recordLeadActivity(id, "NOTE_UPDATED", undefined, user.id).catch(() => {});
  }
  if (updates.assignedToId !== undefined && updates.assignedToId !== existing.assignedToId) {
    recordLeadActivity(id, "ASSIGNED", updates.assignedToId || "Bỏ phân công", user.id).catch(() => {});
  }
  if (updates.lastContactedAt !== undefined) {
    recordLeadActivity(id, "CONTACTED", undefined, user.id).catch(() => {});
  }
  if (updates.nextFollowUpAt !== undefined) {
    recordLeadActivity(id, "FOLLOW_UP_SET", updates.nextFollowUpAt || "Xóa lịch", user.id).catch(() => {});
  }

  return jsonResponse(lead);
}
