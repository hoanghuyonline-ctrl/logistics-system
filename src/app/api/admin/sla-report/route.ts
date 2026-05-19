export const dynamic = "force-dynamic";

import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

interface BottleneckItem {
  key: string;
  label: string;
  count: number;
  severity: "ok" | "warning" | "danger";
}

// SLA thresholds in days (aligned with sla-alerts)
const SLA_THRESHOLDS: Record<string, { status: string | string[]; days: number; label: string }> = {
  pending_long: { status: "PENDING", days: 3, label: "Chờ xử lý quá lâu" },
  missing_tracking: { status: "SELLER_SHIPPED", days: 3, label: "Thiếu mã vận đơn TQ" },
  shipping_long: { status: "SHIPPING_TO_VIETNAM", days: 7, label: "Vận chuyển quốc tế chậm" },
  vietnam_wh_waiting: { status: "ARRIVED_VIETNAM_WH", days: 2, label: "Kho VN chờ giao lâu" },
  delivery_long: { status: "OUT_FOR_DELIVERY", days: 3, label: "Giao hàng quá chậm" },
};

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Run queries in parallel
  const [ordersUpdated7d, bottleneckResults] = await Promise.all([
    // 1. Orders updated in last 7 days
    prisma.order.count({
      where: { updatedAt: { gte: sevenDaysAgo } },
    }),

    // 2. Bottleneck counts — run all in parallel
    Promise.all(
      Object.entries(SLA_THRESHOLDS).map(async ([key, cfg]) => {
        const threshold = new Date(now.getTime() - cfg.days * 24 * 60 * 60 * 1000);
        const statuses = Array.isArray(cfg.status) ? cfg.status : [cfg.status];

        const whereClause: Record<string, unknown> = {
          status: { in: statuses },
          updatedAt: { lt: threshold },
        };

        // For missing tracking, also check trackingCodeChina is null
        if (key === "missing_tracking") {
          whereClause.trackingCodeChina = null;
          whereClause.status = { in: ["PURCHASED", "SELLER_SHIPPED"] };
        }

        const count = await prisma.order.count({ where: whereClause });

        let severity: "ok" | "warning" | "danger" = "ok";
        if (count > 5) severity = "danger";
        else if (count > 0) severity = "warning";

        return { key, label: cfg.label, count, severity } satisfies BottleneckItem;
      }),
    ),
  ]);

  // Total orders currently over SLA (sum of all bottlenecks)
  const totalOverSla = bottleneckResults.reduce((sum, b) => sum + b.count, 0);

  // SLA breach rate
  const breachRate = ordersUpdated7d > 0
    ? Math.round((totalOverSla / ordersUpdated7d) * 100 * 10) / 10
    : 0;

  // Trend label
  let trend: "good" | "attention" | "danger";
  let trendLabel: string;
  if (breachRate <= 5 && totalOverSla <= 3) {
    trend = "good";
    trendLabel = "\u0110ang \u1ed5n";
  } else if (breachRate <= 15 || totalOverSla <= 10) {
    trend = "attention";
    trendLabel = "C\u1ea7n ch\u00fa \u00fd";
  } else {
    trend = "danger";
    trendLabel = "Nguy hi\u1ec3m";
  }

  // Sort bottlenecks by count descending
  bottleneckResults.sort((a, b) => b.count - a.count);

  return jsonResponse({
    ordersUpdated7d,
    totalOverSla,
    breachRate,
    trend,
    trendLabel,
    bottlenecks: bottleneckResults,
  });
});
