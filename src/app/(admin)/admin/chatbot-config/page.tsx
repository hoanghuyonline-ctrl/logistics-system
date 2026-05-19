"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n";

interface QualityLog {
  id: string;
  channel: string;
  question: string;
  flag: string;
  detail: string | null;
  score: number | null;
  createdAt: string;
}

const FLAG_COLORS: Record<string, string> = {
  LOW_SCORE: "bg-amber-100 text-amber-800",
  REPEATED_QUESTION: "bg-blue-100 text-blue-800",
  FALLBACK_HUMAN: "bg-red-100 text-red-800",
  TOPIC_BLOCKED: "bg-purple-100 text-purple-800",
  CONCISE_APPLIED: "bg-green-100 text-green-800",
};

const FLAG_I18N: Record<string, string> = {
  LOW_SCORE: "chatbot.lowScore",
  REPEATED_QUESTION: "chatbot.repeated",
  FALLBACK_HUMAN: "chatbot.fallback",
  TOPIC_BLOCKED: "chatbot.topicBlocked",
  CONCISE_APPLIED: "chatbot.conciseApplied",
};

export default function ChatbotConfigPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [conciseReplies, setConciseReplies] = useState(true);
  const [avoidRepeat, setAvoidRepeat] = useState(true);
  const [fallbackHuman, setFallbackHuman] = useState(true);
  const [allowedTopics, setAllowedTopics] = useState("");
  const [minMatchScore, setMinMatchScore] = useState("3");

  const [qualitySummary, setQualitySummary] = useState<Record<string, number>>({});
  const [recentLogs, setRecentLogs] = useState<QualityLog[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/admin/chatbot-config");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        const c = data.config || {};
        setConciseReplies((c.chatbot_concise_replies ?? "true") === "true");
        setAvoidRepeat((c.chatbot_avoid_repeat ?? "true") === "true");
        setFallbackHuman((c.chatbot_fallback_human ?? "true") === "true");
        setAllowedTopics(c.chatbot_allowed_topics ?? "");
        setMinMatchScore(c.chatbot_min_match_score ?? "3");
        setQualitySummary(data.qualitySummary || {});
        setRecentLogs(data.recentLogs || []);
      } catch {
        /* ignored */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/chatbot-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatbot_concise_replies: String(conciseReplies),
          chatbot_avoid_repeat: String(avoidRepeat),
          chatbot_fallback_human: String(fallbackHuman),
          chatbot_allowed_topics: allowedTopics,
          chatbot_min_match_score: minMatchScore,
        }),
      });
      if (res.ok) {
        toast(t("chatbot.saved"), "success");
      } else {
        toast(t("chatbot.saveError"), "error");
      }
    } catch {
      toast(t("chatbot.saveError"), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const totalFlags = Object.values(qualitySummary).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <PageHeader title={t("chatbot.title")} subtitle={t("chatbot.subtitle")} />

      {/* Settings */}
      <Card>
        <div className="space-y-5">
          {/* Toggle: Concise replies */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={conciseReplies}
              onChange={(e) => setConciseReplies(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <p className="text-sm font-medium text-slate-900">{t("chatbot.conciseReplies")}</p>
              <p className="text-xs text-slate-500">{t("chatbot.conciseDesc")}</p>
            </div>
          </label>

          {/* Toggle: Avoid repeat */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={avoidRepeat}
              onChange={(e) => setAvoidRepeat(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <p className="text-sm font-medium text-slate-900">{t("chatbot.avoidRepeat")}</p>
              <p className="text-xs text-slate-500">{t("chatbot.avoidRepeatDesc")}</p>
            </div>
          </label>

          {/* Toggle: Fallback human */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={fallbackHuman}
              onChange={(e) => setFallbackHuman(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <p className="text-sm font-medium text-slate-900">{t("chatbot.fallbackHuman")}</p>
              <p className="text-xs text-slate-500">{t("chatbot.fallbackHumanDesc")}</p>
            </div>
          </label>

          {/* Min match score */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              {t("chatbot.minMatchScore")}
            </label>
            <p className="text-xs text-slate-500 mb-2">{t("chatbot.minMatchScoreDesc")}</p>
            <input
              type="number"
              min="1"
              max="50"
              value={minMatchScore}
              onChange={(e) => setMinMatchScore(e.target.value)}
              className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Allowed topics */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              {t("chatbot.allowedTopics")}
            </label>
            <p className="text-xs text-slate-500 mb-2">{t("chatbot.allowedTopicsDesc")}</p>
            <input
              type="text"
              value={allowedTopics}
              onChange={(e) => setAllowedTopics(e.target.value)}
              placeholder={t("chatbot.allowedTopicsPlaceholder")}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            onClick={saveConfig}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? t("common.loading") : t("common.save")}
          </button>
        </div>
      </Card>

      {/* Quality Summary (24h) */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">{t("chatbot.qualityTitle")}</h3>
        {totalFlags === 0 ? (
          <p className="text-xs text-slate-500">{t("chatbot.noLogs")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(qualitySummary).map(([flag, count]) => (
              <span
                key={flag}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${FLAG_COLORS[flag] || "bg-slate-100 text-slate-700"}`}
              >
                {t(FLAG_I18N[flag] || flag)}: {count}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Recent quality logs */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">{t("chatbot.recentLogs")}</h3>
        {recentLogs.length === 0 ? (
          <p className="text-xs text-slate-500">{t("chatbot.noLogs")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-2 font-medium text-slate-600">{t("chatbot.channel")}</th>
                  <th className="text-left py-2 px-2 font-medium text-slate-600">{t("chatbot.flag")}</th>
                  <th className="text-left py-2 px-2 font-medium text-slate-600">{t("chatbot.question")}</th>
                  <th className="text-left py-2 px-2 font-medium text-slate-600">{t("chatbot.score")}</th>
                  <th className="text-left py-2 px-2 font-medium text-slate-600">{t("chatbot.time")}</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 px-2">
                      <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                        {log.channel}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${FLAG_COLORS[log.flag] || "bg-slate-100 text-slate-700"}`}>
                        {t(FLAG_I18N[log.flag] || log.flag)}
                      </span>
                    </td>
                    <td className="py-2 px-2 max-w-[200px] truncate text-slate-700" title={log.question}>
                      {log.question}
                    </td>
                    <td className="py-2 px-2 text-slate-600">{log.score ?? "—"}</td>
                    <td className="py-2 px-2 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
