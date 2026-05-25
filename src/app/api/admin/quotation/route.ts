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
  const serviceType = url.searchParams.get("serviceType") || undefined;
  const search = url.searchParams.get("search") || undefined;
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (serviceType) where.serviceType = serviceType;
  if (search) {
    where.OR = [
      { requestCode: { contains: search, mode: "insensitive" } },
      { contactName: { contains: search, mode: "insensitive" } },
      { contactEmail: { contains: search, mode: "insensitive" } },
      { contactPhone: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
      { cargoDescription: { contains: search, mode: "insensitive" } },
    ];
  }

  const [requests, total] = await Promise.all([
    prisma.quotationRequest.findMany({
      where,
      include: { responder: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.quotationRequest.count({ where }),
  ]);

  return jsonResponse({ requests, total, page, totalPages: Math.ceil(total / limit) });
});
