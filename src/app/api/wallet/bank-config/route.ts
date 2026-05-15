import { prisma } from "@/lib/prisma";
import { getCurrentUser, jsonResponse, errorResponse } from "@/lib/utils";

const DEFAULTS: Record<string, string> = {
  topup_bank_name: "Vietinbank CN Lạng Sơn",
  topup_bank_bin: "970415",
  topup_bank_account: "110003049134",
  topup_bank_account_holder: "BAC TRUNG HAI LOGISTICS CO LTD",
  topup_transfer_prefix: "NAPVI",
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const configs = await prisma.systemConfig.findMany({
    where: {
      key: { in: Object.keys(DEFAULTS) },
    },
  });

  const result: Record<string, string> = { ...DEFAULTS };
  for (const c of configs) {
    if (c.value) result[c.key] = c.value;
  }

  return jsonResponse(result);
}
