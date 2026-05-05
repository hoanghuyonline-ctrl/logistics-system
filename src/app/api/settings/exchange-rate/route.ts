export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/utils";

export async function GET() {
  const config = await prisma.systemConfig.findUnique({
    where: { key: "exchange_rate" },
  });
  return jsonResponse({ exchange_rate: config?.value || "3500" });
}
