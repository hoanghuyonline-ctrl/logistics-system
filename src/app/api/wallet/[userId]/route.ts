export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

export const GET = withErrorHandler(async function GET(req: NextRequest, ctx: RouteContext<"/api/wallet/[userId]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "ACCOUNTANT"])) {
    return errorResponse("Forbidden", 403);
  }

  const { userId } = await ctx.params;
  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) return errorResponse("Wallet not found", 404);
  return jsonResponse(wallet);
});
