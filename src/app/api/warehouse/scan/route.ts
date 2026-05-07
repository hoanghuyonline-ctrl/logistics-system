import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import type { PackageStatus } from "@prisma/client";

const VALID_TRANSITIONS: Record<string, PackageStatus[]> = {
  AT_CHINA_WH: ["SHIPPING"],
  SHIPPING: ["AT_VIETNAM_WH"],
  AT_VIETNAM_WH: ["DELIVERED"],
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "WAREHOUSE_CN", "WAREHOUSE_VN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { barcode, action, newStatus } = body as {
    barcode?: string;
    action?: "lookup" | "update";
    newStatus?: PackageStatus;
  };

  if (!barcode) return errorResponse("Barcode is required");

  const pkg = await prisma.package.findFirst({
    where: {
      OR: [
        { barcode: barcode },
        { packageCode: barcode },
      ],
    },
    include: {
      orders: {
        select: {
          id: true,
          orderCode: true,
          productName: true,
          quantity: true,
          status: true,
          user: { select: { fullName: true } },
        },
      },
      creator: { select: { fullName: true } },
    },
  });

  if (!pkg) return errorResponse("Package not found", 404);

  if (action === "update" && newStatus) {
    const allowed = VALID_TRANSITIONS[pkg.status] || [];
    if (!allowed.includes(newStatus)) {
      return errorResponse(`Cannot transition from ${pkg.status} to ${newStatus}`);
    }

    const updated = await prisma.package.update({
      where: { id: pkg.id },
      data: { status: newStatus },
      include: {
        orders: {
          select: {
            id: true,
            orderCode: true,
            productName: true,
            quantity: true,
            status: true,
            user: { select: { fullName: true } },
          },
        },
        creator: { select: { fullName: true } },
      },
    });

    console.log(
      `[warehouse:scan] Package ${pkg.packageCode} status: ${pkg.status} → ${newStatus} by ${user.email}`,
    );

    return jsonResponse({ package: updated, transitioned: true });
  }

  return jsonResponse({ package: pkg, transitioned: false });
}
