export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import { sendTelegram } from "@/lib/notifications/channels/telegram";
import { sendZalo } from "@/lib/notifications/channels/zalo";
import { sendEmail } from "@/lib/notifications/channels/email";

const NON_RETRYABLE_CATEGORIES = new Set(["INVALID_RECIPIENT", "CONFIG_MISSING"]);
const NON_RETRYABLE_ERRORS = new Set(["TELEGRAM_NOT_BOUND", "ZALO_NOT_BOUND"]);
const RETENTION_DAYS = 30;
const MAX_RESOLVED_KEEP = 500;

function runCleanup(): void {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  prisma.notificationFailure
    .deleteMany({ where: { resolved: true, createdAt: { lt: cutoff } } })
    .then((r) => { if (r.count > 0) console.log(`[notify/cleanup] purged ${r.count} resolved failures older than ${RETENTION_DAYS}d`); })
    .catch((e) => console.error("[notify/cleanup] error:", e instanceof Error ? e.message : String(e)));

  prisma.notificationFailure
    .count({ where: { resolved: true } })
    .then(async (count) => {
      if (count <= MAX_RESOLVED_KEEP) return;
      const keep = await prisma.notificationFailure.findMany({
        where: { resolved: true },
        orderBy: { createdAt: "desc" },
        take: MAX_RESOLVED_KEEP,
        select: { id: true },
      });
      const keepIds = keep.map((r) => r.id);
      const del = await prisma.notificationFailure.deleteMany({
        where: { resolved: true, id: { notIn: keepIds } },
      });
      if (del.count > 0) console.log(`[notify/cleanup] trimmed ${del.count} resolved failures (cap=${MAX_RESOLVED_KEEP})`);
    })
    .catch((e) => console.error("[notify/cleanup] trim error:", e instanceof Error ? e.message : String(e)));
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "STAFF"])) {
    return errorResponse("Forbidden", 403);
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));

  const where = filter === "unresolved"
    ? { resolved: false }
    : filter === "resolved"
    ? { resolved: true }
    : {};

  const [failures, filteredTotal, counts] = await Promise.all([
    prisma.notificationFailure.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notificationFailure.count({ where }),
    prisma.notificationFailure.groupBy({
      by: ["resolved"],
      _count: true,
    }),
  ]);

  const total = counts.reduce((s, c) => s + c._count, 0);
  const unresolved = counts.find((c) => !c.resolved)?._count ?? 0;

  // Background cleanup — fire-and-forget, doesn't delay response
  runCleanup();

  return jsonResponse({
    failures,
    total,
    unresolved,
    resolved: total - unresolved,
    page,
    totalPages: Math.ceil(filteredTotal / limit),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "STAFF"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { action, failureId } = body as { action: string; failureId: string };

  if (!failureId) return errorResponse("Missing failureId", 400);

  const failure = await prisma.notificationFailure.findUnique({ where: { id: failureId } });
  if (!failure) return errorResponse("Failure not found", 404);

  if (action === "resolve") {
    const updated = await prisma.notificationFailure.update({
      where: { id: failureId },
      data: { resolved: true },
    });
    return jsonResponse(updated);
  }

  if (action === "retry") {
    if (failure.resolved) return errorResponse("Already resolved", 400);
    if (failure.retryCount >= 3) return errorResponse("Max retries reached (3)", 400);

    const cat = failure.failureCategory || "";
    const reason = failure.shortReason || "";
    if (NON_RETRYABLE_CATEGORIES.has(cat) || NON_RETRYABLE_ERRORS.has(reason)) {
      return errorResponse("Lỗi này không thể thử lại — cần khách hàng liên kết kênh trước", 400);
    }

    const text = failure.payloadSummary || "Thông báo từ Bắc Trung Hải Logistics";
    let success = false;
    let retryError = "";

    try {
      switch (failure.channel) {
        case "TELEGRAM":
          await sendTelegram({ text });
          success = true;
          break;
        case "ZALO":
          await sendZalo({
            text,
            orderCode: failure.orderCode ?? undefined,
            recipientId: failure.recipient ?? undefined,
          });
          success = true;
          break;
        case "EMAIL":
          if (!failure.recipient) throw new Error("No email recipient");
          await sendEmail({ to: failure.recipient, subject: "Thông báo", text });
          success = true;
          break;
        default:
          throw new Error(`Unsupported channel: ${failure.channel}`);
      }
    } catch (err) {
      retryError = err instanceof Error ? err.message : String(err);
      console.error(`[notify/retry] FAIL id=${failureId} channel=${failure.channel} error=${retryError}`);
    }

    const updated = await prisma.notificationFailure.update({
      where: { id: failureId },
      data: {
        retryCount: { increment: 1 },
        lastRetryAt: new Date(),
        resolved: success,
        shortReason: success ? "Retry thành công" : `Retry #${failure.retryCount + 1}: ${retryError}`.slice(0, 500),
      },
    });

    console.log(`[notify/retry] ${success ? "OK" : "FAIL"} id=${failureId} channel=${failure.channel} attempt=${failure.retryCount + 1}`);

    return jsonResponse({ ...updated, retrySuccess: success, retryError: success ? null : retryError });
  }

  return errorResponse("Invalid action. Use 'retry' or 'resolve'", 400);
}
