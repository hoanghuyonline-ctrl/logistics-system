"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n";
import { ShieldCheck } from "lucide-react";

interface SmokeCheck {
  key: string;
  label: string;
  status: "ok" | "warning" | "error";
  detail: string;
  durationMs: number;
}

interface SmokeTestData {
  overall: "ok" | "warning" | "error";
  checks: SmokeCheck[];
  summary: { ok: number; warning: number; error: number; totalMs: number };
  checkedAt: string;
}

interface ZaloTokenRefresh {
  lastRefreshAt: string;
  success: boolean;
  errorReason: string | null;
}

interface ZaloDiagnostics {
  tokenExpired: boolean;
  tokenExpiredAt: string | null;
  tokenExpiredReason: string | null;
  unresolvedFailures: number;
  boundCustomers: number;
  configPresent: {
    sendEnabled: boolean;
    accessToken: boolean;
  };
  tokenRefresh: ZaloTokenRefresh | null;
}

interface HealthData {
  system: {
    appOnline: boolean;
    database: string;
    serverTime: string;
    environment: string;
  };
  chatbot: {
    telegram: string;
    zalo: string;
    messenger: string;
  };
  zaloDiagnostics?: ZaloDiagnostics;
  operational: {
    unansweredQuestions: number;
    stuckPending: number;
    stuckDelivery: number;
    lastChatbotActivity: { time: string; channel: string } | null;
  };
}

