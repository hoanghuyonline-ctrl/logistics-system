export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, generateSalesCode, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

export const GET = withErrorHandler(async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");

  const where: Record<string, unknown> = {};

  if (hasRole(user.role, ["CUSTOMER"])) {
    where.customerId = user.id;
  }

  if (status) where.status = status;

  if (search) {
    where.OR = [
      { requestCode: { contains: search, mode: "insensitive" } },
      { productName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [requests, total] = await Promise.all([
    prisma.salesRequest.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true } },
        product: { select: { id: true, name: true, imageUrl: true } },
        confirmedBy: { select: { id: true, fullName: true } },
      },
    }),
    prisma.salesRequest.count({ where }),
  ]);

  return jsonResponse({ requests, total, page, totalPages: Math.ceil(total / limit) });
});

export const POST = withErrorHandler(async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["CUSTOMER", "ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { productId, productName, quantity, customerNote } = body;

  if (!productName) return errorResponse("Tên sản phẩm là bắt buộc");

  const customerId = hasRole(user.role, ["ADMIN"]) && body.customerId ? body.customerId : user.id;

  let estimatedTotal: number | null = null;
  let resolvedProductName = productName;

  if (productId) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (product) {
      resolvedProductName = product.name;
      if (product.estimatedPrice) {
        const qty = parseInt(quantity) || 1;
        estimatedTotal = parseFloat(product.estimatedPrice.toString()) * qty;
      }
    }
  }

  const salesRequest = await prisma.salesRequest.create({
    data: {
      requestCode: generateSalesCode(),
      customerId,
      productId: productId || null,
      productName: resolvedProductName,
      quantity: parseInt(quantity) || 1,
      estimatedTotal,
      customerNote: customerNote || null,
    },
    include: {
      customer: { select: { id: true, fullName: true, email: true } },
    },
  });

  // Notify admins (fire-and-forget)
  prisma.user.findMany({ where: { role: "ADMIN" } }).then((admins) => {
    for (const admin of admins) {
      createNotification({
        userId: admin.id,
        title: "Yêu cầu mua hàng mới",
        message: `${salesRequest.customer.fullName} yêu cầu mua "${resolvedProductName}" (${salesRequest.requestCode}).`,
      }).catch(() => {});
    }
  }).catch(() => {});

  return jsonResponse(salesRequest, 201);
});
