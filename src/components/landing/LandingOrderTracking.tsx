"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";

interface TrackingResult {
  found: boolean;
  orderCode?: string;
  status?: string;
  statusLabel?: string;
  weightKg?: number | null;
  totalCostVND?: number | null;
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" d="m21 21-4.35-4.35" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

const TIMELINE_STEPS = [
  { key: "PENDING", label: "Đã nhận đơn" },
  { key: "ARRIVED_CHINA_WH", label: "Đã gom hàng TQ" },
  { key: "SHIPPING_TO_VIETNAM", label: "Đang vận chuyển" },
  { key: "ARRIVED_VIETNAM_WH", label: "Đến kho VN" },
  { key: "COMPLETED", label: "Giao thành công" },
];

const STATUS_ORDER = [
  "PENDING", "PURCHASED", "SELLER_SHIPPED",
  "ARRIVED_CHINA_WH", "PACKING",
  "SHIPPING_TO_VIETNAM",
  "ARRIVED_VIETNAM_WH", "OUT_FOR_DELIVERY",
  "COMPLETED",
];

function getStepIndex(status: string): number {
  const idx = STATUS_ORDER.indexOf(status);
  if (idx < 0) return -1;
  if (idx <= 2) return 0;
  if (idx <= 4) return 1;
  if (idx === 5) return 2;
  if (idx <= 7) return 3;
  return 4;
}

function TrackingTimeline({ status }: { status: string }) {
  const isCancelled = status === "CANCELLED";
  const activeStep = isCancelled ? -1 : getStepIndex(status);

  return (
    <div className="mt-6">
      {/* Desktop horizontal */}
      <div className="hidden sm:flex items-start justify-between relative">
        <div className="absolute top-4 left-[10%] right-[10%] h-0.5 bg-slate-200" />
        <div
          className="absolute top-4 left-[10%] h-0.5 bg-emerald-500 transition-all duration-700"
          style={{ width: isCancelled ? "0%" : `${Math.min(100, (activeStep / (TIMELINE_STEPS.length - 1)) * 80)}%` }}
        />
        {TIMELINE_STEPS.map((step, i) => {
          const done = !isCancelled && i < activeStep;
          const current = !isCancelled && i === activeStep;
          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center" style={{ width: `${100 / TIMELINE_STEPS.length}%` }}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                done ? "bg-emerald-500 border-emerald-500 text-white" :
                current ? "bg-white border-orange-500 text-orange-600 ring-4 ring-orange-100" :
                "bg-white border-slate-200 text-slate-400"
              }`}>
                {done ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <p className={`mt-2 text-[11px] font-medium text-center leading-tight ${
                done ? "text-emerald-700" : current ? "text-orange-600" : "text-slate-400"
              }`}>{step.label}</p>
            </div>
          );
        })}
      </div>

      {/* Mobile vertical */}
      <div className="sm:hidden space-y-0">
        {TIMELINE_STEPS.map((step, i) => {
          const done = !isCancelled && i < activeStep;
          const current = !isCancelled && i === activeStep;
          const isLast = i === TIMELINE_STEPS.length - 1;
          return (
            <div key={step.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 ${
                  done ? "bg-emerald-500 border-emerald-500 text-white" :
                  current ? "bg-white border-orange-500 text-orange-600" :
                  "bg-white border-slate-200 text-slate-400"
                }`}>
                  {done ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                {!isLast && (
                  <div className={`w-0.5 h-6 ${done ? "bg-emerald-500" : "bg-slate-200"}`} />
                )}
              </div>
              <p className={`text-sm pt-1 ${
                done ? "text-emerald-700 font-medium" : current ? "text-orange-600 font-semibold" : "text-slate-400"
              }`}>{step.label}</p>
            </div>
          );
        })}
      </div>

      {isCancelled && (
        <div className="mt-4 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
            Đơn hàng đã bị huỷ
          </span>
        </div>
      )}
    </div>
  );
}

export default function LandingOrderTracking() {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch(`/api/tracking?code=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        setError(t("landing.trackingError"));
        return;
      }
      const data: TrackingResult = await res.json();
      setResult(data);
    } catch {
      setError(t("landing.trackingError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-20 lg:py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-2xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
            {t("landing.trackingTitle")}
          </h2>
          <p className="mt-2 text-slate-500">
            {t("landing.trackingDesc")}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t("landing.trackingPlaceholder")}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm bg-white transition-all duration-300"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{ backgroundColor: "var(--brand-navy)" }}
            >
              {loading ? <Spinner /> : <SearchIcon className="w-4 h-4" />}
              {loading ? t("common.loading") : t("landing.trackingButton")}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {result && !result.found && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
              {t("landing.trackingNotFound")}
            </div>
          )}

          {result && result.found && (
            <div className="mt-6">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                  <span className="text-sm text-slate-500">{t("landing.trackingOrderCode")}</span>
                  <span className="font-mono font-semibold text-slate-900">{result.orderCode}</span>
                </div>
                {result.weightKg !== null && result.weightKg !== undefined && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" /></svg>
                    <span className="text-sm text-slate-500">{t("landing.trackingWeight")}</span>
                    <span className="font-semibold text-slate-900">{result.weightKg}kg</span>
                  </div>
                )}
                {result.totalCostVND !== null && result.totalCostVND !== undefined && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-sm text-slate-500">{t("landing.trackingCost")}</span>
                    <span className="font-semibold text-slate-900">
                      {result.totalCostVND.toLocaleString("vi-VN")} {t("landing.trackingCurrencySymbol")}
                    </span>
                  </div>
                )}
              </div>
              <TrackingTimeline status={result.status || ""} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
