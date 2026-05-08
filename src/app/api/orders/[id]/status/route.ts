import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, jsonResponse, errorResponse } from "@/lib/utils";
import { ORDER_STATUS_TRANSITIONS } from "@/types";
import { notifyOrderStatusChange } from "@/lib/notifications";
import { onShipmentStatusChanged } from "@/lib/notifications/triggers";
import { InvalidTransitionError, toShipmentStatus, isValidTransition } from "@/lib/shipment-status";
import { OrderStatus } from "@prisma/client";
import type { NextRequest } from "next/server";
import { auditLog } from "@/lib/audit";

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/orders/[id]/status">) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "WAREHOUSE_CN", "WAREHOUSE_VN"])) {
    return errorResponse("Forbidden", 403);
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const { status, note } = body;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return errorResponse("Order not found", 404);

  // Validate via centralized ShipmentStatus transitions first
  const fromShipment = toShipmentStatus(order.status);
  const toShipment = toShipmentStatus(status as OrderStatus);
  if (!isValidTransition(fromShipment, toShipment)) {
    // Fall back to legacy OrderStatus transitions for finer-grained
    // statuses (e.g. PENDING → PURCHASED) that the ShipmentStatus
    // layer intentionally collapses.
    const allowed = ORDER_STATUS_TRANSITIONS[order.status];
    if (!allowed.includes(status as OrderStatus)) {
      return errorResponse(`Cannot transition from ${order.status} to ${status}`);
    }
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: status as OrderStatus,
      statusLogs: {
        create: {
          fromStatus: order.status,
          toStatus: status as OrderStatus,
          changedBy: user.id,
          note,
        },
      },
    },
  });

  if (status === "COMPLETED") {
    const wallet = await prisma.wallet.findUnique({ where: { userId: order.userId } });
    if (wallet) {
      const cost = parseFloat(order.totalCostVND.toString());
      const currentBalance = parseFloat(wallet.balance.toString());
      const newBalance = currentBalance - cost;

      const currentDebt = parseFloat(wallet.debt.toString());
      const newDebt = newBalance < 0 ? currentDebt + Math.abs(newBalance) : currentDebt;

      await prisma.wallet.update({
        where: { userId: order.userId },
        data: { balance: newBalance < 0 ? 0 : newBalance, debt: newDebt },
      });

      await prisma.transaction.create({
        data: {
          userId: order.userId,
          type: "ORDER_PAYMENT",
          amount: -cost,
          balanceBefore: currentBalance,
          balanceAfter: newBalance < 0 ? 0 : newBalance,
          orderId: order.id,
          description: `Thanh toán đơn hàng ${order.orderCode}`,
          createdBy: user.id,
        },
      });
    }
  }

  if (status === "CANCELLED" && order.status !== "PENDING") {
    const payments = await prisma.transaction.findMany({
      where: { orderId: order.id, type: "ORDER_PAYMENT" },
    });

    if (payments.length > 0) {
      const wallet = await prisma.wallet.findUnique({ where: { userId: order.userId } });
      if (wallet) {
        const refundAmount = payments.reduce((sum, p) => sum + Math.abs(parseFloat(p.amount.toString())), 0);
        const currentBalance = parseFloat(wallet.balance.toString());

        await prisma.wallet.update({
          where: { userId: order.userId },
          data: { balance: currentBalance + refundAmount },
        });

        await prisma.transaction.create({
          data: {
            userId: order.userId,
            type: "REFUND",
            amount: refundAmount,
            balanceBefore: currentBalance,
            balanceAfter: currentBalance + refundAmount,
            orderId: order.id,
            description: `Hoàn tiền đơn hàng đã hủy ${order.orderCode}`,
            createdBy: user.id,
          },
        });
      }
    }
  }

  auditLog({
    action: "ORDER_STATUS_CHANGE",
    actorId: user.id,
    actorEmail: user.email || "",
    actorRole: user.role,
    entityType: "order",
    entityId: order.id,
    entityCode: order.orderCode,
    details: { fromStatus: order.status, toStatus: status },
  });

  await notifyOrderStatusChange(order.userId, order.id, order.orderCode, status);

  prisma.user
    .findUnique({ where: { id: order.userId }, select: { email: true, fullName: true } })
    .then((orderUser) =>
      onShipmentStatusChanged({
        userId: order.userId,
        userEmail: orderUser?.email,
        userName: orderUser?.fullName,
        orderId: order.id,
        orderCode: order.orderCode,
        fromStatus: order.status,
        toStatus: status,
      }),
    )
    .catch((err) => {
      console.error("[notifications] onShipmentStatusChanged failed:", err);
    });

  return jsonResponse(updated);
}
