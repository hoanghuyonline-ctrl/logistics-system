"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";
import { useAdminPolling, type QuickViewCounts } from "@/lib/useAdminPolling";
import { playAlertBeep, triggerVibration, isAlertEnabled, setAlertEnabled as persistAlertEnabled } from "@/lib/alertSound";
import KPICard from "@/components/ui/KPICard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Link from "next/link";

interface ForecastData {
  predictedRevenue: number;
  predictedExpense: number;
  netProfit: number;
  confidenceLevel: string;
}

interface StageData {
  count: number;
  anomaly: boolean;
}

interface FlowchartData {
  at_guangzhou_warehouse: StageData;
  at_nanning_transit: StageData;
  at_pingxiang_border: StageData;
  customs_cleared_at: StageData;
  at_vietnam_distribution: StageData;
}

interface TrendPoint {
  date: string;
  revenue: number;
  expense: number;
}

interface ExpenseBreakdown {
  loadingCnFee: number;
  borderLiftingFee: number;
  customsClearanceFee: number;
  domesticFuelFee: number;
  otherFee: number;
}

interface DashboardData {
  totalOrders: number;
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  pendingOrders: number;
  inTransitOrders: number;
  totalCustomers: number;
  activeCustomers: number;
  pureServiceRevenueVND: number;
  totalOperatingExpenseVND: number;
  totalCustomerDebtVND: number;
  expenseBreakdown: ExpenseBreakdown;
  flowchart: FlowchartData;
  trendData: TrendPoint[];
  forecast: ForecastData;
  statusDistribution: Array<{ status: string; count: number }>;
}

interface QuickViewData {
  unpaidOrders: number;
  stuckChina: number;
  stuckVietnam: number;
  staleOrders: number;
  unresolvedIssues: number;
  notifFailures: number;
  unansweredQuestions: number;
  unresolvedNotes: number;
  pendingDeposits: number;
  newSalesRequests: number;
}

