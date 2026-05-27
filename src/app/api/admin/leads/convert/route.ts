import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import bcrypt from "bcryptjs";
import { recordLeadActivity } from "@/lib/lead-activity";

export const POST = withErrorHandler(async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "STAFF"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { leadId, existingUserId, createAccount, email, password } = body;

  if (!leadId) {
    return errorResponse("Thiếu leadId", 400);
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return errorResponse("Không tìm thấy lead", 404);
  }
  if (lead.status === "CONVERTED") {
    return errorResponse("Lead này đã được chuyển đổi", 400);
  }

  let convertedUserId: string;

  if (existingUserId) {
    const existingUser = await prisma.user.findUnique({ where: { id: existingUserId } });
    if (!existingUser) {
      return errorResponse("Không tìm thấy khách hàng", 404);
    }
    convertedUserId = existingUser.id;
  } else if (createAccount) {
    if (!email || !password) {
      return errorResponse("Email và mật khẩu là bắt buộc khi tạo tài khoản mới", 400);
    }
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return errorResponse("Email đã tồn tại trong hệ thống", 400);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: lead.fullName,
        phone: lead.phone,
        role: "CUSTOMER",
        wallet: { create: {} },
      },
    });
    convertedUserId = newUser.id;
  } else {
    return errorResponse("Chọn liên kết khách hàng hoặc tạo tài khoản mới", 400);
  }

  const updatedLead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: "CONVERTED",
      convertedUserId,
    },
    include: {
      assignedTo: { select: { id: true, fullName: true } },
      convertedUser: { select: { id: true, fullName: true, email: true } },
    },
  });

  recordLeadActivity(leadId, "CONVERTED", `userId=${convertedUserId}`, user.id).catch(() => {});

  return jsonResponse(updatedLead);
});
