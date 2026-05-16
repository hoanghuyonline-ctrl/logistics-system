export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, generatePackageCode, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";

export const GET = withErrorHandler(async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "WAREHOUSE_CN", "WAREHOUSE_VN"])) {
    return errorResponse("Forbidden", 403);
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [packages, total] = await Promise.all([
    prisma.package.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        orders: { select: { id: true, orderCode: true, productName: true, weightKg: true } },
        images: true,
        creator: { select: { fullName: true } },
      },
    }),
    prisma.package.count({ where }),
  ]);

  return jsonResponse({ packages, total, page, totalPages: Math.ceil(total / limit) });
});

export const POST = withErrorHandler(async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "WAREHOUSE_CN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { orderIds, totalWeightKg, lengthCm, widthCm, heightCm } = body;

  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    return errorResponse("At least one order is required");
  }

  const packageCode = generatePackageCode();
  const barcode = `BC-${packageCode}`;

  const pkg = await prisma.package.create({
    data: {
      packageCode,
      barcode,
      totalWeightKg: totalWeightKg ? parseFloat(totalWeightKg) : null,
      lengthCm: lengthCm ? parseFloat(lengthCm) : null,
      widthCm: widthCm ? parseFloat(widthCm) : null,
      heightCm: heightCm ? parseFloat(heightCm) : null,
      createdBy: user.id,
    },
  });

  await prisma.order.updateMany({
    where: { id: { in: orderIds } },
    data: { packageId: pkg.id },
  });

  const created = await prisma.package.findUnique({
    where: { id: pkg.id },
    include: {
      orders: { select: { id: true, orderCode: true, productName: true } },
      images: true,
    },
  });

  return jsonResponse(created, 201);
});
