export const dynamic = "force-dynamic";

import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

type CheckStatus = "ok" | "warning" | "error";

interface SmokeCheck {
  key: string;
  label: string;
  status: CheckStatus;
  detail: string;
  durationMs: number;
}

async function timedCheck(
  key: string,
  label: string,
  fn: () => Promise<{ status: CheckStatus; detail: string }>,
): Promise<SmokeCheck> {
  const start = Date.now();
  try {
    const result = await fn();
    return { key, label, ...result, durationMs: Date.now() - start };
  } catch (err) {
    return {
      key,
      label,
      status: "error",
      detail: err instanceof Error ? err.message : "L\u1ed7i kh\u00f4ng x\u00e1c \u0111\u1ecbnh",
      durationMs: Date.now() - start,
    };
  }
}

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;
  const cookie = headersList.get("cookie") || "";

  const checks = await Promise.all([
    // 1. Database query
    timedCheck("database", "Database (PostgreSQL)", async () => {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ok", detail: "K\u1ebft n\u1ed1i OK" };
    }),

    // 2. Auth/session
    timedCheck("auth", "X\u00e1c th\u1ef1c / Session", async () => {
      if (!user) return { status: "error", detail: "Kh\u00f4ng c\u00f3 session" };
      return { status: "ok", detail: `\u0110\u0103ng nh\u1eadp: ${user.name || user.email || user.id} (${user.role})` };
    }),

    // 3. Orders API count
    timedCheck("orders_count", "\u0110\u01a1n h\u00e0ng (count)", async () => {
      const count = await prisma.order.count();
      return { status: "ok", detail: `${count} \u0111\u01a1n h\u00e0ng` };
    }),

    // 4. Quick-views API
    timedCheck("quick_views", "Quick-views API", async () => {
      const res = await fetch(`${baseUrl}/api/admin/quick-views`, {
        headers: { cookie },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return { status: "error", detail: `HTTP ${res.status}` };
      return { status: "ok", detail: "Ph\u1ea3n h\u1ed3i OK" };
    }),

    // 5. Notification config check (no external calls)
    timedCheck("notification", "C\u1ea5u h\u00ecnh th\u00f4ng b\u00e1o", async () => {
      const exists = await prisma.notification.findFirst({ select: { id: true } });
      if (!exists) return { status: "warning", detail: "Ch\u01b0a c\u00f3 th\u00f4ng b\u00e1o n\u00e0o" };
      return { status: "ok", detail: "H\u1ec7 th\u1ed1ng th\u00f4ng b\u00e1o OK" };
    }),

    // 6. Backup health API
    timedCheck("backup_health", "Backup health API", async () => {
      const res = await fetch(`${baseUrl}/api/admin/backup-health`, {
        headers: { cookie },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return { status: "error", detail: `HTTP ${res.status}` };
      return { status: "ok", detail: "Ph\u1ea3n h\u1ed3i OK" };
    }),

    // 7. Public /api/health
    timedCheck("public_health", "Public /api/health", async () => {
      const res = await fetch(`${baseUrl}/api/health`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return { status: "error", detail: `HTTP ${res.status}` };
      const data = await res.json();
      if (data.database !== "ok") return { status: "warning", detail: "Database degraded" };
      return { status: "ok", detail: `v${data.version || "?"}` };
    }),

    // 8. Webhook routes check
    timedCheck("webhooks", "Webhook routes", async () => {
      const res = await fetch(`${baseUrl}/api/webhooks/bank-transfer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(8000),
      });
      // We expect a 4xx error (bad request / unauthorized) but NOT 404
      if (res.status === 404) return { status: "error", detail: "Route kh\u00f4ng t\u1ed3n t\u1ea1i (404)" };
      return { status: "ok", detail: `Route \u0111\u00e3 \u0111\u0103ng k\u00fd (HTTP ${res.status})` };
    }),
  ]);

  const okCount = checks.filter((c) => c.status === "ok").length;
  const warnCount = checks.filter((c) => c.status === "warning").length;
  const errorCount = checks.filter((c) => c.status === "error").length;
  const totalMs = checks.reduce((s, c) => s + c.durationMs, 0);

  let overall: CheckStatus = "ok";
  if (errorCount > 0) overall = "error";
  else if (warnCount > 0) overall = "warning";

  return jsonResponse({
    overall,
    checks,
    summary: { ok: okCount, warning: warnCount, error: errorCount, totalMs },
    checkedAt: new Date().toISOString(),
  });
});
