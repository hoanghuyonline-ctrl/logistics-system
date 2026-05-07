import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.orderStatusLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        order: { select: { orderCode: true, productName: true } },
        changer: { select: { fullName: true, email: true, role: true } },
      },
    }),
    prisma.orderStatusLog.count(),
  ]);

  return jsonResponse({
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
