/**
 * Professional HTML email templates for order lifecycle notifications.
 * Follows international e-commerce standards (DHL/Amazon/FedEx style).
 * All text in Vietnamese (default locale).
 * @version 2.0.0 — Pro edition with bulletproof parameter fallbacks
 */

const BRAND_COLOR = "#1a56db";
const BRAND_ACCENT = "#f97316";

function getSiteUrl(): string {
  return (process.env.APP_DOMAIN || process.env.NEXTAUTH_URL || "https://thue.eu.cc").replace(/\/+$/, "");
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  // Buying request (Order) statuses
  PENDING: { bg: "#eff6ff", text: "#1e40af", label: "Đang chờ xử lý" },
  PURCHASED: { bg: "#f0fdf4", text: "#166534", label: "Đã đặt mua" },
  SELLER_SHIPPED: { bg: "#fefce8", text: "#854d0e", label: "Shop đã gửi hàng" },
  ARRIVED_CHINA_WH: { bg: "#fff7ed", text: "#9a3412", label: "Đã tới kho Trung Quốc" },
  PACKING: { bg: "#faf5ff", text: "#7e22ce", label: "Đang đóng gói tại kho" },
  SHIPPING_TO_VIETNAM: { bg: "#eff6ff", text: "#1d4ed8", label: "Đang trên đường về Việt Nam" },
  ARRIVED_VIETNAM_WH: { bg: "#ecfdf5", text: "#065f46", label: "Đã tới kho Việt Nam" },
  OUT_FOR_DELIVERY: { bg: "#fff1f2", text: "#be123c", label: "Đang giao đến bạn" },
  COMPLETED: { bg: "#f0fdf4", text: "#15803d", label: "Đã giao thành công" },
  CANCELLED: { bg: "#fef2f2", text: "#991b1b", label: "Đã huỷ" },
  // Sales request statuses
  NEW: { bg: "#eff6ff", text: "#1e40af", label: "Mới" },
  CONTACTED: { bg: "#fefce8", text: "#854d0e", label: "Đã liên hệ" },
  PRICE_CONFIRMED: { bg: "#faf5ff", text: "#7e22ce", label: "Đã xác nhận giá" },
  PAID: { bg: "#f0fdf4", text: "#166534", label: "Đã thanh toán" },
  PROCESSING: { bg: "#fff7ed", text: "#9a3412", label: "Đang xử lý" },
};

function getStatusInfo(status: string) {
  return STATUS_COLORS[status] || { bg: "#f1f5f9", text: "#475569", label: status };
}

function safeNum(val: unknown): number {
  if (val == null) return 0;
  const n = typeof val === "number" ? val : Number(val);
  return Number.isFinite(n) ? n : 0;
}

function fmtVND(amount: unknown): string {
  return safeNum(amount).toLocaleString("vi-VN") + " ₫";
}

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bắc Trung Hải Logistics</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

<!-- Header -->
<tr>
<td style="background:linear-gradient(135deg,${BRAND_COLOR},#2563eb);padding:28px 32px;text-align:center;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="text-align:center;">
<img src="${getSiteUrl()}/logo.jpg" alt="Bắc Trung Hải Logistics" style="max-height:40px;width:auto;display:inline-block;vertical-align:middle;margin-right:10px;" />
<span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;vertical-align:middle;">Bắc Trung Hải Logistics</span>
</td>
</tr>
<tr>
<td style="text-align:center;padding-top:6px;">
<span style="font-size:12px;color:rgba(255,255,255,0.8);letter-spacing:1px;text-transform:uppercase;">Dịch vụ vận chuyển quốc tế uy tín</span>
</td>
</tr>
</table>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:32px;">
${content}
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background-color:#f8fafc;padding:24px 32px;border-top:1px solid #e2e8f0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="text-align:center;padding-bottom:12px;">
<a href="${getSiteUrl()}" style="color:${BRAND_COLOR};font-size:13px;text-decoration:none;font-weight:600;">thue.eu.cc</a>
</td>
</tr>
<tr>
<td style="text-align:center;font-size:12px;color:#94a3b8;line-height:1.6;">
Công ty TNHH Bắc Trung Hải Logistics<br>
Email hỗ trợ: support@thue.eu.cc | Hotline: 0899.123.456<br>
Đây là email tự động — vui lòng không trả lời trực tiếp.
</td>
</tr>
<tr>
<td style="text-align:center;padding-top:12px;font-size:11px;color:#cbd5e1;">
© ${new Date().getFullYear()} Bắc Trung Hải Logistics. All rights reserved.
</td>
</tr>
</table>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function statusBadge(status: string): string {
  const info = getStatusInfo(status);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0">
<tr>
<td style="background-color:${info.bg};color:${info.text};font-size:16px;font-weight:700;padding:12px 28px;border-radius:8px;border:2px solid ${info.text}20;letter-spacing:0.3px;">
${info.label}
</td>
</tr>
</table>
</td></tr>
</table>`;
}

function ctaButton(text: string, url: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td align="center">
<a href="${url}" target="_blank" style="display:inline-block;background-color:${BRAND_ACCENT};color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
${text}
</a>
</td></tr>
</table>`;
}

