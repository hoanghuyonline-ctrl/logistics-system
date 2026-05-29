"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Snapshot {
  id: string;
  periodType: string;
  targetDate: string;
  grossServiceRevenue: string | number;
  operatingExpenses: string | number;
  netProfit: string | number;
  cashLiquidity: string | number;
  totalObligations: string | number;
  createdAt: string;
}

export default function ShareholderDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [periodType, setPeriodType] = useState("MONTHLY");
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split("T")[0]);
  const [grossRevenue, setGrossRevenue] = useState("");
  const [opExpenses, setOpExpenses] = useState("");
  const [cashLiquidity, setCashLiquidity] = useState("");
  const [obligations, setObligations] = useState("");

  const formatVND = (value: number | string) => {
    const num = Number(value || 0);
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/shareholder/financial-snapshot");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setSnapshots(data || []);
      setError(false);
    } catch (err) {
      console.error("[shareholder-dashboard] error loading:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/shareholder/dashboard");
    } else if (status === "authenticated") {
      const user = session?.user as any;
      const role = user?.role;
      if (role !== "ADMIN" && role !== "ACCOUNTANT") {
        // Shown custom error instead of redirecting to keep it clean
      } else {
        loadData();
      }
    }
  }, [status, session]);

  const handleSeedMockData = async () => {
    if (!confirm("Bạn có muốn tạo dữ liệu tài chính mẫu để thử nghiệm biểu đồ không? Dữ liệu cũ sẽ bị xóa.")) return;
    try {
      setLoading(true);
      const res = await fetch("/api/shareholder/financial-snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" })
      });
      if (res.ok) {
        alert("Đã tạo thành công chuỗi dữ liệu tài chính mẫu!");
        loadData();
      } else {
        alert("Có lỗi xảy ra khi tạo dữ liệu mẫu.");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDate || !grossRevenue || !opExpenses || !cashLiquidity || !obligations) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }

    setSubmitting(true);
    try {
      const calculatedNetProfit = Number(grossRevenue) - Number(opExpenses);
      const res = await fetch("/api/shareholder/financial-snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodType,
          targetDate,
          grossServiceRevenue: Number(grossRevenue),
          operatingExpenses: Number(opExpenses),
          netProfit: calculatedNetProfit,
          cashLiquidity: Number(cashLiquidity),
          totalObligations: Number(obligations)
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        // Clear fields
        setGrossRevenue("");
        setOpExpenses("");
        setCashLiquidity("");
        setObligations("");
        loadData();
      } else {
        alert("Có lỗi xảy ra khi lưu số liệu.");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bản ghi số liệu chiến lược này không?")) return;
    try {
      const res = await fetch(`/api/shareholder/financial-snapshot?id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        loadData();
      } else {
        alert("Lỗi khi xóa bản ghi.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (status === "loading" || (status === "authenticated" && loading && snapshots.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Đang đồng bộ số liệu chiến lược cổ đông...</p>
      </div>
    );
  }

  // Access check
  const user = session?.user as any;
  const isAuthorized = user?.role === "ADMIN" || user?.role === "ACCOUNTANT";
  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center">
        <span className="text-5xl block mb-4">🔐</span>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Quyền Truy Cập Bị Hạn Chế</h2>
        <p className="text-slate-600 mb-6">
          Bảng điều hành chiến lược tài chính cổ đông chỉ dành riêng cho Ban Giám Đốc và Bộ phận Kế toán trưởng.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-orange-200 transition-all duration-200"
        >
          Quay lại Bảng điều khiển chính
        </button>
      </div>
    );
  }

  // Calculate high-level KPIs based on the latest snapshot
  const latestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;

  const currentRevenue = latestSnapshot ? Number(latestSnapshot.grossServiceRevenue) : 0;
  const currentExpenses = latestSnapshot ? Number(latestSnapshot.operatingExpenses) : 0;
  const currentProfit = latestSnapshot ? Number(latestSnapshot.netProfit) : 0;
  const currentLiquidity = latestSnapshot ? Number(latestSnapshot.cashLiquidity) : 0;
  const currentObligations = latestSnapshot ? Number(latestSnapshot.totalObligations) : 0;

  // Calculate cash liquidity safety ratio
  const liquidityRatio = currentObligations > 0 ? currentLiquidity / currentObligations : 0;
  let liquidityHealth = { label: "N/A", color: "text-slate-400", bg: "bg-slate-100", barColor: "bg-slate-300", desc: "Không đủ dữ liệu phân tích." };

  if (latestSnapshot) {
    if (liquidityRatio >= 1.5) {
      liquidityHealth = {
        label: "TỐI ƯU (Hệ số an toàn)",
        color: "text-emerald-600",
        bg: "bg-emerald-50 border border-emerald-100",
        barColor: "bg-emerald-500",
        desc: "Hệ số thanh khoản cực kỳ vững chắc. Lượng tiền mặt sẵn có hoàn toàn bao phủ tất cả nghĩa vụ công nợ."
      };
    } else if (liquidityRatio >= 1.0) {
      liquidityHealth = {
        label: "TRUNG BÌNH (Cần giám sát)",
        color: "text-amber-600",
        bg: "bg-amber-50 border border-amber-100",
        barColor: "bg-amber-500",
        desc: "Tiền mặt khả dụng vừa đủ bao phủ nghĩa vụ chi trả ngắn hạn. Khuyến cáo kiểm soát dòng tiền thu nợ từ khách hàng."
      };
    } else {
      liquidityHealth = {
        label: "CẢNH BÁO RỦI RO",
        color: "text-rose-600",
        bg: "bg-rose-50 border border-rose-100 animate-pulse",
        barColor: "bg-rose-500",
        desc: "Tiền mặt khả dụng hiện tại KHÔNG đủ bao phủ nghĩa vụ chi trả ngắn hạn cho nhà xe/cảng biên giới. Yêu cầu cấp bổ sung vốn lưu động!"
      };
    }
  }

  // Draw simple SVG line chart comparing history
  const chartWidth = 700;
  const chartHeight = 220;
  const padding = 30;

  const pointsRev: string[] = [];
  const pointsExp: string[] = [];
  const pointsProf: string[] = [];

  if (snapshots.length > 1) {
    const revs = snapshots.map(s => Number(s.grossServiceRevenue));
    const exps = snapshots.map(s => Number(s.operatingExpenses));
    const profs = snapshots.map(s => Number(s.netProfit));

    const maxVal = Math.max(...revs, ...exps, ...profs, 100000000) * 1.1;

    snapshots.forEach((snap, index) => {
      const x = padding + (index * (chartWidth - padding * 2)) / (snapshots.length - 1);
      
      const yRev = chartHeight - padding - (Number(snap.grossServiceRevenue) * (chartHeight - padding * 2)) / maxVal;
      const yExp = chartHeight - padding - (Number(snap.operatingExpenses) * (chartHeight - padding * 2)) / maxVal;
      const yProf = chartHeight - padding - (Number(snap.netProfit) * (chartHeight - padding * 2)) / maxVal;

      pointsRev.push(`${x},${yRev}`);
      pointsExp.push(`${x},${yExp}`);
      pointsProf.push(`${x},${yProf}`);
    });
  }

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <span className="px-3 py-1 bg-amber-50 text-amber-700 font-semibold rounded-full text-xs uppercase tracking-wider block w-fit mb-2">
            Shareholder Suite
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Bảng Điều Hành Chiến Lược Cổ Đông
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Theo dõi sức khỏe tài chính vĩ mô, lãi thực tính, chỉ số thanh khoản dòng tiền.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSeedMockData}
            className="px-4 py-2 text-xs font-semibold text-amber-600 bg-amber-50 rounded-xl hover:bg-amber-100 transition-all"
          >
            📊 Tạo Dữ Liệu Mẫu
          </button>
          
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
          >
            🖨️ Xuất Báo Cáo
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-md hover:shadow-orange-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            ✍️ Nhập Số Liệu Mới
          </button>
        </div>
      </div>

      {latestSnapshot ? (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {/* Revenue */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Doanh Thu Dịch Vụ Thuần</p>
              <h3 className="text-2xl font-black text-slate-800 mt-2 truncate">
                {formatVND(currentRevenue)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Loại trừ giá trị gốc hàng hóa</p>
            </div>

            {/* Expenses */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-rose-600"></div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Chi Phí Vận Hành Biên Giới</p>
              <h3 className="text-2xl font-black text-slate-800 mt-2 truncate">
                {formatVND(currentExpenses)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Thông quan, nâng hạ, vận chuyển</p>
            </div>

            {/* Net Profit */}
            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-md relative overflow-hidden group bg-gradient-to-b from-white to-emerald-50/20">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-teal-600"></div>
              <p className="text-emerald-700 text-xs font-bold uppercase tracking-wider">Lợi Nhuận Thực Tính (Lãi)</p>
              <h3 className="text-2xl font-black text-emerald-800 mt-2 truncate">
                {formatVND(currentProfit)}
              </h3>
              <p className="text-xs text-emerald-600 font-semibold mt-1">
                Tỷ suất: {currentRevenue > 0 ? ((currentProfit / currentRevenue) * 100).toFixed(1) : 0}%
              </p>
            </div>

            {/* Cash Liquidity */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Thanh Khoản Khả Dụng</p>
              <h3 className="text-2xl font-black text-slate-800 mt-2 truncate">
                {formatVND(currentLiquidity)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Tài khoản VietinBank + Quỹ mặt</p>
            </div>

            {/* Obligations */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Nghĩa Vụ Công Nợ Phải Trả</p>
              <h3 className="text-2xl font-black text-slate-800 mt-2 truncate">
                {formatVND(currentObligations)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Công nợ xe Trung Quốc/hải quan</p>
            </div>
          </div>

          {/* Dòng tiền Health Indicator & Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Liquidity Health Meter */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-2">Thước Đo Sức Khỏe Thanh Khoản</h3>
                <p className="text-slate-500 text-xs mb-4">
                  Tỷ lệ tiền mặt khả dụng trên tổng nghĩa vụ công nợ hiện hữu.
                </p>

                <div className={`p-4 rounded-2xl mb-4 ${liquidityHealth.bg}`}>
                  <span className={`text-xs font-bold uppercase ${liquidityHealth.color}`}>
                    {liquidityHealth.label}
                  </span>
                  <div className="text-2xl font-black text-slate-800 mt-1">
                    {liquidityRatio.toFixed(2)}x
                  </div>
                  <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                    {liquidityHealth.desc}
                  </p>
                </div>
              </div>

              <div>
                {/* Visual bar slider */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full ${liquidityHealth.barColor} transition-all duration-500`}
                    style={{ width: `${Math.min(liquidityRatio * 50, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                  <span>Rủi Ro (&lt; 1.0x)</span>
                  <span>An Toàn (1.5x+)</span>
                </div>
              </div>
            </div>

            {/* Strategic Trend Chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2">
              <h3 className="text-base font-bold text-slate-800 mb-4">Xu Hướng Lợi Nhuận Tài Chính</h3>
              
              {snapshots.length > 1 ? (
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[600px] flex items-center justify-center">
                    <svg width={chartWidth} height={chartHeight} className="overflow-visible">
                      {/* Grid lines */}
                      <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#f1f5f9" strokeWidth="1" />
                      <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#f1f5f9" strokeWidth="1" />
                      <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#e2e8f0" strokeWidth="1.5" />

                      {/* Paths */}
                      <polyline fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={pointsRev.join(" ")} />
                      <polyline fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pointsExp.join(" ")} />
                      <polyline fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" points={pointsProf.join(" ")} />

                      {/* Vertices & Nodes */}
                      {snapshots.map((snap, idx) => {
                        const x = padding + (idx * (chartWidth - padding * 2)) / (snapshots.length - 1);
                        const revs = snapshots.map(s => Number(s.grossServiceRevenue));
                        const exps = snapshots.map(s => Number(s.operatingExpenses));
                        const profs = snapshots.map(s => Number(s.netProfit));
                        const maxVal = Math.max(...revs, ...exps, ...profs, 100000000) * 1.1;

                        const yRev = chartHeight - padding - (Number(snap.grossServiceRevenue) * (chartHeight - padding * 2)) / maxVal;
                        const yProf = chartHeight - padding - (Number(snap.netProfit) * (chartHeight - padding * 2)) / maxVal;

                        const dateText = new Date(snap.targetDate).toLocaleDateString("vi-VN", { month: "2-digit", year: "2-digit" });

                        return (
                          <g key={idx} className="group/node">
                            <circle cx={x} cy={yRev} r="5" fill="#f59e0b" className="hover:r-7 transition-all cursor-pointer" />
                            <circle cx={x} cy={yProf} r="6" fill="#10b981" className="hover:r-8 transition-all cursor-pointer" />
                            <text x={x} y={chartHeight - 8} textAnchor="middle" className="text-[10px] fill-slate-400 font-bold">
                              {dateText}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                  <div className="flex justify-center gap-6 mt-3 text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-1 bg-amber-500 rounded-full"></span>
                      <span className="text-slate-600">Doanh Thu Thuần</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-1 bg-rose-500 rounded-full"></span>
                      <span className="text-slate-600">Chi Phí Vận Hành</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-1 bg-emerald-500 rounded-full"></span>
                      <span className="text-emerald-700">Lợi Nhuận (Lãi Thực)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400 text-xs">Cần ít nhất 2 bản ghi số liệu để dựng biểu đồ so sánh.</p>
                </div>
              )}
            </div>
          </div>

          {/* Snapshot Table */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-4">Sổ Nhật Ký Số Liệu Cổ Đông</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold">
                    <th className="pb-3 pl-4">Kỳ Báo Cáo</th>
                    <th className="pb-3">Ngày Ghi Nhận</th>
                    <th className="pb-3 text-right">Doanh Thu</th>
                    <th className="pb-3 text-right">Chi Phí Vận Hành</th>
                    <th className="pb-3 text-right">Lợi Nhuận Ròng</th>
                    <th className="pb-3 text-right">Thanh Khoản (Cash)</th>
                    <th className="pb-3 text-right">Công Nợ Phải Trả</th>
                    <th className="pb-3 text-center pr-4">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {snapshots.map((snap) => (
                    <tr key={snap.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 pl-4 font-semibold text-slate-700">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          snap.periodType === "DAILY" ? "bg-blue-50 text-blue-700" :
                          snap.periodType === "MONTHLY" ? "bg-amber-50 text-amber-700" : "bg-purple-50 text-purple-700"
                        }`}>
                          {snap.periodType}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500 font-medium">
                        {new Date(snap.targetDate).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="py-3.5 text-right font-semibold text-slate-800">
                        {formatVND(snap.grossServiceRevenue)}
                      </td>
                      <td className="py-3.5 text-right font-medium text-slate-600">
                        {formatVND(snap.operatingExpenses)}
                      </td>
                      <td className="py-3.5 text-right font-extrabold text-emerald-600">
                        {formatVND(snap.netProfit)}
                      </td>
                      <td className="py-3.5 text-right font-medium text-slate-800">
                        {formatVND(snap.cashLiquidity)}
                      </td>
                      <td className="py-3.5 text-right font-medium text-slate-600">
                        {formatVND(snap.totalObligations)}
                      </td>
                      <td className="py-3.5 text-center pr-4">
                        <button
                          onClick={() => handleDelete(snap.id)}
                          className="px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center shadow-sm max-w-lg mx-auto">
          <span className="text-5xl block mb-4">📈</span>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa có số liệu tài chính</h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            Hệ thống chưa ghi nhận bản ghi FinancialSnapshot nào cho bộ chỉ số chiến lược cổ đông.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleSeedMockData}
              className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm"
            >
              🔄 Khởi Tạo Nhanh Chuỗi Số Liệu Mẫu
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-100 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
            >
              ✍️ Tự nhập số liệu đầu tiên
            </button>
          </div>
        </div>
      )}

      {/* Input Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-800">Thêm Số Liệu Tài Chính Cổ Đông</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-medium w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Loại Kỳ Hạn</label>
                  <select
                    value={periodType}
                    onChange={(e) => setPeriodType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="DAILY">Hàng Ngày (Daily)</option>
                    <option value="MONTHLY">Hàng Tháng (Monthly)</option>
                    <option value="QUARTERLY">Hàng Quý (Quarterly)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ngày Ghi Nhận</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Doanh Thu Dịch Vụ Thuần (VND)
                </label>
                <input
                  type="number"
                  placeholder="Ví dụ: 300000000"
                  value={grossRevenue}
                  onChange={(e) => setGrossRevenue(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 font-bold"
                  required
                />
                <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                  Doanh thu thuần thực tế phát sinh (phí dịch vụ mua hộ, phí vận chuyển)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Chi Phí Vận Hành Biên Giới (VND)
                </label>
                <input
                  type="number"
                  placeholder="Ví dụ: 180000000"
                  value={opExpenses}
                  onChange={(e) => setOpExpenses(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 font-bold"
                  required
                />
                <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                  Tổng chi phí thông quan, xăng dầu, nâng hạ, bốc xếp...
                </span>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Lợi Nhuận Thực Tính (Ước Tính)</span>
                <div className="text-lg font-black text-emerald-800 mt-0.5">
                  {formatVND(Number(grossRevenue || 0) - Number(opExpenses || 0))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Thanh Khoản Cash (VND)
                  </label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 1500000000"
                    value={cashLiquidity}
                    onChange={(e) => setCashLiquidity(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Tổng Nghĩa Vụ Chi Trả (VND)
                  </label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 400000000"
                    value={obligations}
                    onChange={(e) => setObligations(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-orange-100 transition-colors text-sm"
                >
                  {submitting ? "Đang lưu..." : "Lưu Số Liệu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