function StatusDot({ status }: { status: "green" | "yellow" | "red" }) {
  const colors = {
    green: "bg-emerald-500",
    yellow: "bg-amber-500",
    red: "bg-red-500",
  };
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status]}`} />
  );
}

function StatusRow({ label, value, status }: { label: string; value: string; status: "green" | "yellow" | "red" }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        <StatusDot status={status} />
        <span className="text-sm font-medium text-slate-900">{value}</span>
      </div>
    </div>
  );
}

function MetricRow({ label, value, alert }: { label: string; value: number | string; alert?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`text-sm font-semibold ${alert ? "text-red-600" : "text-slate-900"}`}>
        {value}
      </span>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

function timeSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

export default function SystemHealthPage() {
  const { t } = useI18n();
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [smokeTest, setSmokeTest] = useState<SmokeTestData | null>(null);
  const [smokeLoading, setSmokeLoading] = useState(false);

  const fetchHealth = () => {
    setLoading(true);
    setError(false);
    fetch("/api/admin/system-health")
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLastRefresh(new Date());
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => { fetchHealth(); }, []);

  const runSmokeTest = () => {
    setSmokeLoading(true);
    fetch("/api/admin/smoke-test")
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((d) => {
        setSmokeTest(d);
        setSmokeLoading(false);
      })
      .catch(() => {
        setSmokeTest(null);
        setSmokeLoading(false);
      });
  };

  if (loading && !data) return <LoadingSpinner text={t("sysHealth.checking")} />;

  return (
    <div>
      <PageHeader
        title={t("sysHealth.title")}
        subtitle={t("sysHealth.subtitle")}
      />

      {/* Refresh button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? t("sysHealth.loading") : t("sysHealth.refresh")}
        </button>
        <span className="text-xs text-slate-400">
          {t("sysHealth.updatedAt")}: {lastRefresh.toLocaleTimeString("vi-VN")}
        </span>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {t("sysHealth.connError")}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* System Health */}
          <Card title={t("sysHealth.system")}>
            <StatusRow
              label={t("sysHealth.app")}
              value={data.system.appOnline ? t("sysHealth.appRunning") : t("sysHealth.appStopped")}
              status={data.system.appOnline ? "green" : "red"}
            />
            <StatusRow
              label={t("sysHealth.database")}
              value={data.system.database === "connected" ? t("sysHealth.dbOk") : t("sysHealth.dbFail")}
              status={data.system.database === "connected" ? "green" : "red"}
            />
            <StatusRow
              label={t("sysHealth.env")}
              value={data.system.environment === "production" ? "Production" : "Development"}
              status={data.system.environment === "production" ? "green" : "yellow"}
            />
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-600">{t("sysHealth.serverTime")}</span>
              <span className="text-sm font-medium text-slate-900">
                {formatTime(data.system.serverTime)}
              </span>
            </div>
          </Card>

          {/* Chatbot Health */}
          <Card title={t("sysHealth.chatbot")}>
            <StatusRow
              label="Zalo OA"
              value={data.chatbot.zalo === "enabled" ? t("sysHealth.enabled") : t("sysHealth.disabled")}
              status={data.chatbot.zalo === "enabled" ? "green" : "red"}
            />
            <StatusRow
              label="Telegram"
              value={data.chatbot.telegram === "enabled" ? t("sysHealth.enabled") : t("sysHealth.disabled")}
              status={data.chatbot.telegram === "enabled" ? "green" : "red"}
            />
            <StatusRow
              label="Messenger"
              value={data.chatbot.messenger === "enabled" ? t("sysHealth.enabled") : t("sysHealth.disabled")}
              status={data.chatbot.messenger === "enabled" ? "green" : "red"}
            />
            {data.operational.lastChatbotActivity && (
              <div className="flex items-center justify-between py-3 mt-1 border-t border-slate-100">
                <span className="text-xs text-slate-400">{t("sysHealth.lastActivity")}</span>
                <span className="text-xs text-slate-500">
                  {data.operational.lastChatbotActivity.channel} — {timeSince(data.operational.lastChatbotActivity.time)}
                </span>
              </div>
            )}
          </Card>

          {/* Zalo Diagnostics */}
          {data.zaloDiagnostics && (
            <Card title={t("sysHealth.zaloDiag")}>
              {data.zaloDiagnostics.tokenExpired && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusDot status="red" />
                    <span className="text-sm font-semibold text-red-700">
                      {t("sysHealth.zaloTokenExpired")}
                    </span>
                  </div>
                  {data.zaloDiagnostics.tokenExpiredAt && (
                    <p className="text-xs text-red-600 ml-4">
                      {t("sysHealth.zaloDetected")}: {formatTime(data.zaloDiagnostics.tokenExpiredAt)}
                    </p>
                  )}
                  <p className="text-xs text-red-500 mt-1 ml-4">
                    {t("sysHealth.zaloUpdateHint")}
                  </p>
                </div>
              )}
              <StatusRow
                label="ZALO_SEND_ENABLED"
                value={data.zaloDiagnostics.configPresent.sendEnabled ? t("sysHealth.zaloSendEnabled") : t("sysHealth.zaloSendDisabled")}
                status={data.zaloDiagnostics.configPresent.sendEnabled ? "green" : "red"}
              />
              <StatusRow
                label="ZALO_OA_ACCESS_TOKEN"
                value={data.zaloDiagnostics.configPresent.accessToken ? t("sysHealth.zaloTokenPresent") : t("sysHealth.zaloTokenMissing")}
                status={
                  !data.zaloDiagnostics.configPresent.accessToken
                    ? "red"
                    : data.zaloDiagnostics.tokenExpired
                      ? "red"
                      : "green"
                }
              />
              <MetricRow
                label={t("sysHealth.zaloBound")}
                value={data.zaloDiagnostics.boundCustomers}
              />
              <MetricRow
                label={t("sysHealth.zaloErrors")}
                value={data.zaloDiagnostics.unresolvedFailures}
                alert={data.zaloDiagnostics.unresolvedFailures > 0}
              />
              {data.zaloDiagnostics.tokenRefresh && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <StatusRow
                    label={t("sysHealth.zaloLastRefresh")}
                    value={
                      data.zaloDiagnostics.tokenRefresh.success
                        ? `${t("sysHealth.zaloRefreshOk")} — ${timeSince(data.zaloDiagnostics.tokenRefresh.lastRefreshAt)}`
                        : `${t("sysHealth.zaloRefreshFail")} — ${timeSince(data.zaloDiagnostics.tokenRefresh.lastRefreshAt)}`
                    }
                    status={data.zaloDiagnostics.tokenRefresh.success ? "green" : "red"}
                  />
                  {data.zaloDiagnostics.tokenRefresh.errorReason && (
                    <p className="text-xs text-red-500 ml-4 mt-1">
                      {data.zaloDiagnostics.tokenRefresh.errorReason}
                    </p>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Smoke Test Panel */}
          <Card title={t("sysHealth.smoke.title")}>
            <div className="mb-3">
              <button
                onClick={runSmokeTest}
                disabled={smokeLoading}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {smokeLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("sysHealth.smoke.running")}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    {t("sysHealth.smoke.run")}
                  </span>
                )}
              </button>
            </div>
            {smokeTest ? (
              <>
                {/* Overall status */}
                <div className={`mb-3 p-2.5 rounded-xl text-center text-sm font-semibold ${
                  smokeTest.overall === "ok"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : smokeTest.overall === "warning"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {smokeTest.overall === "ok" ? t("sysHealth.smoke.allOk") : smokeTest.overall === "warning" ? t("sysHealth.smoke.hasWarning") : t("sysHealth.smoke.hasError")}
                  <span className="text-xs font-normal ml-2">({smokeTest.summary.totalMs}ms)</span>
                </div>

                {/* Individual checks */}
                {smokeTest.checks.map((check) => (
                  <div key={check.key} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <StatusDot status={check.status === "ok" ? "green" : check.status === "warning" ? "yellow" : "red"} />
                      <span className="text-sm text-slate-600 truncate">{check.label}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-medium ${
                        check.status === "ok" ? "text-green-600" : check.status === "warning" ? "text-amber-600" : "text-red-600"
                      }`}>
                        {check.detail}
                      </span>
                      <span className="text-[10px] text-slate-300">{check.durationMs}ms</span>
                    </div>
                  </div>
                ))}

                {/* Summary footer */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {t("sysHealth.smoke.checkedAt")}: {formatTime(smokeTest.checkedAt)}
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    {smokeTest.summary.ok > 0 && <span className="text-green-600">{smokeTest.summary.ok} {t("sysHealth.smoke.ok")}</span>}
                    {smokeTest.summary.warning > 0 && <span className="text-amber-600">{smokeTest.summary.warning} {t("sysHealth.smoke.warnings")}</span>}
                    {smokeTest.summary.error > 0 && <span className="text-red-600">{smokeTest.summary.error} {t("sysHealth.smoke.errors")}</span>}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">
                {t("sysHealth.smoke.hint")}
              </p>
            )}
          </Card>

          {/* Operational Indicators */}
          <Card title={t("sysHealth.operational")}>
            <MetricRow
              label={t("sysHealth.unanswered")}
              value={data.operational.unansweredQuestions}
              alert={data.operational.unansweredQuestions > 10}
            />
            <MetricRow
              label={t("sysHealth.stuckPending")}
              value={data.operational.stuckPending}
              alert={data.operational.stuckPending > 0}
            />
            <MetricRow
              label={t("sysHealth.stuckDelivery")}
              value={data.operational.stuckDelivery}
              alert={data.operational.stuckDelivery > 0}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
