export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/packages/[id]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "WAREHOUSE_CN", "WAREHOUSE_VN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const pkg = await prisma.package.findUnique({
    where: { id },
    include: {
      orders: {
        include: {
          user: { select: { fullName: true, email: true } },
        },
      },
      images: true,
      creator: { select: { fullName: true } },
    },
  });

  if (!pkg) return errorResponse("Package not found", 404);
  return jsonResponse(pkg);
}

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/packages/[id]">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "WAREHOUSE_CN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();

  const updated = await prisma.package.update({
    where: { id },
    data: {
      totalWeightKg: body.totalWeightKg ? parseFloat(body.totalWeightKg) : undefined,
      lengthCm: body.lengthCm ? parseFloat(body.lengthCm) : undefined,
      widthCm: body.widthCm ? parseFloat(body.widthCm) : undefined,
      heightCm: body.heightCm ? parseFloat(body.heightCm) : undefined,
    },
  });

  return jsonResponse(updated);
}
