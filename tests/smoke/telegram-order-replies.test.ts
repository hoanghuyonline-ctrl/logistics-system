import { describe, it, expect } from "vitest";

/**
 * Tests for Telegram order lookup reply formatting logic.
 * These mirror the exact formatting from handleOrderLookup()
 * in src/app/api/telegram/webhook/route.ts without DB or HTTP.
 */

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Đang chờ xử lý",
  PURCHASED: "Đã đặt mua",
  SELLER_SHIPPED: "Shop đã gửi hàng",
  ARRIVED_CHINA_WH: "Đã tới kho Trung Quốc",
  PACKING: "Đang đóng gói tại kho",
  SHIPPING_TO_VIETNAM: "Đang trên đường về Việt Nam",
  ARRIVED_VIETNAM_WH: "Đã tới kho Việt Nam",
  OUT_FOR_DELIVERY: "Đang giao đến bạn",
  COMPLETED: "Đã giao thành công",
  CANCELLED: "Đã huỷ",
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

interface OrderData {
  orderCode: string;
  status: string;
  weightKg: number | null;
  totalCostVND: number;
}

function formatOrderReply(order: OrderData): string {
  const lines: string[] = [
    `📦 Đơn hàng: <code>${order.orderCode}</code>`,
    `📌 Trạng thái: <b>${statusLabel(order.status)}</b>`,
  ];

  if (order.weightKg !== null && order.weightKg !== undefined) {
    lines.push(`⚖️ Khối lượng: ${Number(order.weightKg)}kg`);
  }

  const cost = Number(order.totalCostVND);
  if (cost > 0) {
    lines.push(`💰 Tổng tiền: ${cost.toLocaleString("vi-VN")}đ`);
  }

  lines.push("", "Cảm ơn quý khách đã sử dụng Bắc Trung Hải Logistics.");

  return lines.join("\n");
}

function formatNotFoundReply(): string {
  return (
    "Không tìm thấy đơn hàng với mã này.\n\n" +
    "Vui lòng kiểm tra lại mã đơn hàng, ví dụ:\n" +
    "<code>BTH123456</code>\n\n" +
    "Nếu mã đúng nhưng vẫn không tra được, vui lòng liên hệ Bắc Trung Hải Logistics để được hỗ trợ."
  );
}

describe("Telegram order lookup reply formatting", () => {
  it("formats successful order with all fields", () => {
    const reply = formatOrderReply({
      orderCode: "BTH123456",
      status: "SHIPPING_TO_VIETNAM",
      weightKg: 2.5,
      totalCostVND: 1250000,
    });

    expect(reply).toContain("BTH123456");
    expect(reply).toContain("Đang trên đường về Việt Nam");
    expect(reply).toContain("2.5kg");
    expect(reply).toContain("đ");
    expect(reply).toContain("Cảm ơn quý khách");
  });

  it("omits weight when null", () => {
    const reply = formatOrderReply({
      orderCode: "ORD-20260505-K1L2",
      status: "PENDING",
      weightKg: null,
      totalCostVND: 500000,
    });

    expect(reply).toContain("ORD-20260505-K1L2");
    expect(reply).toContain("Đang chờ xử lý");
    expect(reply).not.toContain("Khối lượng");
    expect(reply).toContain("đ");
  });

  it("omits cost when zero", () => {
    const reply = formatOrderReply({
      orderCode: "BTH999",
      status: "ARRIVED_CHINA_WH",
      weightKg: 1.2,
      totalCostVND: 0,
    });

    expect(reply).toContain("1.2kg");
    expect(reply).not.toContain("Tổng tiền");
    expect(reply).toContain("Đã tới kho Trung Quốc");
  });

  it("handles missing weight and zero cost gracefully", () => {
    const reply = formatOrderReply({
      orderCode: "BTH000",
      status: "COMPLETED",
      weightKg: null,
      totalCostVND: 0,
    });

    expect(reply).toContain("BTH000");
    expect(reply).toContain("Đã giao thành công");
    expect(reply).not.toContain("Khối lượng");
    expect(reply).not.toContain("Tổng tiền");
    expect(reply).toContain("Cảm ơn quý khách");
  });

  it("falls back to raw status for unknown enum values", () => {
    const reply = formatOrderReply({
      orderCode: "BTH111",
      status: "SOME_NEW_STATUS",
      weightKg: null,
      totalCostVND: 100000,
    });

    expect(reply).toContain("SOME_NEW_STATUS");
  });
});

describe("Telegram order not found reply", () => {
  it("includes order code example and support instruction", () => {
    const reply = formatNotFoundReply();

    expect(reply).toContain("Không tìm thấy đơn hàng");
    expect(reply).toContain("BTH123456");
    expect(reply).toContain("Bắc Trung Hải Logistics");
    expect(reply).toContain("hỗ trợ");
  });
});
