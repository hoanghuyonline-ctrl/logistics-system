export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";
import { onCustomerIssueCreated } from "@/lib/notifications";

const ISSUE_TYPES = [
  "THIEU_HANG",
  "GIAO_CHAM",
  "SAI_CAN",
  "HONG_HANG",
  "CHUA_NHAN",
  "PHI_SAI",
  "CHATBOT",
  "KHAC",
] as const;

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["CUSTOMER"])) {
    return errorResponse("Forbidden", 403);
  }

  const issues = await prisma.customerIssue.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return jsonResponse(issues);
});

export const POST = withErrorHandler(async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["CUSTOMER"])) {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { orderCode, issueType, description } = body as {
    orderCode?: string;
    issueType: string;
    description: string;
  };

  if (!issueType || !description) {
    return errorResponse("Vui lòng nhập đầy đủ thông tin", 400);
  }

  if (!ISSUE_TYPES.includes(issueType as (typeof ISSUE_TYPES)[number])) {
    return errorResponse("Loại khiếu nại không hợp lệ", 400);
  }

  if (orderCode) {
    const order = await prisma.order.findFirst({
      where: { orderCode, userId: user.id },
    });
    if (!order) {
      return errorResponse("Không tìm thấy đơn hàng", 404);
    }
  }

  const issue = await prisma.customerIssue.create({
    data: {
      customerId: user.id,
      orderCode: orderCode || null,
      issueType,
      description,
    },
  });

  onCustomerIssueCreated({
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    issueType,
    orderCode: orderCode || undefined,
  }).catch((err: unknown) => {
    console.error("[notify] onCustomerIssueCreated failed:", err);
  });

  return jsonResponse(issue, 201);
});
