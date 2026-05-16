export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { jsonResponse, withErrorHandler } from "@/lib/utils";

export const GET = withErrorHandler(async function GET() {
  const config = await prisma.systemConfig.findUnique({
    where: { key: "exchange_rate" },
  });
  return jsonResponse({ exchange_rate: config?.value || "3500" });
});
