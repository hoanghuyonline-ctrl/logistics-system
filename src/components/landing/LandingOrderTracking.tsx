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
    <section className="py-16 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-2xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
            {t("landing.trackingTitle")}
          </h2>
          <p className="mt-2 text-slate-500">
            {t("landing.trackingDesc")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("landing.trackingPlaceholder")}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:border-transparent text-sm bg-white"
            style={{ focusRingColor: "var(--brand-blue)" } as React.CSSProperties}
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="px-6 py-3 text-white font-semibold rounded-xl shadow-md hover:opacity-90 hover:shadow-lg active:scale-[0.98] transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--brand-navy)" }}
          >
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
          <div className="mt-4 p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📦</span>
                <span className="text-sm text-slate-500">{t("landing.trackingOrderCode")}</span>
                <span className="font-mono font-semibold text-slate-900">{result.orderCode}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">📌</span>
                <span className="text-sm text-slate-500">{t("landing.trackingStatus")}</span>
                <span className="font-semibold" style={{ color: "var(--brand-navy)" }}>{result.statusLabel}</span>
              </div>
              {result.weightKg !== null && result.weightKg !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚖️</span>
                  <span className="text-sm text-slate-500">{t("landing.trackingWeight")}</span>
                  <span className="font-semibold text-slate-900">{result.weightKg}kg</span>
                </div>
              )}
              {result.totalCostVND !== null && result.totalCostVND !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-lg">💰</span>
                  <span className="text-sm text-slate-500">{t("landing.trackingCost")}</span>
                  <span className="font-semibold text-slate-900">
                    {result.totalCostVND.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
