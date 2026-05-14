export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import { sendTelegram } from "@/lib/notifications/channels/telegram";
import { sendZalo } from "@/lib/notifications/channels/zalo";
import { sendEmail } from "@/lib/notifications/channels/email";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter"); // "unresolved" | "resolved" | null (all)

  const where = filter === "unresolved"
    ? { resolved: false }
    : filter === "resolved"
    ? { resolved: true }
    : {};

  const [failures, counts] = await Promise.all([
    prisma.notificationFailure.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.notificationFailure.groupBy({
      by: ["resolved"],
      _count: true,
    }),
  ]);

  const total = counts.reduce((s, c) => s + c._count, 0);
  const unresolved = counts.find((c) => !c.resolved)?._count ?? 0;

  return jsonResponse({ failures, total, unresolved, resolved: total - unresolved });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
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
