export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler, safeQuery } from "@/lib/utils";

// API handler for isolated shareholder strategic snapshots
export const GET = withErrorHandler(async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "ACCOUNTANT"])) {
    return errorResponse("Forbidden", 403);
  }

  const snapshots = await safeQuery(
    prisma.financialSnapshot.findMany({
      orderBy: { targetDate: "asc" }
    }),
    []
  );

  return jsonResponse(snapshots);
});

export const POST = withErrorHandler(async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "ACCOUNTANT"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();

  // If request is to seed mock data
  if (body.action === "seed") {
    // Check if we already have data. If yes, clear it to avoid duplication.
    await prisma.financialSnapshot.deleteMany({});

    const mockSnapshots = [
      {
        periodType: "MONTHLY",
        targetDate: new Date("2025-11-01T00:00:00.000Z"),
        grossServiceRevenue: 320000000,
        operatingExpenses: 210000000,
        netProfit: 110000000,
        cashLiquidity: 1500000000,
        totalObligations: 450000000
      },
      {
        periodType: "MONTHLY",
        targetDate: new Date("2025-12-01T00:00:00.000Z"),
        grossServiceRevenue: 410000000,
        operatingExpenses: 280000000,
        netProfit: 130000000,
        cashLiquidity: 1650000000,
        totalObligations: 510000000
      },
      {
        periodType: "MONTHLY",
        targetDate: new Date("2026-01-01T00:00:00.000Z"),
        grossServiceRevenue: 530000000,
        operatingExpenses: 340000000,
        netProfit: 190000000,
        cashLiquidity: 1800000000,
        totalObligations: 580000000
      },
      {
        periodType: "MONTHLY",
        targetDate: new Date("2026-02-01T00:00:00.000Z"),
        grossServiceRevenue: 480000000,
        operatingExpenses: 310000000,
        netProfit: 170000000,
        cashLiquidity: 1950000000,
        totalObligations: 540000000
      },
      {
        periodType: "MONTHLY",
        targetDate: new Date("2026-03-01T00:00:00.000Z"),
        grossServiceRevenue: 620000000,
        operatingExpenses: 410000000,
        netProfit: 210000000,
        cashLiquidity: 2200000000,
        totalObligations: 630000000
      },
      {
        periodType: "MONTHLY",
        targetDate: new Date("2026-04-01T00:00:00.000Z"),
        grossServiceRevenue: 750000000,
        operatingExpenses: 490000000,
        netProfit: 260000000,
        cashLiquidity: 2500000000,
        totalObligations: 700000000
      },
      {
        periodType: "MONTHLY",
        targetDate: new Date("2026-05-01T00:00:00.000Z"),
        grossServiceRevenue: 890000000,
        operatingExpenses: 560000000,
        netProfit: 330000000,
        cashLiquidity: 2900000000,
        totalObligations: 780000000
      }
    ];

    const created = [];
    for (const snapshot of mockSnapshots) {
      const snap = await prisma.financialSnapshot.create({
        data: {
          periodType: snapshot.periodType,
          targetDate: snapshot.targetDate,
          grossServiceRevenue: snapshot.grossServiceRevenue,
          operatingExpenses: snapshot.operatingExpenses,
          netProfit: snapshot.netProfit,
          cashLiquidity: snapshot.cashLiquidity,
          totalObligations: snapshot.totalObligations
        }
      });
      created.push(snap);
    }

    return jsonResponse({ success: true, count: created.length });
  }

  // Regular single snapshot creation
  const {
    periodType,
    targetDate,
    grossServiceRevenue,
    operatingExpenses,
    netProfit,
    cashLiquidity,
    totalObligations
  } = body;

  if (!periodType || !targetDate) {
    return errorResponse("Missing periodType or targetDate", 400);
  }

  const snap = await prisma.financialSnapshot.create({
    data: {
      periodType,
      targetDate: new Date(targetDate),
      grossServiceRevenue: Number(grossServiceRevenue || 0),
      operatingExpenses: Number(operatingExpenses || 0),
      netProfit: Number(netProfit || 0),
      cashLiquidity: Number(cashLiquidity || 0),
      totalObligations: Number(totalObligations || 0)
    }
  });

  return jsonResponse({ success: true, snapshot: snap });
});

export const DELETE = withErrorHandler(async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return errorResponse("Missing snapshot id", 400);
  }

  await prisma.financialSnapshot.delete({
    where: { id }
  });

  return jsonResponse({ success: true });
});
