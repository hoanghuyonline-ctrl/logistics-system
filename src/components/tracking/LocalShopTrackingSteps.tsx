"use client";

interface TrackingStep {
  label: string;
  icon: string;
  timestamp: string | null;
  isActive: boolean;
  isCompleted: boolean;
}

interface LocalShopTrackingStepsProps {
  status: string;
  createdAt: string;
  paidAt: string | null;
}

const STATUS_ORDER = ["NEW", "CONTACTED", "PRICE_CONFIRMED", "PAID", "PROCESSING", "COMPLETED"];

function formatTimestamp(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export default function LocalShopTrackingSteps({ status, createdAt, paidAt }: LocalShopTrackingStepsProps) {
  const isCancelled = status === "CANCELLED";
  const currentIndex = STATUS_ORDER.indexOf(status);

  const steps: TrackingStep[] = [
    {
      label: "Đã tạo đơn",
      icon: "\uD83D\uDCDD",
      timestamp: createdAt,
      isCompleted: true,
      isActive: currentIndex === 0 && !isCancelled,
    },
    {
      label: "Đã xác nhận giá",
      icon: "\uD83C\uDFE2",
      timestamp: currentIndex >= 3 ? paidAt : null,
      isCompleted: currentIndex >= 3,
      isActive: (currentIndex >= 1 && currentIndex < 3) && !isCancelled,
    },
    {
      label: "Đang xử lý & vận chuyển",
      icon: "\uD83D\uDE9A",
      timestamp: null,
      isCompleted: currentIndex >= 5,
      isActive: (currentIndex === 3 || currentIndex === 4) && !isCancelled,
    },
    {
      label: "Giao hàng thành công",
      icon: "\u2705",
      timestamp: null,
      isCompleted: currentIndex >= 5,
      isActive: currentIndex === 5 && !isCancelled,
    },
  ];

  return (
    <div className="relative flex items-start justify-between gap-1 py-3 px-1">
      {/* Connector line */}
      <div className="absolute top-[1.65rem] left-[calc(12.5%+8px)] right-[calc(12.5%+8px)] h-0.5 bg-slate-200" />
      <div
        className="absolute top-[1.65rem] left-[calc(12.5%+8px)] h-0.5 bg-emerald-500 transition-all duration-500"
        style={{
          width: isCancelled
            ? "0%"
            : `${Math.min(100, (steps.filter((s) => s.isCompleted).length - 1) / (steps.length - 1) * 100)}%`,
          maxWidth: `calc(100% - ${(12.5 + 8 / 4) * 2}%)`,
        }}
      />

      {steps.map((step, i) => (
        <div key={i} className="flex flex-col items-center text-center z-10" style={{ width: `${100 / steps.length}%` }}>
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-base border-2 transition-colors ${
              isCancelled && i > 0
                ? "bg-slate-100 border-slate-200"
                : step.isCompleted
                  ? "bg-emerald-100 border-emerald-500"
                  : step.isActive
                    ? "bg-blue-100 border-blue-500 animate-pulse"
                    : "bg-slate-100 border-slate-200"
            }`}
          >
            {step.icon}
          </div>
          <p
            className={`mt-1.5 text-[11px] font-medium leading-tight ${
              isCancelled && i > 0
                ? "text-slate-300"
                : step.isCompleted
                  ? "text-emerald-700"
                  : step.isActive
                    ? "text-blue-700"
                    : "text-slate-400"
            }`}
          >
            {step.label}
          </p>
          {step.timestamp && (
            <p className="mt-0.5 text-[9px] text-slate-400">{formatTimestamp(step.timestamp)}</p>
          )}
        </div>
      ))}

      {isCancelled && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
            Đã hủy
          </span>
        </div>
      )}
    </div>
  );
}
