import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export const GET = withErrorHandler(async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "STAFF"])) {
    return errorResponse("Forbidden", 403);
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(50, parseInt(url.searchParams.get("limit") || "20"));
  const status = url.searchParams.get("status") || "";
  const channel = url.searchParams.get("channel") || "";

  const where: Prisma.CampaignWhereInput = {};
  if (status) {
    where.status = status as Prisma.EnumCampaignStatusFilter;
  }
  if (channel) {
    where.channel = channel as Prisma.EnumCampaignChannelFilter;
  }

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: {
        createdBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campaign.count({ where }),
  ]);

  return jsonResponse({
    campaigns,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

export const POST = withErrorHandler(async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "STAFF"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { name, channel, targetStatus, messageTemplate, scheduledAt, notes } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return errorResponse("Tên chiến dịch là bắt buộc", 400);
  }
  if (!channel) {
    return errorResponse("Kênh gửi là bắt buộc", 400);
  }

  const campaign = await prisma.campaign.create({
    data: {
      name: name.trim(),
      channel,
      targetStatus: targetStatus || null,
      messageTemplate: messageTemplate?.trim() || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      notes: notes?.trim() || null,
      createdById: user.id,
    },
    include: {
      createdBy: { select: { id: true, fullName: true } },
    },
  });

  return jsonResponse(campaign, 201);
});

export const PUT = withErrorHandler(async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "STAFF"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return errorResponse("Thiếu ID chiến dịch", 400);
  }

  const existing = await prisma.campaign.findUnique({ where: { id } });
  if (!existing) {
    return errorResponse("Không tìm thấy chiến dịch", 404);
  }

  const data: Prisma.CampaignUpdateInput = {};
  if (updates.name !== undefined) data.name = updates.name.trim();
  if (updates.channel !== undefined) data.channel = updates.channel;
  if (updates.status !== undefined) data.status = updates.status;
  if (updates.targetStatus !== undefined) data.targetStatus = updates.targetStatus || null;
  if (updates.messageTemplate !== undefined) data.messageTemplate = updates.messageTemplate?.trim() || null;
  if (updates.scheduledAt !== undefined) {
    data.scheduledAt = updates.scheduledAt ? new Date(updates.scheduledAt) : null;
  }
  if (updates.notes !== undefined) data.notes = updates.notes?.trim() || null;

  const campaign = await prisma.campaign.update({
    where: { id },
    data,
    include: {
      createdBy: { select: { id: true, fullName: true } },
    },
  });

  return jsonResponse(campaign);
});
