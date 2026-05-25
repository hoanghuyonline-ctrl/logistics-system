export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

export const GET = withErrorHandler(async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const status = url.searchParams.get("status") || undefined;
  const declarationType = url.searchParams.get("declarationType") || undefined;
  const search = url.searchParams.get("search") || undefined;
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (declarationType) where.declarationType = declarationType;
  if (search) {
    where.OR = [
      { requestCode: { contains: search, mode: "insensitive" } },
      { goodsDescription: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
      { customer: { fullName: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [requests, total] = await Promise.all([
    prisma.customsRequest.findMany({
      where,
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customsRequest.count({ where }),
  ]);

  return jsonResponse({ requests, total, page, totalPages: Math.ceil(total / limit) });
});
