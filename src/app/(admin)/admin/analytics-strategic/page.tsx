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

interface PipelineStage {
  stage: string;
  count: number;
  stuckCount: number;
  hasAnomaly: boolean;
}

interface WalletStats {
  totalWallets: number;
  totalWalletBalance: number;
  totalWalletDebt: number;
}

interface HighRiskWallet {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  balance: number;
  debt: number;
}

export default function AnalyticsStrategicDashboardV2() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Dashboard state
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);
  const [wallets, setWallets] = useState<WalletStats>({ totalWallets: 0, totalWalletBalance: 0, totalWalletDebt: 0 });
  const [highRisk, setHighRisk] = useState<HighRiskWallet[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modal form states
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

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case "AT_GUANGZHOU_WAREHOUSE":
        return "Kho Quảng Châu";
      case "AT_NANNING_TRANSIT":
        return "Trung chuyển Nam Ninh";
      case "AT_PINGXIANG_BORDER":
        return "Cửa khẩu Bằng Tường";
      case "CUSTOMS_CLEARED_AT":
        return "Thông quan Lạng Sơn";
      case "AT_VIETNAM_DISTRIBUTION":
        return "Trung tâm phân phối VN";
      default:
        return stage;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/analytics-strategic");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      
      setSnapshots(data.snapshots || []);
      setPipeline(data.pipeline || []);
      setWallets(data.wallets || { totalWallets: 0, totalWalletBalance: 0, totalWalletDebt: 0 });
      setHighRisk(data.highRiskWallets || []);
      
      setError(false);
    } catch (err) {
      console.error("[analytics-strategic] error loading:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/analytics-strategic");
    } else if (status === "authenticated") {
      const user = session?.user as any;
      const role = user?.role;
      if (role !== "ADMIN" && role !== "ACCOUNTANT") {
        // Access restricted
      } else {
        loadData();
      }
    }
  }, [status, session]);

  const handleSeedMockData = async () => {
    if (!confirm("Bạn có muốn tạo dữ liệu tài chính mẫu để thử nghiệm biểu đồ không? Dữ liệu cũ sẽ bị xóa.")) return;
    try {
      setLoading(true);
      const res = await fetch("/api/admin/analytics-strategic", {
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
      const res = await fetch("/api/admin/analytics-strategic", {
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
      const res = await fetch(`/api/admin/analytics-strategic?id=${id}`, {
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-slate-50 rounded-3xl p-6">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium font-sans">Đang đồng bộ số liệu tài chính chiến lược v2...</p>
      </div>
    );
  }

  // Access check
  const user = session?.user as any;
  const isAuthorized = user?.role === "ADMIN" || user?.role === "ACCOUNTANT";
  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center font-sans">
        <span className="text-5xl block mb-4">🔐</span>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Quyền Truy Cập Bị Hạn Chế</h2>
        <p className="text-slate-600 mb-6">
          Bảng phân tích chiến lược tài chính cổ đông chỉ dành riêng cho Ban Giám Đốc và Bộ phận Kế toán trưởng.
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

  // Extract financial KPIs
  const latestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const currentRevenue = latestSnapshot ? Number(latestSnapshot.grossServiceRevenue) : 0;
  const currentExpenses = latestSnapshot ? Number(latestSnapshot.operatingExpenses) : 0;
  const currentProfit = latestSnapshot ? Number(latestSnapshot.netProfit) : 0;
  const currentLiquidity = latestSnapshot ? Number(latestSnapshot.cashLiquidity) : 0;
  const currentObligations = latestSnapshot ? Number(latestSnapshot.totalObligations) : 0;

  // Calculate balance sheet metrics
  const totalOutstandingDebt = wallets.totalWalletDebt;
  const liquidityRatio = currentObligations > 0 ? currentLiquidity / currentObligations : 0;
  
  // Visual chart parameters
  const chartWidth = 700;
  const chartHeight = 200;
  const padding = 35;
  const pointsRev: string[] = [];
  const pointsExp: string[] = [];
  const pointsProf: string[] = [];

  if (snapshots.length > 1) {
    const revs = snapshots.map(s => Number(s.grossServiceRevenue));
    const exps = snapshots.map(s => Number(s.operatingExpenses));
    const profs = snapshots.map(s => Number(s.netProfit));
    const maxVal = Math.max(...revs, ...exps, ...profs, 100000000) * 1.15;

    snapshots.forEach((snap, idx) => {
      const x = padding + (idx * (chartWidth - padding * 2)) / (snapshots.length - 1);
      const yRev = chartHeight - padding - (Number(snap.grossServiceRevenue) * (chartHeight - padding * 2)) / maxVal;
      const yExp = chartHeight - padding - (Number(snap.operatingExpenses) * (chartHeight - padding * 2)) / maxVal;
      const yProf = chartHeight - padding - (Number(snap.netProfit) * (chartHeight - padding * 2)) / maxVal;
      pointsRev.push(`${x},${yRev}`);
      pointsExp.push(`${x},${yExp}`);
      pointsProf.push(`${x},${yProf}`);
    });
  }

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-full text-[10px] uppercase tracking-wider block w-fit mb-2">
            Shareholder Dashboard v2
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            Báo Cáo Sức Khỏe & Biên Giới Chiến Lược
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Độc lập tài chính cổ đông, cân đối công nợ, quản trị rủi ro dòng tiền vĩ mô.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSeedMockData}
            className="px-4 py-2 text-xs font-bold text-amber-600 bg-amber-50 rounded-xl hover:bg-amber-100 transition-all font-sans"
          >
            📊 Reset Dữ Liệu Mẫu
          </button>
          
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all font-sans"
          >
            🖨️ In Báo Cáo
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 text-sm font-extrabold text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-md hover:shadow-orange-100 hover:scale-[1.02] active:scale-[0.98] transition-all font-sans"
          >
            ✍️ Ghi Nhận Số Liệu
          </button>
        </div>
      </div>

      {/* 1. PIPELINE BIÊN GIỚI (5-stage metrics) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-800">1. Luồng Di Chuyển Hàng Hóa Biên Giới (5 Chặng)</h3>
            <p className="text-slate-400 text-xs mt-1">Theo dõi thời gian thực lưu lượng hàng vận chuyển Trung - Việt.</p>
          </div>
          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full">LIVE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {pipeline.map((stage, idx) => (
            <div 
              key={stage.stage} 
              className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
                stage.hasAnomaly 
                  ? "bg-rose-50/50 border-rose-200 hover:border-rose-300" 
                  : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
              }`}
            >
              {stage.hasAnomaly && (
                <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-bl-xl animate-pulse"></div>
              )}
              <span className="text-2xl font-black text-slate-300 block mb-1">0{idx + 1}</span>
              <p className="text-slate-700 text-xs font-bold truncate">{getStageLabel(stage.stage)}</p>
              
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-3xl font-black text-slate-800">{stage.count}</span>
                <span className="text-slate-400 text-xs font-semibold">đơn</span>
              </div>

              {stage.hasAnomaly && (
                <div className="mt-3 p-1.5 bg-rose-100 rounded-lg text-[9px] font-extrabold text-rose-700 animate-pulse text-center">
                  ⚠️ Ùn ứ: {stage.stuckCount} đơn (&gt;48h)
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. CÂN ĐỐI KẾ TOÁN VÀ TIỀN MẶT (Debt-to-liquidity Balance Sheet) & WALLET STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Sheet Ledger */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between col-span-1 lg:col-span-2">
          <div>
            <h3 className="text-lg font-black text-slate-800 mb-2">2. Cân Đối Dòng Tiền & Công Nợ Lũy Kế</h3>
            <p className="text-slate-400 text-xs mb-6">
              Đo lường lượng tiền mặt so với nghĩa vụ chi trả và công nợ chưa thu hồi.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Thanh Khoản (A)</span>
                <span className="text-xl font-black text-slate-800 mt-2 block truncate">{formatVND(currentLiquidity)}</span>
                <span className="text-[9px] text-slate-400 mt-1 block">Tài khoản khả dụng</span>
              </div>
              
              <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Công Nợ Phải Thu (B)</span>
                <span className="text-xl font-black text-slate-800 mt-2 block truncate">{formatVND(totalOutstandingDebt)}</span>
                <span className="text-[9px] text-slate-400 mt-1 block">Khách hàng còn nợ</span>
              </div>

              <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Nghĩa Vụ Phải Trả (C)</span>
                <span className="text-xl font-black text-slate-800 mt-2 block truncate">{formatVND(currentObligations)}</span>
                <span className="text-[9px] text-slate-400 mt-1 block">Nợ nhà xe/hải quan</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-slate-100 rounded-2xl">
                <span className="text-slate-500 text-[10px] font-bold block uppercase mb-1">Chỉ số Thanh Khoản Tức Thời (A / C)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-800">{liquidityRatio.toFixed(2)}x</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    liquidityRatio >= 1.5 ? "bg-emerald-50 text-emerald-700" :
                    liquidityRatio >= 1.0 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700 animate-pulse"
                  }`}>
                    {liquidityRatio >= 1.5 ? "Ổn định" : liquidityRatio >= 1.0 ? "Giám sát" : "Nguy cơ cao"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Lượng tiền mặt có sẵn để bao phủ nợ gốc chi trả tức thời.</p>
              </div>

              <div className="p-4 border border-slate-100 rounded-2xl">
                <span className="text-slate-500 text-[10px] font-bold block uppercase mb-1">Tổng Hệ Số Phòng Vệ ((A + B) / C)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-800">
                    {currentObligations > 0 ? ((currentLiquidity + totalOutstandingDebt) / currentObligations).toFixed(2) : "0.00"}x
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">Đầy đủ</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Hệ số an toàn bao gồm cả khoản phải thu gối đầu.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Đối soát: Tự động đối sánh hệ thống</span>
            <span>Cập nhật: {latestSnapshot ? new Date(latestSnapshot.createdAt).toLocaleString("vi-VN") : "N/A"}</span>
          </div>
        </div>

        {/* User Wallets aggregate */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-800 mb-2">3. Trạng Thái Quỹ Ví Khách Hàng</h3>
            <p className="text-slate-400 text-xs mb-6">
              Tổng số lượng và biến động dư nợ hiện tại trên toàn bộ ví điện tử.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Tổng Số Lượng Ví</span>
                  <span className="text-slate-800 text-base font-extrabold mt-1 block">{wallets.totalWallets} tài khoản</span>
                </div>
                <span className="text-2xl">💳</span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-emerald-50/50 rounded-2xl">
                <div>
                  <span className="text-emerald-700 text-[10px] font-bold uppercase block">Tổng Số Dư Khả Dụng</span>
                  <span className="text-emerald-800 text-base font-extrabold mt-1 block">{formatVND(wallets.totalWalletBalance)}</span>
                </div>
                <span className="text-2xl">💰</span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-rose-50/50 rounded-2xl">
                <div>
                  <span className="text-rose-700 text-[10px] font-bold uppercase block">Tổng Nợ Khách Hàng Kỳ Này</span>
                  <span className="text-rose-800 text-base font-extrabold mt-1 block">{formatVND(wallets.totalWalletDebt)}</span>
                </div>
                <span className="text-2xl">🚨</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl text-[10px] text-amber-800 font-bold mt-6 leading-relaxed">
            💡 Kế toán trưởng lưu ý kiểm soát các ví có khoản nợ lớn quá 7 ngày chưa được tất toán.
          </div>
        </div>
      </div>

      {/* 3. HIGH RISK NEGATIVE BALANCE TABLE */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-slate-800">4. Danh Sách Khách Hàng Dư Nợ Cao Nhất</h3>
            <p className="text-slate-400 text-xs mt-1">Cảnh báo rủi ro đọng vốn kinh doanh của cổ đông.</p>
          </div>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">Top 10 Dư Nợ</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold">
                <th className="pb-3 pl-4">Khách Hàng</th>
                <th className="pb-3">Email liên hệ</th>
                <th className="pb-3">Số điện thoại</th>
                <th className="pb-3 text-right">Số Dư Quỹ</th>
                <th className="pb-3 text-right pr-4">Khoản Nợ Phải Thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {highRisk.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 pl-4 font-bold text-slate-800">{item.fullName}</td>
                  <td className="py-3.5 text-slate-500 font-medium">{item.email}</td>
                  <td className="py-3.5 text-slate-500 font-medium">{item.phone}</td>
                  <td className="py-3.5 text-right font-bold text-slate-400">
                    {formatVND(item.balance)}
                  </td>
                  <td className="py-3.5 text-right font-black text-rose-600 pr-4">
                    {formatVND(item.debt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. FINANCIAL TREND CHART */}
      {latestSnapshot && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-6">Xu Hướng Lợi Nhuận Tài Chính</h3>
          
          {snapshots.length > 1 ? (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[600px] flex items-center justify-center">
                <svg width={chartWidth} height={chartHeight} className="overflow-visible">
                  {/* Grid lines */}
                  <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#f8fafc" strokeWidth="1" />
                  <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#f8fafc" strokeWidth="1" />
                  <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#f1f5f9" strokeWidth="1.5" />

                  {/* Lines */}
                  <polyline fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" points={pointsRev.join(" ")} />
                  <polyline fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pointsExp.join(" ")} />
                  <polyline fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={pointsProf.join(" ")} />

                  {/* Vertices */}
                  {snapshots.map((snap, idx) => {
                    const x = padding + (idx * (chartWidth - padding * 2)) / (snapshots.length - 1);
                    const revs = snapshots.map(s => Number(s.grossServiceRevenue));
                    const exps = snapshots.map(s => Number(s.operatingExpenses));
                    const profs = snapshots.map(s => Number(s.netProfit));
                    const maxVal = Math.max(...revs, ...exps, ...profs, 100000000) * 1.15;

                    const yRev = chartHeight - padding - (Number(snap.grossServiceRevenue) * (chartHeight - padding * 2)) / maxVal;
                    const yProf = chartHeight - padding - (Number(snap.netProfit) * (chartHeight - padding * 2)) / maxVal;
                    const dateText = new Date(snap.targetDate).toLocaleDateString("vi-VN", { month: "2-digit", year: "2-digit" });

                    return (
                      <g key={idx}>
                        <circle cx={x} cy={yRev} r="4" fill="#f59e0b" />
                        <circle cx={x} cy={yProf} r="5" fill="#10b981" />
                        <text x={x} y={chartHeight - 8} textAnchor="middle" className="text-[10px] fill-slate-400 font-bold">
                          {dateText}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="flex justify-center gap-6 mt-4 text-xs font-bold">
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
              <p className="text-slate-400 text-xs">Cần ít nhất 2 bản ghi số liệu để hiển thị biểu đồ.</p>
            </div>
          )}
        </div>
      )}

      {/* 5. METRICS DIARY LEDGER */}
      {snapshots.length > 0 ? (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4">Sổ Nhật Ký Số Liệu Cổ Đông</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold">
                  <th className="pb-3 pl-4">Kỳ Báo Cáo</th>
                  <th className="pb-3">Ngày Ghi Nhận</th>
                  <th className="pb-3 text-right">Doanh Thu Thuần</th>
                  <th className="pb-3 text-right">Chi Phí Biên Giới</th>
                  <th className="pb-3 text-right">Lợi Nhuận Ròng</th>
                  <th className="pb-3 text-right">Thanh Khoản (A)</th>
                  <th className="pb-3 text-right">Nghĩa Vụ Trả (C)</th>
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
                    <td className="py-3.5 text-right font-bold text-slate-800">
                      {formatVND(snap.grossServiceRevenue)}
                    </td>
                    <td className="py-3.5 text-right font-medium text-slate-600">
                      {formatVND(snap.operatingExpenses)}
                    </td>
                    <td className="py-3.5 text-right font-black text-emerald-600">
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
                        className="px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-sans"
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
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center shadow-sm max-w-lg mx-auto">
          <span className="text-5xl block mb-4">📈</span>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa có số liệu tài chính</h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            Hệ thống chưa ghi nhận bản ghi FinancialSnapshot nào cho bộ chỉ số chiến lược cổ đông.
          </p>
          <div className="flex flex-col gap-3 font-sans">
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
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Lợi Nhuận Ròng (Ước Tính)</span>
                <div className="text-lg font-black text-emerald-800 mt-0.5 font-sans">
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

              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6 font-sans">
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
