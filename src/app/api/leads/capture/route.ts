import { prisma } from "@/lib/prisma";
import { jsonResponse, errorResponse } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, phone, zaloName, notes } = body;

    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return errorResponse("Họ tên là bắt buộc", 400);
    }
    if (!phone || typeof phone !== "string" || !phone.trim()) {
      return errorResponse("Số điện thoại là bắt buộc", 400);
    }

    const lead = await prisma.lead.create({
      data: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        zaloName: zaloName?.trim() || null,
        notes: notes?.trim() || null,
        source: "WEBSITE",
        status: "NEW",
      },
    });

    console.log(`[leads/capture] New lead: ${lead.id} - ${lead.fullName} - ${lead.phone}`);

    return jsonResponse({ success: true, id: lead.id }, 201);
  } catch (err) {
    console.error("[leads/capture] Error:", err);
    return errorResponse("Có lỗi xảy ra, vui lòng thử lại", 500);
  }
}
