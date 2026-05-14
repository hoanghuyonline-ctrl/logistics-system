interface StatusInfo {
  description: string;
  nextStep: string;
  icon: string;
  delayWarning?: { days: number; message: string };
}

const STATUS_INFO: Record<string, StatusInfo> = {
  PENDING: {
    description: "Đơn hàng đã được tạo, đang chờ nhân viên mua hàng từ shop Trung Quốc.",
    nextStep: "Bước tiếp theo: nhân viên sẽ đặt mua và cập nhật trạng thái.",
    icon: "🕐",
    delayWarning: { days: 3, message: "Đơn chờ mua khá lâu. Liên hệ nhân viên để kiểm tra." },
  },
  PURCHASED: {
    description: "Nhân viên đã đặt mua hàng từ shop Trung Quốc. Đang chờ shop gửi hàng.",
    nextStep: "Bước tiếp theo: chờ người bán Trung Quốc gửi hàng đến kho TQ.",
    icon: "🛒",
    delayWarning: { days: 5, message: "Người bán TQ chưa gửi hàng. Nhân viên sẽ liên hệ shop." },
  },
  SELLER_SHIPPED: {
    description: "Shop Trung Quốc đã gửi hàng. Hàng đang trên đường đến kho Trung Quốc.",
    nextStep: "Bước tiếp theo: kho TQ sẽ nhận hàng, kiểm tra và cân.",
    icon: "📦",
  },
  ARRIVED_CHINA_WH: {
    description: "Hàng đã về đến kho Trung Quốc. Nhân viên đang kiểm tra, cân và đóng kiện.",
    nextStep: "Bước tiếp theo: hàng sẽ được đóng kiện và chuyển về Việt Nam.",
    icon: "🏭",
    delayWarning: { days: 5, message: "Hàng ở kho TQ khá lâu. Liên hệ để kiểm tra tình trạng đóng kiện." },
  },
  PACKING: {
    description: "Hàng đang được đóng kiện tại kho Trung Quốc, chuẩn bị xuất kho.",
    nextStep: "Bước tiếp theo: kiện hàng sẽ được xếp lên xe vận chuyển về Việt Nam.",
    icon: "📋",
  },
  SHIPPING_TO_VIETNAM: {
    description: "Hàng đang trên xe vận chuyển từ Trung Quốc về Việt Nam. Thời gian trung bình 3-7 ngày.",
    nextStep: "Bước tiếp theo: hàng về kho Việt Nam, quét mã và chuẩn bị giao.",
    icon: "🚛",
    delayWarning: { days: 10, message: "Vận chuyển lâu hơn bình thường. Có thể do tắc biên hoặc kẹt xe." },
  },
  ARRIVED_VIETNAM_WH: {
    description: "Hàng đã về kho Việt Nam! Nhân viên đang quét mã, kiểm tra và sắp xếp giao hàng.",
    nextStep: "Bước tiếp theo: hàng sẽ được giao đến địa chỉ của bạn.",
    icon: "🏠",
    delayWarning: { days: 3, message: "Hàng chờ giao khá lâu. Liên hệ để kiểm tra lịch giao." },
  },
  OUT_FOR_DELIVERY: {
    description: "Hàng đang được giao đến địa chỉ của bạn. Vui lòng giữ điện thoại để nhận hàng.",
    nextStep: "Bước tiếp theo: nhận hàng và kiểm tra sản phẩm.",
    icon: "🚚",
    delayWarning: { days: 2, message: "Giao hàng chậm hơn dự kiến. Liên hệ nhân viên giao hàng." },
  },
  COMPLETED: {
    description: "Đơn hàng đã hoàn tất! Cảm ơn bạn đã sử dụng dịch vụ Bắc Trung Hải Logistics.",
    nextStep: "Nếu có vấn đề về hàng hóa, vui lòng liên hệ nhân viên hỗ trợ.",
    icon: "✅",
  },
  CANCELLED: {
    description: "Đơn hàng đã bị hủy.",
    nextStep: "Nếu cần đặt lại, vui lòng tạo đơn mới hoặc liên hệ nhân viên.",
    icon: "❌",
  },
};

export function getStatusInfo(status: string): StatusInfo {
  return STATUS_INFO[status] || {
    description: "Đang cập nhật trạng thái.",
    nextStep: "",
    icon: "📌",
  };
}

export function getDelayWarning(status: string, updatedAt: string): string | null {
  const info = STATUS_INFO[status];
  if (!info?.delayWarning) return null;
  const days = Math.floor((Date.now() - new Date(updatedAt).getTime()) / (24 * 60 * 60 * 1000));
  if (days >= info.delayWarning.days) return info.delayWarning.message;
  return null;
}

const ALL_STATUSES = [
  "PENDING",
  "PURCHASED",
  "SELLER_SHIPPED",
  "ARRIVED_CHINA_WH",
  "PACKING",
  "SHIPPING_TO_VIETNAM",
  "ARRIVED_VIETNAM_WH",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
];

export function getProgressPercent(status: string): number {
  const idx = ALL_STATUSES.indexOf(status);
  if (idx === -1) return 0;
  return Math.round((idx / (ALL_STATUSES.length - 1)) * 100);
}

export function getProgressSteps(currentStatus: string) {
  return ALL_STATUSES.map((s, i) => {
    const currentIdx = ALL_STATUSES.indexOf(currentStatus);
    const info = STATUS_INFO[s];
    return {
      status: s,
      icon: info?.icon || "📌",
      completed: i <= currentIdx,
      current: i === currentIdx,
    };
  });
}
