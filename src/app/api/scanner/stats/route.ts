export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "WAREHOUSE_CN", "WAREHOUSE_VN"])) {
    return errorResponse("Forbidden", 403);
  }

  const [atChinaWh, shipping, atVietnamWh, delivered] = await Promise.all([
    prisma.package.count({ where: { status: "AT_CHINA_WH" } }),
    prisma.package.count({ where: { status: "SHIPPING" } }),
    prisma.package.count({ where: { status: "AT_VIETNAM_WH" } }),
    prisma.package.count({ where: { status: "DELIVERED" } }),
  ]);

  return jsonResponse({ atChinaWh, shipping, atVietnamWh, delivered });
});
