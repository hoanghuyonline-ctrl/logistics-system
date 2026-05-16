export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "ACCOUNTANT"])) {
    return errorResponse("Forbidden", 403);
  }

  const configs = await prisma.systemConfig.findMany();
  const result: Record<string, string> = {};
  for (const c of configs) {
    result[c.key] = c.value;
  }
  return jsonResponse(result);
});

export const PUT = withErrorHandler(async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();

  const updates = Object.entries(body).map(([key, value]) =>
    prisma.systemConfig.upsert({
      where: { key },
      update: { value: String(value), updatedBy: user.id },
      create: { key, value: String(value), updatedBy: user.id },
    })
  );

  await Promise.all(updates);
  return jsonResponse({ message: "Settings updated" });
});