export default function AdminDashboard() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [quickViews, setQuickViews] = useState<QuickViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [alertEnabled, setAlertEnabledState] = useState(() => isAlertEnabled());
  const alertEnabledRef = useRef(alertEnabled);
  const prevDepositsRef = useRef<number | null>(null);

  // Chart state
  const [hoveredPoint, setHoveredPoint] = useState<TrendPoint | null>(null);

  const handlePollUpdate = useCallback((qv: QuickViewCounts) => {
    setQuickViews(qv);
    setLastRefreshed(new Date());
  }, []);

  useEffect(() => {
    alertEnabledRef.current = alertEnabled;
  }, [alertEnabled]);

  const toggleAlert = useCallback(() => {
    setAlertEnabledState((prev) => {
      const next = !prev;
      persistAlertEnabled(next);
      return next;
    });
  }, []);

  const handleAlerts = useCallback((alerts: Array<{ label: string; prev: number; next: number }>) => {
    let hasDepositAlert = false;
    for (const a of alerts) {
      const diff = a.next - a.prev;
      toast(`${a.label} (+${diff})`, "warning");
      if (a.label.includes("nạp tiền")) hasDepositAlert = true;
    }
    if (hasDepositAlert && alertEnabledRef.current) {
      playAlertBeep();
      triggerVibration();
    }
  }, [toast]);

  const { seedPrev } = useAdminPolling(handlePollUpdate, handleAlerts, 25000);

  const loadData = useCallback(async () => {
    let anySuccess = false;
    try {
      const [dashRes, qvRes] = await Promise.allSettled([
        fetch("/api/analytics/dashboard"),
        fetch("/api/admin/quick-views"),
      ]);
      if (dashRes.status === "fulfilled" && dashRes.value.ok) {
        const d = await dashRes.value.json();
        setData(d);
        anySuccess = true;
      }
      if (qvRes.status === "fulfilled" && qvRes.value.ok) {
        const qv = await qvRes.value.json();
        setQuickViews(qv);
        seedPrev(qv);
        prevDepositsRef.current = qv.pendingDeposits || 0;
        anySuccess = true;
      }
      if (!anySuccess) setError(true);
    } catch (err) {
      console.error("[admin/dashboard] load failed:", err);
      setError(true);
    } finally {
      setLoading(false);
      setLastRefreshed(new Date());
    }
  }, [seedPrev]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Export strategy report action
  const handleExportStrategyReport = useCallback(() => {
    if (!data) return;

    // Create a beautiful printable window matching the V15 clean format
    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) {
      toast("Không thể mở cửa sổ in. Vui lòng tắt chặn pop-up.", "error");
      return;
    }

    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Báo cáo Chiến lược Logistics Biên giới - Bắc Trung Hải</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
          .header { text-align: center; border-b: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; }
          .title { font-size: 20px; font-weight: 700; margin-top: 5px; color: #0f172a; }
          .meta { font-size: 12px; color: #64748b; margin-top: 5px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 15px; }
          .kpi-grid { display: grid; grid-template-cols: 1fr 1fr 1fr; gap: 15px; margin-bottom: 25px; }
          .kpi-card { border: 1px solid #e2e8f0; padding: 15px; rounded: 8px; background: #f8fafc; }
          .kpi-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; }
          .kpi-value { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 4px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .table th, .table td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 13px; }
          .table th { background: #f1f5f9; font-weight: 600; }
          .alert-box { border: 1px solid #fecaca; background: #fef2f2; color: #991b1b; padding: 12px; border-radius: 6px; font-size: 12px; margin-top: 15px; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Bắc Trung Hải Logistics</div>
          <div class="title">Báo Cáo Hoạt Động & Chiến Lược Vận Hành Biên Giới</div>
          <div class="meta">Xuất ngày: ${new Date().toLocaleString("vi-VN")} | Người xuất: QTV Hệ thống</div>
        </div>

        <div class="section">
          <div class="section-title">1. Chỉ số tài chính cốt lõi (30 ngày qua)</div>
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">Tiền Thực Thu (Doanh thu thuần)</div>
              <div class="kpi-value">${data.pureServiceRevenueVND.toLocaleString()} VND</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Tổng Chi Phí Hoạt Động</div>
              <div class="kpi-value">${data.totalOperatingExpenseVND.toLocaleString()} VND</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Tổng Công Nợ Đọng</div>
              <div class="kpi-value">${data.totalCustomerDebtVND.toLocaleString()} VND</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">2. Bóc tách chi phí vận hành biên giới - nội địa</div>
          <table class="table">
            <thead>
              <tr>
                <th>Hạng mục chi phí</th>
                <th>Tỷ lệ quy đổi</th>
                <th>Tổng chi phí (VND)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Phí bốc xếp kho Trung Quốc</td>
                <td>CNY → VND</td>
                <td>${data.expenseBreakdown.loadingCnFee.toLocaleString()} VND</td>
              </tr>
              <tr>
                <td>Phí nâng hạ bãi biên giới</td>
                <td>CNY → VND</td>
                <td>${data.expenseBreakdown.borderLiftingFee.toLocaleString()} VND</td>
              </tr>
              <tr>
                <td>Phí thông quan hải quan (Lạng Sơn)</td>
                <td>VND</td>
                <td>${data.expenseBreakdown.customsClearanceFee.toLocaleString()} VND</td>
              </tr>
              <tr>
                <td>Phí xăng dầu & phân phối nội địa</td>
                <td>VND</td>
                <td>${data.expenseBreakdown.domesticFuelFee.toLocaleString()} VND</td>
              </tr>
              <tr>
                <td>Phí phát sinh ngoài danh mục</td>
                <td>VND</td>
                <td>${data.expenseBreakdown.otherFee.toLocaleString()} VND</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">3. Trạng thái lưu lượng 5 chặng biên giới</div>
          <table class="table">
            <thead>
              <tr>
                <th>Chặng Vận Chuyển</th>
                <th>Sản lượng kiện hàng hiện tại</th>
                <th>Cảnh báo tắc biên</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Kho Quảng Châu (CN)</td>
                <td>${data.flowchart.at_guangzhou_warehouse.count} kiện</td>
                <td>${data.flowchart.at_guangzhou_warehouse.anomaly ? "⚠️ TẮC NGHẼN" : "Bình thường"}</td>
              </tr>
              <tr>
                <td>Trung chuyển Nam Ninh (CN)</td>
                <td>${data.flowchart.at_nanning_transit.count} kiện</td>
                <td>${data.flowchart.at_nanning_transit.anomaly ? "⚠️ TẮC NGHẼN" : "Bình thường"}</td>
              </tr>
              <tr>
                <td>Bãi Bằng Tường (Biên giới)</td>
                <td>${data.flowchart.at_pingxiang_border.count} kiện</td>
                <td>${data.flowchart.at_pingxiang_border.anomaly ? "⚠️ TẮC NGHẼN (>48h)" : "Bình thường"}</td>
              </tr>
              <tr>
                <td>Thông quan Cửa khẩu Lạng Sơn</td>
                <td>${data.flowchart.customs_cleared_at.count} kiện</td>
                <td>${data.flowchart.customs_cleared_at.anomaly ? "⚠️ CHẬM THÔNG QUAN" : "Bình thường"}</td>
              </tr>
              <tr>
                <td>Kho Phân phối Nội địa Việt Nam</td>
                <td>${data.flowchart.at_vietnam_distribution.count} kiện</td>
                <td>${data.flowchart.at_vietnam_distribution.anomaly ? "⚠️ Quá tải" : "Bình thường"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">4. Dự toán tài chính 7 ngày tới (Bộ não dự đoán AI)</div>
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">Dự kiến Doanh thu tuần mới</div>
              <div class="kpi-value" style="color: #16a34a">${data.forecast.predictedRevenue.toLocaleString()} VND</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Dự kiến Chi phí tuần mới</div>
              <div class="kpi-value" style="color: #dc2626">${data.forecast.predictedExpense.toLocaleString()} VND</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Dự kiến Lợi nhuận thuần ròng</div>
              <div class="kpi-value" style="color: #2563eb">${data.forecast.netProfit.toLocaleString()} VND</div>
            </div>
          </div>
          <div style="font-size: 11px; color: #64748b; font-style: italic;">
            *Độ tin cậy của thuật toán dự báo: <strong>${data.forecast.confidenceLevel}</strong> dựa trên trung bình trượt 30 ngày chặng biên giới.
          </div>
        </div>

        <div style="text-align: center; margin-top: 50px;">
          <button onclick="window.print()" style="padding: 10px 20px; font-weight: bold; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">
            🖨 In báo cáo ngay
          </button>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(reportHtml);
    printWindow.document.close();
  }, [data, toast]);

  if (loading) return <LoadingSpinner text={t("common.loading")} />;
  if (error || !data) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <span className="text-4xl">⚠️</span>
      <p className="text-sm text-slate-600">Không thể tải dữ liệu. Vui lòng thử lại.</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Tải lại</button>
    </div>
  );

  // Calculate expense ratio for KPI Warning Lights (Yellow Lamp)
  const expenseRatio = data.pureServiceRevenueVND > 0
    ? (data.totalOperatingExpenseVND / data.pureServiceRevenueVND) * 100
    : 0;
  const isExpenseLeaking = expenseRatio >= 70;

  // SVG Chart parameters for Cá Trê Há Miệng
  const chartHeight = 160;
  const chartWidth = 500;
  const padding = 20;
  const points = data.trendData;
  const maxVal = Math.max(...points.map((p) => Math.max(p.revenue, p.expense)), 1);

  // Compute SVG polyline points
  const revenuePointsStr = points
    .map((p, i) => {
      const x = padding + (i * (chartWidth - padding * 2)) / (points.length - 1);
      const y = chartHeight - padding - ((p.revenue / maxVal) * (chartHeight - padding * 2));
      return `${x},${y}`;
    })
    .join(" ");

  const expensePointsStr = points
    .map((p, i) => {
      const x = padding + (i * (chartWidth - padding * 2)) / (points.length - 1);
      const y = chartHeight - padding - ((p.expense / maxVal) * (chartHeight - padding * 2));
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.dashboard")}
        subtitle="Hệ thống Điều phối Vận tải & Quản trị Biên giới Việt - Trung"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAlert}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${alertEnabled
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                }`}
              title={alertEnabled ? "Tắt âm báo khi có nạp tiền mới" : "Bật âm báo khi có nạp tiền mới"}
            >
              <span>{alertEnabled ? "🔔" : "🔕"}</span>
              <span>{alertEnabled ? "Âm báo: Bật" : "Âm báo: Tắt"}</span>
            </button>

            <button
              onClick={handleExportStrategyReport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <span>📊</span>
              <span>XUẤT BÁO CÁO STRATEGY</span>
            </button>
          </div>
        }
      />

      {/* ═══ PROMINENT PENDING DEPOSIT BANNER ═══ */}
      {quickViews && quickViews.pendingDeposits > 0 && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse-slow">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <div className="text-sm font-bold text-red-800">
                Có yêu cầu nạp tiền mới
              </div>
              <div className="text-xs text-red-600">
                Nạp tiền chờ duyệt: <span className="font-bold text-red-800">{quickViews.pendingDeposits}</span> yêu cầu
              </div>
            </div>
          </div>
          <Link
            href="/admin/finance"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg shrink-0"
          >
            💳 Duyệt nạp tiền ngay
          </Link>
        </div>
      )}

      {/* ================= KHU VỰC 1: BỘ BA ĐÈN SỨC KHỎE (KPI CARDS) ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Đèn Xanh: Tiền Thực Thu */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/40 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-500" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">ĐÈN XANH</span>
            <span className="text-2xl">🟢</span>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-3">TIỀN THỰC THU (Doanh Thu Dịch Vụ Thuần)</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{data.pureServiceRevenueVND.toLocaleString()} <span className="text-xs font-normal">VND</span></p>
          <p className="text-[10px] text-emerald-700 font-medium mt-2">✓ Đã loại trừ 100% tiền COD của chủ hàng.</p>
        </div>

        {/* Đèn Vàng: Chi Phí */}
        <div className={`relative overflow-hidden border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group ${isExpenseLeaking
          ? "bg-gradient-to-br from-red-50 to-rose-50 border-red-300 animate-pulse-slow"
          : "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200"
          }`}>
          <div className={`absolute top-0 right-0 w-24 h-24 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-500 ${isExpenseLeaking ? "bg-red-100/40" : "bg-amber-100/40"
            }`} />
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isExpenseLeaking ? "text-red-800 bg-red-100" : "text-amber-800 bg-amber-100"
              }`}>
              {isExpenseLeaking ? "ĐÈN ĐỎ CẢNH BÁO" : "ĐÈN VÀNG"}
            </span>
            <span className="text-2xl">{isExpenseLeaking ? "🔴" : "🟡"}</span>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-3">CHI PHÍ VẬN HÀNH BIÊN GIỚI + NỘI ĐỊA</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{data.totalOperatingExpenseVND.toLocaleString()} <span className="text-xs font-normal">VND</span></p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex-1 bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full ${isExpenseLeaking ? "bg-red-600" : "bg-amber-500"}`}
                style={{ width: `${Math.min(expenseRatio, 100)}%` }}
              />
            </div>
            <span className={`text-[10px] font-bold ${isExpenseLeaking ? "text-red-700" : "text-amber-700"}`}>
              {expenseRatio.toFixed(1)}%
            </span>
          </div>
          {isExpenseLeaking && (
            <p className="text-[10px] text-red-600 font-bold mt-1.5">⚠️ NGUY HIỂM: Chi phí vượt ngưỡng 70% doanh thu!</p>
          )}
        </div>

        {/* Đèn Đỏ: Tiền Đọng (Công nợ) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-rose-50 to-red-50 border border-rose-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-100/40 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-500" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full uppercase tracking-wider">ĐÈN ĐỎ CÔNG NỢ</span>
            <span className="text-2xl">🔴</span>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-3">TIỀN ĐỌNG (Tổng Công Nợ Chủ Hàng/Đối Tác)</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{data.totalCustomerDebtVND.toLocaleString()} <span className="text-xs font-normal">VND</span></p>
          <p className="text-[10px] text-rose-700 font-medium mt-2">⚠ Cần siết nợ ví điện tử để tránh găm dòng tiền.</p>
        </div>
      </div>

      {/* ================= KHU VỰC 2: BẢN ĐỒ LUỒNG ĐỘNG CHỐNG GIAN LẬN ================= */}
      <Card
        title="Bản Đồ Luồng Động & Chống Gian Lận (Tuyến Trung - Việt)"
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 relative py-3">
          {/* Connector Line for Desktop */}
          <div className="hidden lg:block absolute top-1/2 left-4 right-4 h-1.5 bg-slate-100 -translate-y-1/2 z-0" />

          {/* Chặng 1: Kho Quảng Châu */}
          <div className="relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm z-10 flex lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">1</div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase">CHẶNG 1</div>
              <div className="text-xs font-bold text-slate-800 leading-tight">Kho Quảng Châu</div>
              <div className="text-lg font-black text-blue-600 mt-1">{data.flowchart.at_guangzhou_warehouse.count} <span className="text-xs font-medium text-slate-500">kiện</span></div>
            </div>
          </div>

          {/* Chặng 2: Trung chuyển Nam Ninh */}
          <div className="relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm z-10 flex lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-lg">2</div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase">CHẶNG 2</div>
              <div className="text-xs font-bold text-slate-800 leading-tight">Nội Địa Nam Ninh</div>
              <div className="text-lg font-black text-violet-600 mt-1">{data.flowchart.at_nanning_transit.count} <span className="text-xs font-medium text-slate-500">kiện</span></div>
            </div>
          </div>

          {/* Chặng 3: Bãi Bằng Tường - Hỗ trợ Anomaly Detection nhấp nháy Đỏ */}
          <div className={`relative rounded-xl p-4 shadow-sm z-10 flex lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-3 border ${data.flowchart.at_pingxiang_border.anomaly
            ? "bg-red-50/90 border-red-300 animate-pulse"
            : "bg-white border-slate-200"
            }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${data.flowchart.at_pingxiang_border.anomaly ? "bg-red-100 text-red-600" : "bg-amber-50 text-amber-600"
              }`}>3</div>
            <div>
              <div className="text-[11px] font-bold uppercase text-slate-400">CHẶNG 3</div>
              <div className="text-xs font-bold text-slate-800 leading-tight">Bãi Bằng Tường (CN)</div>
              <div className={`text-lg font-black mt-1 ${data.flowchart.at_pingxiang_border.anomaly ? "text-red-600" : "text-amber-600"}`}>
                {data.flowchart.at_pingxiang_border.count} <span className="text-xs font-medium text-slate-500">kiện</span>
              </div>
              {data.flowchart.at_pingxiang_border.anomaly && (
                <div className="text-[9px] font-bold text-red-600 animate-pulse mt-0.5">⚠️ TẮC BIÊN (&gt;48H)</div>
              )}
            </div>
          </div>

          {/* Chặng 4: Cửa khẩu Lạng Sơn (Thông quan) */}
          <div className={`relative rounded-xl p-4 shadow-sm z-10 flex lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-3 border ${data.flowchart.customs_cleared_at.anomaly
            ? "bg-red-50/90 border-red-300 animate-pulse"
            : "bg-white border-slate-200"
            }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${data.flowchart.customs_cleared_at.anomaly ? "bg-red-100 text-red-600" : "bg-cyan-50 text-cyan-600"
              }`}>4</div>
            <div>
              <div className="text-[11px] font-bold uppercase text-slate-400">CHẶNG 4</div>
              <div className="text-xs font-bold text-slate-800 leading-tight">Thông Quan Lạng Sơn</div>
              <div className={`text-lg font-black mt-1 ${data.flowchart.customs_cleared_at.anomaly ? "text-red-600" : "text-cyan-600"}`}>
                {data.flowchart.customs_cleared_at.count} <span className="text-xs font-medium text-slate-500">kiện</span>
              </div>
              {data.flowchart.customs_cleared_at.anomaly && (
                <div className="text-[9px] font-bold text-red-600 animate-pulse mt-0.5">⚠️ CHẬM THÔNG QUAN</div>
              )}
            </div>
          </div>

          {/* Chặng 5: Kho Việt Nam */}
          <div className="relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm z-10 flex lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">5</div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase">CHẶNG 5</div>
              <div className="text-xs font-bold text-slate-800 leading-tight">Kho Phân Phối VN</div>
              <div className="text-lg font-black text-emerald-600 mt-1">{data.flowchart.at_vietnam_distribution.count} <span className="text-xs font-medium text-slate-500">kiện</span></div>
            </div>
          </div>
        </div>
      </Card>

      {/* ================= KHU VỰC 3: BIỂU ĐỒ XU HƯỚNG "CÁ TRÊ HÁ MIỆNG" ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card
            title="Biểu Đồ Xu Hướng Dòng Tiền 'Cá Trê Há Miệng'"
          >
            <div className="flex flex-col items-center">
              {/* Premium Interactive Hand-drawn SVG Line Chart */}
              <div className="relative w-full">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                    const y = chartHeight - padding - r * (chartHeight - padding * 2);
                    return (
                      <line
                        key={i}
                        x1={padding}
                        y1={y}
                        x2={chartWidth - padding}
                        y2={y}
                        stroke="#f1f5f9"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                    );
                  })}

                  {/* Revenue Polyline (Green) */}
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={revenuePointsStr}
                    className="transition-all duration-500"
                  />

                  {/* Expense Polyline (Red) */}
                  <polyline
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={expensePointsStr}
                    className="transition-all duration-500"
                  />

                  {/* Dynamic Tooltip Dots */}
                  {points.map((p, i) => {
                    const x = padding + (i * (chartWidth - padding * 2)) / (points.length - 1);
                    const revY = chartHeight - padding - ((p.revenue / maxVal) * (chartHeight - padding * 2));
                    const expY = chartHeight - padding - ((p.expense / maxVal) * (chartHeight - padding * 2));

                    return (
                      <g
                        key={p.date}
                        className="cursor-pointer group"
                        onMouseEnter={() => setHoveredPoint(p)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      >
                        <circle cx={x} cy={revY} r="3" fill="#10b981" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        <circle cx={x} cy={expY} r="3" fill="#f43f5e" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        {/* Thin vertical locator bar */}
                        <line x1={x} y1={padding} x2={x} y2={chartHeight - padding} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" className="opacity-0 group-hover:opacity-60 transition-opacity" />
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Chart Legend & Interactive Tooltip HUD */}
              <div className="w-full flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1.5 rounded-full bg-emerald-500" />
                    <span>Doanh Thu Thuần</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1.5 rounded-full bg-rose-500" />
                    <span>Chi Phí Biên Giới</span>
                  </div>
                </div>

                {hoveredPoint ? (
                  <div className="bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded-lg flex items-center gap-3 animate-fade-in shadow-md">
                    <span className="font-bold text-slate-300">Ngày {hoveredPoint.date}</span>
                    <span className="text-emerald-400 font-bold">R: {hoveredPoint.revenue.toLocaleString()} VND</span>
                    <span className="text-rose-400 font-bold">E: {hoveredPoint.expense.toLocaleString()} VND</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Rê chuột lên điểm biểu đồ để xem chi tiết</span>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* ================= KHU VỰC 4: BỘ NÃO DỰ TOÁN TÀI CHÍNH ================= */}
        <div className="lg:col-span-1">
          <Card
            title="Dự Toán Dòng Tiền AI"
          >
            <p className="text-xs text-slate-500 mb-4 -mt-2">Dự báo 7 ngày tới dựa trên trung bình trượt biên giới</p>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">DỰ BÁO DOANH THU TUẦN MỚI</span>
                <p className="text-xl font-bold text-emerald-600 mt-0.5">+{data.forecast.predictedRevenue.toLocaleString()} <span className="text-xs font-medium">VND</span></p>
                <p className="text-[10px] text-slate-400 leading-tight mt-1">Ước tính sản lượng thông quan tăng +12% do phân luồng.</p>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase">DỰ BÁO CHI PHÍ TUẦN MỚI</span>
                <p className="text-xl font-bold text-rose-600 mt-0.5">-{data.forecast.predictedExpense.toLocaleString()} <span className="text-xs font-medium">VND</span></p>
                <p className="text-[10px] text-slate-400 leading-tight mt-1">Giảm thiểu -5% chi phí ngâm bãi biên giới.</p>
              </div>

              <div className="border-t border-slate-100 pt-3 bg-slate-50/50 -mx-5 px-5 py-3 rounded-b-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-600 uppercase">LỢI NHUẬN RÒNG DỰ TOÁN</span>
                  <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">CONFIDENCE: {data.forecast.confidenceLevel}</span>
                </div>
                <p className="text-2xl font-black text-blue-600 mt-1">{data.forecast.netProfit.toLocaleString()} <span className="text-xs font-semibold">VND</span></p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* QUICK OPERATIONAL QUICK-VIEWS */}
      {quickViews && (
        <Card title="Chỉ số hoạt động nhanh" action={<span className="inline-flex items-center gap-1.5 text-[10px] font-normal text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />{lastRefreshed ? `Cập nhật ${lastRefreshed.toLocaleTimeString("vi-VN")}` : "Tự động cập nhật"}</span>}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-2">
            {[
              { label: "Nạp tiền chờ xác nhận", count: quickViews.pendingDeposits, href: "/admin/finance", active: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100", accent: "text-emerald-700", icon: "💰", urgent: true },
              { label: "Đơn chờ xử lý", count: quickViews.unpaidOrders, href: "/admin/orders?status=PENDING", active: "bg-amber-50 border-amber-200 hover:bg-amber-100", accent: "text-amber-700", icon: "⏳", urgent: false },
              { label: "Kẹt kho TQ", count: quickViews.stuckChina, href: "/admin/stuck-shipments", active: "bg-red-50 border-red-200 hover:bg-red-100", accent: "text-red-700", icon: "🏭", urgent: true },
              { label: "Kẹt kho VN", count: quickViews.stuckVietnam, href: "/admin/stuck-shipments", active: "bg-orange-50 border-orange-200 hover:bg-orange-100", accent: "text-orange-700", icon: "🏠", urgent: true },
              { label: "Đơn chậm cập nhật", count: quickViews.staleOrders, href: "/admin/stuck-shipments", active: "bg-red-50 border-red-200 hover:bg-red-100", accent: "text-red-700", icon: "🐌", urgent: true },
              { label: "Khiếu nại chưa xử lý", count: quickViews.unresolvedIssues, href: "/admin/customer-issues?status=NEW", active: "bg-rose-50 border-rose-200 hover:bg-rose-100", accent: "text-rose-700", icon: "📋", urgent: true },
              { label: "Lỗi thông báo", count: quickViews.notifFailures, href: "/admin/notification-failures", active: "bg-red-50 border-red-200 hover:bg-red-100", accent: "text-red-700", icon: "🔔", urgent: true },
              { label: "Chatbot chưa trả lời", count: quickViews.unansweredQuestions, href: "/admin/support-knowledge", active: "bg-purple-50 border-purple-200 hover:bg-purple-100", accent: "text-purple-700", icon: "💬", urgent: true },
              { label: "Ghi chú bàn giao", count: quickViews.unresolvedNotes, href: "/admin/staff-notes", active: "bg-blue-50 border-blue-200 hover:bg-blue-100", accent: "text-blue-700", icon: "🔖", urgent: false },
              { label: "Yêu cầu mua hàng mới", count: quickViews.newSalesRequests, href: "/admin/sales", active: "bg-pink-50 border-pink-200 hover:bg-pink-100", accent: "text-pink-700", icon: "🛒", urgent: true },
            ].map((view) => {
              const hasItems = view.count > 0;
              const needsAttention = hasItems && view.urgent;
              return (
                <a
                  key={view.label}
                  href={view.href}
                  className={`relative flex items-center gap-3 p-3 rounded-xl border transition-colors ${hasItems
                    ? view.active
                    : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                    }`}
                >
                  {needsAttention && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                        {view.count}
                      </span>
                    </span>
                  )}
                  <span className="text-lg">{view.icon}</span>
                  <div className="min-w-0">
                    <div className={`text-base font-bold ${hasItems ? view.accent : "text-slate-400"}`}>
                      {view.count}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight truncate">{view.label}</div>
                  </div>
                </a>
              );
            })}
          </div>
        </Card>
      )}

      {/* Legacy Distribution summary to keep backward compatibility and full details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title={t("admin.orderStatusDistribution")}>
          <div className="space-y-4">
            {data.statusDistribution.map((s) => {
              const pct = data.totalOrders > 0 ? (s.count / data.totalOrders) * 100 : 0;
              const label = t(`status.${s.status}`, s.status.replace(/_/g, " "));
              return (
                <div key={s.status}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-600">{label}</span>
                    <span className="text-sm font-semibold text-slate-900">{s.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title={t("admin.quickStats")}>
          <dl className="space-y-4">
            {[
              { label: t("admin.ordersThisWeek"), value: data.ordersThisWeek },
              { label: t("admin.ordersThisMonth"), value: data.ordersThisMonth },
              { label: t("admin.totalCustomers"), value: data.totalCustomers },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <dt className="text-sm text-slate-500">{item.label}</dt>
                <dd className="text-lg font-bold text-slate-900">{item.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  );
}