function greeting(name: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.6;">Xin chào <strong>${name}</strong>,</p>`;
}

function orderRow(label: string, value: string, highlight = false): string {
  return `<tr>
<td style="padding:10px 14px;font-size:13px;color:#64748b;border-bottom:1px solid #f1f5f9;width:40%;">${label}</td>
<td style="padding:10px 14px;font-size:13px;color:${highlight ? BRAND_ACCENT : "#1e293b"};font-weight:${highlight ? "700" : "500"};border-bottom:1px solid #f1f5f9;">${value}</td>
</tr>`;
}

function orderTable(rows: Array<{ label: string; value: string; highlight?: boolean }>): string {
  const rowsHtml = rows.map((r) => orderRow(r.label, r.value, r.highlight)).join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
<tr>
<td colspan="2" style="background-color:#f8fafc;padding:12px 14px;font-size:14px;font-weight:700;color:#1e293b;border-bottom:1px solid #e2e8f0;">
📋 Chi tiết đơn hàng
</td>
</tr>
${rowsHtml}
</table>`;
}

// ─── Public template builders ───────────────────────────────────────

export function orderCreatedEmail(params: {
  userName?: string;
  orderCode?: string;
  productName?: string;
  quantity?: number;
  unitPriceCNY?: number;
  exchangeRate?: number;
  totalCostVND?: number;
}): string {
  const name = params.userName || "bạn";
  const code = params.orderCode || "N/A";
  const product = params.productName || "Sản phẩm";
  const qty = safeNum(params.quantity) || 1;
  const unitCNY = safeNum(params.unitPriceCNY);
  const rate = safeNum(params.exchangeRate) || 3500;
  const total = safeNum(params.totalCostVND);

  const rows = [
    { label: "Mã đơn hàng", value: `<strong>${code}</strong>` },
    { label: "Sản phẩm", value: product },
    { label: "Số lượng", value: String(qty) },
    { label: "Đơn giá (CNY)", value: `¥${unitCNY.toLocaleString("vi-VN")}` },
    { label: "Tỷ giá", value: `1 CNY = ${fmtVND(rate)}` },
    { label: "Tổng chi phí (ước tính)", value: fmtVND(total), highlight: true },
  ];

  const content = `
${greeting(name)}
<p style="margin:0 0 8px;font-size:15px;color:#334155;line-height:1.6;">
Đơn hàng <strong>${code}</strong> đã được tiếp nhận và đang xử lý. Chúng tôi sẽ cập nhật tiến trình ngay khi có thông tin mới.
</p>
${statusBadge("PENDING")}
${orderTable(rows)}
${ctaButton("Xem tiến độ đơn hàng", `${getSiteUrl()}/orders`)}
<p style="margin:16px 0 0;font-size:12px;color:#94a3b8;line-height:1.5;">
Chi phí trên là ước tính ban đầu. Chi phí cuối cùng sẽ được xác nhận sau khi đơn hàng được xử lý hoàn tất.
</p>`;

  return baseLayout(content);
}

export function orderStatusChangedEmail(params: {
  userName?: string;
  orderCode?: string;
  productName?: string;
  fromStatus?: string;
  toStatus?: string;
  totalCostVND?: number;
}): string {
  const name = params.userName || "bạn";
  const code = params.orderCode || "N/A";
  const product = params.productName || "Sản phẩm";
  const from = params.fromStatus || "PENDING";
  const to = params.toStatus || "PENDING";
  const fromInfo = getStatusInfo(from);
  const rows: Array<{ label: string; value: string; highlight?: boolean }> = [
    { label: "Mã đơn hàng", value: `<strong>${code}</strong>` },
    { label: "Sản phẩm", value: product },
    { label: "Trạng thái trước", value: fromInfo.label },
  ];
  const totalCost = safeNum(params.totalCostVND);
  if (totalCost > 0) {
    rows.push({ label: "Tổng chi phí", value: fmtVND(totalCost), highlight: true });
  }

  let contextMessage = "";
  switch (to) {
    case "PURCHASED":
      contextMessage = "Đơn hàng của bạn đã được đặt mua thành công từ người bán. Chúng tôi đang chờ hàng về kho.";
      break;
    case "SELLER_SHIPPED":
      contextMessage = "Người bán đã gửi hàng. Đơn hàng đang trên đường đến kho Trung Quốc của chúng tôi.";
      break;
    case "ARRIVED_CHINA_WH":
      contextMessage = "Đơn hàng đã tới kho Trung Quốc an toàn. Chúng tôi sẽ cân, kiểm tra và chuẩn bị đóng gói.";
      break;
    case "PACKING":
      contextMessage = "Đơn hàng đang được đóng gói tại kho để chuẩn bị vận chuyển quốc tế về Việt Nam.";
      break;
    case "SHIPPING_TO_VIETNAM":
      contextMessage = "Đơn hàng đã lên đường về Việt Nam! Thời gian vận chuyển dự kiến 3–7 ngày làm việc.";
      break;
    case "ARRIVED_VIETNAM_WH":
      contextMessage = "Đơn hàng đã tới kho Việt Nam. Chúng tôi sẽ sắp xếp giao hàng đến bạn trong thời gian sớm nhất.";
      break;
    case "OUT_FOR_DELIVERY":
      contextMessage = "Đơn hàng đang được giao đến địa chỉ của bạn. Vui lòng giữ điện thoại để nhận hàng.";
      break;
    case "COMPLETED":
      contextMessage = "Đơn hàng đã giao thành công! Cảm ơn bạn đã sử dụng dịch vụ Bắc Trung Hải Logistics.";
      break;
    case "CANCELLED":
      contextMessage = "Đơn hàng đã bị huỷ. Nếu bạn cần hỗ trợ, vui lòng liên hệ chúng tôi.";
      break;
    default:
      contextMessage = `Trạng thái đơn hàng đã được cập nhật.`;
  }

  const content = `
${greeting(name)}
<p style="margin:0 0 8px;font-size:15px;color:#334155;line-height:1.6;">
Đơn hàng <strong>${code}</strong> vừa được cập nhật trạng thái:
</p>
${statusBadge(to)}
<p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;background-color:#f8fafc;padding:14px 18px;border-radius:8px;border-left:4px solid ${BRAND_COLOR};">
${contextMessage}
</p>
${orderTable(rows)}
${ctaButton("Xem tiến độ đơn hàng", `${getSiteUrl()}/orders`)}`;

  return baseLayout(content);
}

export function salesRequestCreatedEmail(params: {
  userName?: string;
  requestCode?: string;
  productName?: string;
  quantity?: number;
  estimatedTotal?: number;
}): string {
  const name = params.userName || "bạn";
  const code = params.requestCode || "N/A";
  const product = params.productName || "Sản phẩm";
  const qty = safeNum(params.quantity) || 1;
  const estimated = safeNum(params.estimatedTotal);

  const rows: Array<{ label: string; value: string; highlight?: boolean }> = [
    { label: "Mã yêu cầu", value: `<strong>${code}</strong>` },
    { label: "Sản phẩm", value: product },
    { label: "Số lượng", value: String(qty) },
  ];
  if (estimated > 0) {
    rows.push({ label: "Tổng ước tính", value: fmtVND(estimated), highlight: true });
  }

  const content = `
${greeting(name)}
<p style="margin:0 0 8px;font-size:15px;color:#334155;line-height:1.6;">
Yêu cầu mua hàng <strong>${code}</strong> đã được tiếp nhận. Nhân viên của chúng tôi sẽ liên hệ và xác nhận giá trong thời gian sớm nhất.
</p>
${statusBadge("NEW")}
${orderTable(rows)}
${ctaButton("Xem đơn mua hàng", `${getSiteUrl()}/shop/requests`)}
<p style="margin:16px 0 0;font-size:12px;color:#94a3b8;line-height:1.5;">
Giá cuối cùng sẽ được xác nhận bởi nhân viên. Bạn sẽ nhận thông báo khi giá được duyệt.
</p>`;

  return baseLayout(content);
}

export function salesRequestStatusChangedEmail(params: {
  userName?: string;
  requestCode?: string;
  productName?: string;
  newStatus?: string;
  confirmedPrice?: number;
  amountPaid?: number;
}): string {
  const name = params.userName || "bạn";
  const code = params.requestCode || "N/A";
  const product = params.productName || "Sản phẩm";
  const status = params.newStatus || "NEW";
  const price = safeNum(params.confirmedPrice);
  const paid = safeNum(params.amountPaid);

  const rows: Array<{ label: string; value: string; highlight?: boolean }> = [
    { label: "Mã yêu cầu", value: `<strong>${code}</strong>` },
    { label: "Sản phẩm", value: product },
  ];
  if (price > 0) {
    rows.push({ label: "Giá xác nhận", value: fmtVND(price), highlight: true });
  }
  if (paid > 0) {
    rows.push({ label: "Đã thanh toán", value: fmtVND(paid), highlight: true });
  }

  let contextMessage = "";
  switch (status) {
    case "CONTACTED":
      contextMessage = "Nhân viên đã liên hệ về yêu cầu của bạn. Vui lòng kiểm tra tin nhắn hoặc email để biết thêm chi tiết.";
      break;
    case "PRICE_CONFIRMED":
      contextMessage = `Giá đã được xác nhận: <strong>${price > 0 ? fmtVND(price) : "(đang cập nhật)"}</strong>. Vui lòng vào hệ thống để thanh toán từ ví hoặc chọn COD.`;
      break;
    case "PAID":
      contextMessage = "Thanh toán thành công! Chúng tôi sẽ bắt đầu xử lý đơn hàng của bạn ngay.";
      break;
    case "PROCESSING":
      contextMessage = "Đơn hàng đang được xử lý. Chúng tôi sẽ cập nhật khi có tiến triển mới.";
      break;
    case "COMPLETED":
      contextMessage = "Đơn hàng đã hoàn thành! Cảm ơn bạn đã sử dụng dịch vụ Bắc Trung Hải Logistics.";
      break;
    case "CANCELLED":
      contextMessage = "Yêu cầu mua hàng đã bị huỷ. Nếu có hoàn tiền, số tiền đã được trả về ví. Liên hệ hỗ trợ nếu cần.";
      break;
    default:
      contextMessage = "Trạng thái yêu cầu mua hàng đã được cập nhật.";
  }

  const content = `
${greeting(name)}
<p style="margin:0 0 8px;font-size:15px;color:#334155;line-height:1.6;">
Yêu cầu mua hàng <strong>${code}</strong> — "${product}" vừa được cập nhật:
</p>
${statusBadge(status)}
<p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;background-color:#f8fafc;padding:14px 18px;border-radius:8px;border-left:4px solid ${BRAND_ACCENT};">
${contextMessage}
</p>
${orderTable(rows)}
${ctaButton("Xem đơn mua hàng", `${getSiteUrl()}/shop/requests`)}`;

  return baseLayout(content);
}

export function pricingConfirmedEmail(params: {
  userName?: string;
  orderCode?: string;
  productName?: string;
  confirmedProductCost?: number;
  confirmedShippingCost?: number;
  confirmedServiceFee?: number;
  confirmedTotalCost?: number;
}): string {
  const name = params.userName || "bạn";
  const code = params.orderCode || "N/A";
  const product = params.productName || "Sản phẩm";
  const total = safeNum(params.confirmedTotalCost);

  const rows: Array<{ label: string; value: string; highlight?: boolean }> = [
    { label: "Mã đơn hàng", value: `<strong>${code}</strong>` },
    { label: "Sản phẩm", value: product },
  ];
  if (safeNum(params.confirmedProductCost) > 0) {
    rows.push({ label: "Tiền hàng", value: fmtVND(params.confirmedProductCost) });
  }
  if (safeNum(params.confirmedShippingCost) > 0) {
    rows.push({ label: "Phí vận chuyển", value: fmtVND(params.confirmedShippingCost) });
  }
  if (safeNum(params.confirmedServiceFee) > 0) {
    rows.push({ label: "Phí dịch vụ", value: fmtVND(params.confirmedServiceFee) });
  }
  rows.push({ label: "Chi phí cuối cùng", value: fmtVND(total), highlight: true });

  const content = `
${greeting(name)}
<p style="margin:0 0 8px;font-size:15px;color:#334155;line-height:1.6;">
Đơn hàng <strong>${code}</strong> đã được công ty xác nhận giá chính thức:
</p>
<p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;background-color:#f0fdf4;padding:14px 18px;border-radius:8px;border-left:4px solid #16a34a;">
Tổng chi phí cuối cùng: <strong style="color:#16a34a;">${fmtVND(total)}</strong>
</p>
${orderTable(rows)}
${ctaButton("Xem đơn hàng", `${getSiteUrl()}/orders`)}
<p style="margin:16px 0 0;font-size:12px;color:#94a3b8;line-height:1.5;">
Đây là chi phí chính thức sau khi công ty đã xác nhận. Số tiền sẽ được trừ từ ví khi đơn hàng hoàn tất.
</p>`;

  return baseLayout(content);
}

export function warehouseChangedEmail(params: {
  userName?: string;
  orderCode?: string;
  warehouseName?: string;
  warehouseAddress?: string;
}): string {
  const name = params.userName || "bạn";
  const code = params.orderCode || "N/A";
  const whName = params.warehouseName || "Kho Trung Quốc";
  const whAddress = params.warehouseAddress || "";

  const rows: Array<{ label: string; value: string; highlight?: boolean }> = [
    { label: "Mã đơn hàng", value: `<strong>${code}</strong>` },
    { label: "Kho nhận hàng", value: `<strong>${whName}</strong>`, highlight: true },
  ];
  if (whAddress) {
    rows.push({ label: "Địa chỉ kho", value: whAddress });
  }

  const content = `
${greeting(name)}
<p style="margin:0 0 8px;font-size:15px;color:#334155;line-height:1.6;">
Kho nhận hàng tại Trung Quốc cho đơn hàng <strong>${code}</strong> đã được cập nhật:
</p>
<p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;background-color:#eff6ff;padding:14px 18px;border-radius:8px;border-left:4px solid ${BRAND_COLOR};">
Kho mới: <strong>${whName}</strong>${whAddress ? `<br/>Địa chỉ: ${whAddress}` : ""}
</p>
${orderTable(rows)}
${ctaButton("Xem đơn hàng", `${getSiteUrl()}/orders`)}
<p style="margin:16px 0 0;font-size:12px;color:#94a3b8;line-height:1.5;">
Vui lòng sử dụng địa chỉ kho mới khi gửi hàng đến Trung Quốc.
</p>`;

  return baseLayout(content);
}

export function adminNewOrderAlertEmail(params: {
  adminName?: string;
  customerName?: string;
  orderCode?: string;
  productName?: string;
  quantity?: number;
  totalCostVND?: number;
  orderType?: "buying" | "shop";
}): string {
  const adminName = params.adminName || "Admin";
  const typeLabel = params.orderType === "buying" ? "Mua hộ Trung Quốc" : "Sẵn hàng VN";
  const code = params.orderCode || "N/A";
  const customer = params.customerName || "Khách hàng";
  const product = params.productName || "Sản phẩm";
  const qty = safeNum(params.quantity) || 1;
  const totalCost = safeNum(params.totalCostVND);

  const rows: Array<{ label: string; value: string; highlight?: boolean }> = [
    { label: "Loại đơn", value: typeLabel },
    { label: "Mã đơn", value: `<strong>${code}</strong>` },
    { label: "Khách hàng", value: customer },
    { label: "Sản phẩm", value: product },
    { label: "Số lượng", value: String(qty) },
  ];
  if (totalCost > 0) {
    rows.push({ label: "Tổng chi phí", value: fmtVND(totalCost), highlight: true });
  }

  const content = `
${greeting(adminName)}
<p style="margin:0 0 8px;font-size:15px;color:#334155;line-height:1.6;">
Có đơn hàng mới cần xử lý:
</p>
${orderTable(rows)}
${ctaButton("Quản lý đơn hàng", `${getSiteUrl()}/admin/${params.orderType === "buying" ? "orders" : "sales"}`)}`;

  return baseLayout(content);
}
