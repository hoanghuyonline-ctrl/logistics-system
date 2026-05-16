import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";

export const POST = withErrorHandler(async function POST(request: Request) {
  const body = await request.json();
  const { email, password, fullName, phone, address } = body;

  if (!email || !password || !fullName) {
    return errorResponse("Email, password, and full name are required");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return errorResponse("Email already registered", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName,
      phone,
      address,
      role: "CUSTOMER",
      wallet: { create: { balance: 0, debt: 0 } },
    },
    select: { id: true, email: true, fullName: true, role: true },
  });

  return jsonResponse(user, 201);
});
