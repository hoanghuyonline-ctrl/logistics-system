export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "WAREHOUSE_CN", "WAREHOUSE_VN", "ACCOUNTANT"])) {
    return errorResponse("Forbidden", 403);
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (filter === "unresolved") where.resolved = false;
  if (filter === "resolved") where.resolved = true;
  if (filter === "urgent") where.priority = "URGENT";
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
      { orderCode: { contains: search, mode: "insensitive" } },
    ];
  }

  const [notes, counts] = await Promise.all([
    prisma.staffNote.findMany({
      where,
      include: { author: { select: { fullName: true, role: true } } },
      orderBy: [{ resolved: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.staffNote.groupBy({
      by: ["resolved"],
      _count: true,
    }),
  ]);

  const total = counts.reduce((s, c) => s + c._count, 0);
  const unresolved = counts.find((c) => !c.resolved)?._count ?? 0;

  return jsonResponse({ notes, total, unresolved, resolved: total - unresolved });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "WAREHOUSE_CN", "WAREHOUSE_VN", "ACCOUNTANT"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { title, content, orderCode, priority } = body as {
    title: string;
    content: string;
    orderCode?: string;
    priority?: string;
  };

  if (!title || !content) return errorResponse("Thiếu tiêu đề hoặc nội dung", 400);

  const note = await prisma.staffNote.create({
    data: {
      title,
      content,
      orderCode: orderCode || null,
      priority: priority || "NORMAL",
      createdBy: user.id,
    },
    include: { author: { select: { fullName: true, role: true } } },
  });

  return jsonResponse(note, 201);
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "WAREHOUSE_CN", "WAREHOUSE_VN", "ACCOUNTANT"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { id, resolved } = body as { id: string; resolved?: boolean };

  if (!id) return errorResponse("Missing id", 400);

  const data: Record<string, unknown> = {};
  if (resolved !== undefined) data.resolved = resolved;

  const updated = await prisma.staffNote.update({
    where: { id },
    data,
    include: { author: { select: { fullName: true, role: true } } },
  });

  return jsonResponse(updated);
}
