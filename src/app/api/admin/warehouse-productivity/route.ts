export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { OrderStatus, PackageStatus } from "@prisma/client";

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const stuckChinaDays = 5;
  const stuckVietnamDays = 3;
  const stuckChinaCutoff = new Date(now.getTime() - stuckChinaDays * 24 * 60 * 60 * 1000);
  const stuckVietnamCutoff = new Date(now.getTime() - stuckVietnamDays * 24 * 60 * 60 * 1000);

  const [
    packagesCreatedToday,
    ordersCompletedToday,
    chinaWhActivity,
    vietnamWhActivity,
    missingWeight,
    stuckAtChina,
    stuckAtVietnam,
    totalAtChina,
    totalAtVietnam,
    recentStatusChanges,
  ] = await Promise.all([
    // 1. Packages created today
    prisma.package.count({
      where: { createdAt: { gte: todayStart } },
    }),

    // 2. Orders completed/delivered today
    prisma.orderStatusLog.count({
      where: {
        toStatus: { in: [OrderStatus.COMPLETED, OrderStatus.ARRIVED_VIETNAM_WH, OrderStatus.OUT_FOR_DELIVERY] },
        createdAt: { gte: todayStart },
      },
    }),

    // 3. China warehouse activity today (packages received or orders marked ARRIVED_CHINA_WH)
    prisma.orderStatusLog.count({
      where: {
        toStatus: { in: [OrderStatus.ARRIVED_CHINA_WH, OrderStatus.PACKING, OrderStatus.SHIPPING_TO_VIETNAM] },
        createdAt: { gte: todayStart },
      },
    }),

    // 4. Vietnam warehouse activity today
    prisma.orderStatusLog.count({
      where: {
        toStatus: { in: [OrderStatus.ARRIVED_VIETNAM_WH, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.COMPLETED] },
        createdAt: { gte: todayStart },
      },
    }),

    // 5. Packages missing weight
    prisma.package.count({
      where: {
        totalWeightKg: null,
        status: { not: PackageStatus.DELIVERED },
      },
    }),

    // 6. Packages stuck at China warehouse > N days
    prisma.package.count({
      where: {
        status: PackageStatus.AT_CHINA_WH,
        updatedAt: { lt: stuckChinaCutoff },
      },
    }),

    // 7. Packages stuck at Vietnam warehouse > N days
    prisma.package.count({
      where: {
        status: PackageStatus.AT_VIETNAM_WH,
        updatedAt: { lt: stuckVietnamCutoff },
      },
    }),

    // Total at China
    prisma.package.count({
      where: { status: PackageStatus.AT_CHINA_WH },
    }),

    // Total at Vietnam
    prisma.package.count({
      where: { status: PackageStatus.AT_VIETNAM_WH },
    }),

    // 8. Recent status changes today (last 10)
    prisma.orderStatusLog.findMany({
      where: { createdAt: { gte: todayStart } },
      select: {
        toStatus: true,
        createdAt: true,
        order: { select: { orderCode: true, id: true } },
        changer: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  // Compute bottleneck label
  const bottlenecks: string[] = [];
  if (stuckAtVietnam > 3) bottlenecks.push("Tắc ở kho VN");
  if (stuckAtChina > 5) bottlenecks.push("Tắc ở kho TQ");
  if (missingWeight > 5) bottlenecks.push("Thiếu cân");
  const bottleneckLabel = bottlenecks.length > 0 ? bottlenecks.join(" · ") : "Đang ổn";
  const bottleneckLevel: "green" | "yellow" | "red" =
    stuckAtVietnam > 5 || stuckAtChina > 10 ? "red"
    : bottlenecks.length > 0 ? "yellow"
    : "green";

  return jsonResponse({
    today: {
      packagesCreated: packagesCreatedToday,
      ordersProcessed: ordersCompletedToday,
      chinaActivity: chinaWhActivity,
      vietnamActivity: vietnamWhActivity,
    },
    warehouse: {
      missingWeight,
      stuckAtChina,
      stuckAtVietnam,
      totalAtChina,
      totalAtVietnam,
    },
    bottleneck: {
      label: bottleneckLabel,
      level: bottleneckLevel,
    },
    recentActivity: recentStatusChanges.map((r) => ({
      orderCode: r.order.orderCode,
      orderId: r.order.id,
      status: r.toStatus,
      changedBy: r.changer.fullName,
      time: r.createdAt.toISOString(),
    })),
  });
});
