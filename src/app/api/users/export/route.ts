export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, errorResponse, withErrorHandler } from "@/lib/utils";
import * as XLSX from "xlsx";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Quản trị viên",
  CUSTOMER: "Khách hàng",
  WAREHOUSE_CN: "Kho Trung Quốc",
  WAREHOUSE_VN: "Kho Việt Nam",
  ACCOUNTANT: "Kế toán",
  STAFF: "Nhân viên",
};

export const GET = withErrorHandler(async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "STAFF"])) {
    return errorResponse("Forbidden", 403);
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      fullName: true,
      email: true,
      phone: true,
      address: true,
      role: true,
      isActive: true,
      wallet: { select: { balance: true } },
    },
  });

  const rows = users.map((u: { fullName: string; email: string; phone: string | null; address: string | null; role: string; isActive: boolean; wallet: { balance: unknown } | null }) => ({
    "Họ tên": u.fullName,
    Email: u.email,
    "Số điện thoại": u.phone || "",
    "Địa chỉ": u.address || "",
    "Vai trò": ROLE_LABELS[u.role] || u.role,
    "Số dư": u.wallet ? Number(u.wallet.balance) : 0,
    "Trạng thái": u.isActive ? "Đang hoạt động" : "Đã khóa",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Users");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const today = new Date().toISOString().slice(0, 10);
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="users-export-${today}.xlsx"`,
    },
  });
});
