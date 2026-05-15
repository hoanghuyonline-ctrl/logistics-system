export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const role = url.searchParams.get("role");
  const search = url.searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        zaloRecipientId: true,
        wallet: { select: { balance: true, debt: true } },
        _count: { select: { orders: true } },
        orders: {
          select: { updatedAt: true },
          orderBy: { updatedAt: "desc" as const },
          take: 1,
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return jsonResponse({ users, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { email, password, fullName, phone, address, role } = body;

  if (!email || !password || !fullName || !role) {
    return errorResponse("Missing required fields");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return errorResponse("Email already exists", 409);

  const hashed = await bcrypt.hash(password, 12);

  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashed,
      fullName,
      phone,
      address,
      role,
      wallet: { create: { balance: 0, debt: 0 } },
    },
    select: { id: true, email: true, fullName: true, role: true },
  });

  return jsonResponse(newUser, 201);
}
