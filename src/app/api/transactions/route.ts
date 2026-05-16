export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";

export const GET = withErrorHandler(async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { order: { select: { orderCode: true } } },
    }),
    prisma.transaction.count({ where: { userId: user.id } }),
  ]);

  return jsonResponse({ transactions, total, page, totalPages: Math.ceil(total / limit) });
});
