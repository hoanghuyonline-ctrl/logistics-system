"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import CameraScanner from "@/components/warehouse/CameraScanner";
import type { PackageStatus } from "@prisma/client";

/* ─── types ─── */

interface PackageOrder {
  id: string;
  orderCode: string;
  productName: string;
  quantity: number;
  status: string;
  user: { fullName: string };
}

interface ScannedPackage {
  id: string;
  packageCode: string;
  barcode: string | null;
  status: PackageStatus;
  totalWeightKg: string | null;
  orders: PackageOrder[];
  creator: { fullName: string };
  createdAt: string;
}

interface HistoryEntry {
  id: string;
  packageCode: string;
  barcode: string | null;
  status: PackageStatus;
  action: "lookup" | "update";
  prevStatus?: string;
  newStatus?: string;
  orderCount: number;
  time: Date;
}

interface DashboardCounts {
  totalScansSession: number;
  updatesSession: number;
  atChinaWh: number;
  shipping: number;
  atVietnamWh: number;
  delivered: number;
}

const STATUS_TRANSITIONS: Record<string, { next: PackageStatus; label: string }> = {
  AT_CHINA_WH: { next: "SHIPPING" as PackageStatus, label: "Xuất kho TQ" },
  SHIPPING: { next: "AT_VIETNAM_WH" as PackageStatus, label: "Nhận kho VN" },
  AT_VIETNAM_WH: { next: "DELIVERED" as PackageStatus, label: "Giao hàng" },
};

type Tab = "scan" | "history" | "dashboard" | "help";

/* ─── main component ─── */

