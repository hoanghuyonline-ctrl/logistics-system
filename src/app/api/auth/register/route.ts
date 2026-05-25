import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";

const VN_PHONE_REGEX = /^(?:\+84|0)\d{9,10}$/;

export const POST = withErrorHandler(async function POST(request: Request) {
  const body = await request.json();
  const { email, password, fullName, phone, address } = body;

  if (!email || !password || !fullName) {
    return errorResponse("Email, password, and full name are required");
  }

  if (!phone) {
    return errorResponse("Số điện thoại là bắt buộc");
  }

  const trimmedPhone = phone.trim();
  if (!VN_PHONE_REGEX.test(trimmedPhone)) {
    return errorResponse("Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)");
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return errorResponse("Email already registered", 409);
  }

  const existingPhone = await prisma.user.findUnique({ where: { phone: trimmedPhone } });
  if (existingPhone) {
    return errorResponse("Số điện thoại đã được đăng ký", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName,
      phone: trimmedPhone,
      address,
      role: "CUSTOMER",
      wallet: { create: { balance: 0, debt: 0 } },
    },
    select: { id: true, email: true, fullName: true, role: true },
  });

  return jsonResponse(user, 201);
});
