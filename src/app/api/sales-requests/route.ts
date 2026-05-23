export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, generateSalesCode, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { createNotification, onSalesRequestCreated } from "@/lib/notifications";
import { buildAssetUrl } from "@/lib/url";

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
      { customer: { fullName: { contains: search, mode: "insensitive" } } },
      { customer: { phone: { contains: search, mode: "insensitive" } } },
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
        order: { select: { id: true, orderCode: true } },
      },
    }),
    prisma.salesRequest.count({ where }),
  ]);

  const resolved = await Promise.all(
    requests.map(async (r) => ({
      ...r,
      product: r.product
        ? { ...r.product, imageUrl: await buildAssetUrl(r.product.imageUrl) }
        : r.product,
    })),
  );

  return jsonResponse({ requests: resolved, total, page, totalPages: Math.ceil(total / limit) });
});

export const POST = withErrorHandler(async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["CUSTOMER", "ADMIN"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { productId, productName, quantity, customerNote, selectedOptions } = body;

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
      selectedOptions: selectedOptions || null,
    },
    include: {
      customer: { select: { id: true, fullName: true, email: true } },
    },
  });

  // Await all notifications so PM2/Windows doesn't kill the process before email finishes
  await Promise.allSettled([
    // Notify admins
    prisma.user.findMany({ where: { role: "ADMIN" } }).then(async (admins) => {
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          title: "Yêu cầu mua hàng mới",
          message: `${salesRequest.customer.fullName} yêu cầu mua "${resolvedProductName}" (${salesRequest.requestCode}).`,
        }).catch(() => {});
      }
    }),
    // Notify customer via all channels including EMAIL
    onSalesRequestCreated({
      userId: salesRequest.customerId,
      userEmail: salesRequest.customer.email || undefined,
      userName: salesRequest.customer.fullName || "bạn",
      requestCode: salesRequest.requestCode,
      productName: resolvedProductName || "Sản phẩm",
      quantity: salesRequest.quantity || 1,
      estimatedTotal: estimatedTotal != null ? estimatedTotal : undefined,
      channels: ["SYSTEM", "EMAIL", "TELEGRAM", "ZALO"],
    }),
  ]).catch((err) => {
    console.error("[notifications] sales-request creation notifications failed:", err);
  });

  return jsonResponse(salesRequest, 201);
});