export default function MiniScannerPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = (session?.user as Record<string, unknown>)?.role as string | undefined;

  const [tab, setTab] = useState<Tab>("scan");

  /* scan state */
  const [barcode, setBarcode] = useState("");
  const [pkg, setPkg] = useState<ScannedPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* history state */
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  /* dashboard state */
  const [dashCounts, setDashCounts] = useState<DashboardCounts>({
    totalScansSession: 0,
    updatesSession: 0,
    atChinaWh: 0,
    shipping: 0,
    atVietnamWh: 0,
    delivered: 0,
  });
  const [dashLoading, setDashLoading] = useState(false);

  useEffect(() => {
    if (tab === "scan") {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [tab]);

  /* toast auto-dismiss */
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3000);
    return () => clearTimeout(t);
  }, [toastMsg]);

  function showToast(text: string, type: "success" | "error") {
    setToastMsg({ text, type });
  }

  function addHistory(entry: HistoryEntry) {
    setHistory((prev) => [entry, ...prev].slice(0, 50));
  }

  /* scan logic */
  const handleLookup = useCallback(async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    setPkg(null);
    setScanError(null);
    try {
      const res = await fetch("/api/warehouse/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode: trimmed, action: "lookup" }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error || "Không tìm thấy kiện hàng";
        setScanError(errMsg);
        showToast(errMsg, "error");
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }
      const scannedPkg = data.package as ScannedPackage;
      setPkg(scannedPkg);
      showToast("Tìm thấy kiện hàng", "success");
      addHistory({
        id: crypto.randomUUID(),
        packageCode: scannedPkg.packageCode,
        barcode: scannedPkg.barcode,
        status: scannedPkg.status,
        action: "lookup",
        orderCount: scannedPkg.orders.length,
        time: new Date(),
      });
      setDashCounts((p) => ({ ...p, totalScansSession: p.totalScansSession + 1 }));
    } catch {
      setScanError("Lỗi hệ thống");
      showToast("Lỗi hệ thống", "error");
      inputRef.current?.focus();
      inputRef.current?.select();
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleStatusUpdate() {
    if (!pkg) return;
    const transition = STATUS_TRANSITIONS[pkg.status];
    if (!transition) return;

    setUpdating(true);
    try {
      const res = await fetch("/api/warehouse/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode: pkg.packageCode,
          action: "update",
          newStatus: transition.next,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Không thể cập nhật", "error");
        return;
      }
      const updatedPkg = data.package as ScannedPackage;
      setPkg(updatedPkg);
      showToast(`Đã cập nhật: ${transition.label}`, "success");
      addHistory({
        id: crypto.randomUUID(),
        packageCode: updatedPkg.packageCode,
        barcode: updatedPkg.barcode,
        status: updatedPkg.status,
        action: "update",
        prevStatus: pkg.status,
        newStatus: transition.next,
        orderCount: updatedPkg.orders.length,
        time: new Date(),
      });
      setDashCounts((p) => ({ ...p, updatesSession: p.updatesSession + 1 }));
      setTimeout(() => {
        setBarcode("");
        setPkg(null);
        inputRef.current?.focus();
      }, 1500);
    } catch {
      showToast("Lỗi hệ thống", "error");
    } finally {
      setUpdating(false);
    }
  }

  function handleClear() {
    setBarcode("");
    setPkg(null);
    setScanError(null);
    inputRef.current?.focus();
  }

  const handleCameraDetected = useCallback((code: string) => {
    setBarcode(code);
    handleLookup(code);
  }, [handleLookup]);

  /* dashboard load */
  const loadDashboard = useCallback(() => {
    setDashLoading(true);
    fetch("/api/scanner/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setDashCounts((p) => ({
            ...p,
            atChinaWh: data.atChinaWh ?? 0,
            shipping: data.shipping ?? 0,
            atVietnamWh: data.atVietnamWh ?? 0,
            delivered: data.delivered ?? 0,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setDashLoading(false));
  }, []);

  /* role display */
  const roleLabel = role === "ADMIN" ? "Admin" : role === "WAREHOUSE_CN" ? "Kho TQ" : role === "WAREHOUSE_VN" ? "Kho VN" : "";

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "scan", label: "Quét mã", icon: "📷" },
    { id: "history", label: "Lịch sử", icon: "📋" },
    { id: "dashboard", label: "Tổng quan", icon: "📊" },
    { id: "help", label: "Trợ giúp", icon: "❓" },
  ];

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">📦</span>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Quét Kho Mini</h1>
            <p className="text-[10px] text-slate-400">Bắc Trung Hải Logistics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {roleLabel && (
            <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
              {roleLabel}
            </span>
          )}
          <button
            onClick={() => router.push("/dashboard")}
            className="text-xs text-slate-400 hover:text-white transition-colors"
            title="Về trang chính"
          >
            ← Thoát
          </button>
        </div>
      </header>

      {/* Toast */}
      {toastMsg && (
        <div className={`mx-4 mt-2 px-3 py-2 rounded-lg text-sm font-medium text-center shrink-0 ${
          toastMsg.type === "success" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"
        }`}>
          {toastMsg.type === "success" ? "✓" : "✗"} {toastMsg.text}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* ─── SCAN TAB ─── */}
        {tab === "scan" && (
          <div className="p-4 space-y-4">
            {/* Scan input */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <form onSubmit={(e) => { e.preventDefault(); handleLookup(barcode); }} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Quét hoặc nhập mã kiện..."
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={loading || !barcode.trim()}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:text-slate-400 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {loading ? "..." : "Quét"}
                </button>
                {(pkg || barcode) && (
                  <button type="button" onClick={handleClear} className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors">
                    Xóa
                  </button>
                )}
              </form>
              <p className="text-[11px] text-slate-500 mt-2">Dùng máy quét mã vạch hoặc nhập thủ công.</p>
            </div>

            {/* Camera scanner */}
            <CameraScanner onDetected={handleCameraDetected} />

            {/* Scan error */}
            {scanError && !pkg && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-sm font-semibold text-red-400">❌ {scanError}</p>
                <p className="text-xs text-red-400/70 mt-1">Kiểm tra mã và thử lại.</p>
              </div>
            )}

            {/* Package result */}
            {pkg && (
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {/* Package header */}
                <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">{pkg.packageCode}</div>
                    {pkg.barcode && <div className="text-xs text-slate-400">Barcode: {pkg.barcode}</div>}
                  </div>
                  <StatusBadge status={pkg.status} />
                </div>

                {/* Package details */}
                <div className="px-4 py-3 space-y-2">
                  {pkg.totalWeightKg && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Cân nặng</span>
                      <span className="text-white font-medium">{pkg.totalWeightKg} kg</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Số đơn hàng</span>
                    <span className="text-white font-medium">{pkg.orders.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Người tạo</span>
                    <span className="text-white font-medium">{pkg.creator.fullName}</span>
                  </div>
                </div>

                {/* Orders list */}
                {pkg.orders.length > 0 && (
                  <div className="border-t border-slate-700 px-4 py-3">
                    <p className="text-xs font-semibold text-slate-400 mb-2">Đơn hàng ({pkg.orders.length})</p>
                    <div className="space-y-1.5">
                      {pkg.orders.map((o) => (
                        <div key={o.id} className="flex items-center justify-between text-xs bg-slate-700/50 rounded-lg px-3 py-2">
                          <div>
                            <span className="text-white font-medium">{o.orderCode}</span>
                            <span className="text-slate-400 ml-2">{o.productName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">×{o.quantity}</span>
                            <StatusBadge status={o.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick action */}
                {STATUS_TRANSITIONS[pkg.status] && (
                  <div className="border-t border-slate-700 px-4 py-3">
                    <button
                      onClick={handleStatusUpdate}
                      disabled={updating}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {updating ? (
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <span>→</span>
                          <span>{STATUS_TRANSITIONS[pkg.status].label}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Terminal status */}
                {!STATUS_TRANSITIONS[pkg.status] && (
                  <div className="border-t border-slate-700 px-4 py-3">
                    <p className="text-xs text-slate-500 text-center">
                      {pkg.status === "DELIVERED" ? "✓ Kiện hàng đã giao" : "Không có thao tác tiếp theo"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── HISTORY TAB ─── */}
        {tab === "history" && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">Lịch sử quét phiên này</h2>
              {history.length > 0 && (
                <button onClick={() => setHistory([])} className="text-[11px] text-slate-400 hover:text-white transition-colors">
                  Xóa lịch sử
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
                <span className="text-3xl mb-2 block">📋</span>
                <p className="text-sm text-slate-400">Chưa có lần quét nào.</p>
                <p className="text-xs text-slate-500 mt-1">Chuyển sang tab Quét mã để bắt đầu.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="bg-slate-800 rounded-xl border border-slate-700 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${h.action === "update" ? "bg-emerald-400" : "bg-blue-400"}`} />
                        <span className="text-sm font-medium text-white">{h.packageCode}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={h.status} />
                        <span className="text-[10px] text-slate-500">
                          {h.time.toLocaleTimeString("vi-VN")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                      <span>{h.action === "update" ? "Cập nhật trạng thái" : "Tra cứu"}</span>
                      {h.prevStatus && h.newStatus && (
                        <span className="text-emerald-400">{h.prevStatus} → {h.newStatus}</span>
                      )}
                      <span>{h.orderCount} đơn</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── DASHBOARD TAB ─── */}
        {tab === "dashboard" && (
          <div className="p-4 space-y-4">
            <h2 className="text-sm font-bold text-white">Tổng quan phiên làm việc</h2>

            {/* Session stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
                <div className="text-2xl font-bold text-emerald-400">{dashCounts.totalScansSession}</div>
                <div className="text-[11px] text-slate-400 mt-1">Lần quét</div>
              </div>
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{dashCounts.updatesSession}</div>
                <div className="text-[11px] text-slate-400 mt-1">Cập nhật trạng thái</div>
              </div>
            </div>

            {/* Package status overview */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 mb-2">Kiện hàng theo trạng thái</h3>
              {dashLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin h-6 w-6 border-2 border-emerald-400 border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Kho Trung Quốc", count: dashCounts.atChinaWh, icon: "🏭", color: "text-amber-400" },
                    { label: "Đang vận chuyển", count: dashCounts.shipping, icon: "🚚", color: "text-blue-400" },
                    { label: "Kho Việt Nam", count: dashCounts.atVietnamWh, icon: "🏠", color: "text-cyan-400" },
                    { label: "Đã giao", count: dashCounts.delivered, icon: "✅", color: "text-emerald-400" },
                  ].map((s) => (
                    <div key={s.label} className="bg-slate-800 rounded-xl border border-slate-700 p-3 flex items-center gap-3">
                      <span className="text-lg">{s.icon}</span>
                      <div>
                        <div className={`text-lg font-bold ${s.color}`}>{s.count}</div>
                        <div className="text-[11px] text-slate-400 leading-tight">{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Session info */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h3 className="text-xs font-semibold text-slate-400 mb-2">Thông tin phiên</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Vai trò</span>
                  <span className="text-white">{roleLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Lịch sử quét</span>
                  <span className="text-white">{history.length} mục</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── HELP TAB ─── */}
        {tab === "help" && (
          <div className="p-4 space-y-4">
            <h2 className="text-sm font-bold text-white">Trợ giúp — Quét Kho Mini</h2>

            {/* About */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h3 className="text-xs font-semibold text-emerald-400 mb-2">Giới thiệu</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Quét Kho Mini là ứng dụng quét mã vạch kho hàng dành cho nhân viên kho nhỏ và cửa hàng.
                Ứng dụng giúp tra cứu kiện hàng, cập nhật trạng thái nhanh chóng, và theo dõi lịch sử quét trong phiên làm việc.
              </p>
            </div>

            {/* How to scan */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h3 className="text-xs font-semibold text-emerald-400 mb-2">Hướng dẫn quét</h3>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">1.</span>
                  <span>Dùng máy quét mã vạch USB/Bluetooth — mã tự động nhập vào ô tìm kiếm</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">2.</span>
                  <span>Hoặc nhấn camera để quét bằng điện thoại</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">3.</span>
                  <span>Hoặc nhập thủ công mã kiện hàng / mã vạch</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">4.</span>
                  <span>Nhấn nút hành động (Xuất kho TQ / Nhận kho VN / Giao hàng) để cập nhật trạng thái</span>
                </div>
              </div>
            </div>

            {/* Roles */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h3 className="text-xs font-semibold text-emerald-400 mb-2">Vai trò được phép</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-white font-medium">Admin</span>
                  <span className="text-slate-400">— Toàn quyền quét và cập nhật</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-white font-medium">Kho Trung Quốc</span>
                  <span className="text-slate-400">— Quét kiện tại kho TQ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-white font-medium">Kho Việt Nam</span>
                  <span className="text-slate-400">— Quét kiện tại kho VN</span>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h3 className="text-xs font-semibold text-emerald-400 mb-2">Yêu cầu</h3>
              <div className="space-y-1.5 text-xs text-slate-300">
                <p>⚡ Cần kết nối internet để quét và cập nhật trạng thái</p>
                <p>📱 Hỗ trợ Android, iOS — thêm vào màn hình chính để dùng như ứng dụng</p>
                <p>🔐 Yêu cầu đăng nhập với vai trò Admin hoặc Nhân viên kho</p>
              </div>
            </div>

            {/* Install instructions */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h3 className="text-xs font-semibold text-emerald-400 mb-2">Cài đặt lên điện thoại</h3>
              <div className="space-y-2 text-xs text-slate-300">
                <div>
                  <p className="text-white font-medium mb-1">Android (Chrome):</p>
                  <p>Mở trang /scanner → Menu ⋮ → &quot;Thêm vào màn hình chính&quot; → Cài đặt</p>
                </div>
                <div>
                  <p className="text-white font-medium mb-1">iOS (Safari):</p>
                  <p>Mở trang /scanner → Nhấn nút Chia sẻ ↑ → &quot;Thêm vào MH chính&quot;</p>
                </div>
              </div>
            </div>

            {/* Version */}
            <div className="text-center text-[10px] text-slate-500 py-2">
              Quét Kho Mini v1.0 — Bắc Trung Hải Logistics
            </div>
          </div>
        )}
      </div>

      {/* Bottom tab bar */}
      <nav className="bg-slate-800 border-t border-slate-700 shrink-0">
        <div className="flex">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); if (t.id === "dashboard") loadDashboard(); }}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                tab === t.id
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="text-base">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
