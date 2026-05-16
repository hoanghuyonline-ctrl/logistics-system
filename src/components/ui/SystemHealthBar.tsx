"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";

interface HealthData {
  db: "ok" | "error";
  telegram: "ok" | "off";
  zalo: "ok" | "off";
  email: "ok" | "off";
  messenger: "ok" | "off";
  env: string;
}

const CACHE_MS = 60_000;

function Pill({ label, status }: { label: string; status: "ok" | "off" | "error" | "loading" }) {
  const colors = {
    ok: "bg-green-100 text-green-700 border-green-200",
    off: "bg-slate-100 text-slate-400 border-slate-200",
    error: "bg-red-100 text-red-700 border-red-200",
    loading: "bg-slate-50 text-slate-300 border-slate-100",
  };
  const dots = {
    ok: "bg-green-500",
    off: "bg-slate-300",
    error: "bg-red-500 animate-pulse",
    loading: "bg-slate-200",
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${colors[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`} />
      {label}
    </span>
  );
}

export default function SystemHealthBar() {
  const { data: session } = useSession();
  const [health, setHealth] = useState<HealthData | null>(null);
  const lastFetchRef = useRef(0);
  const inFlightRef = useRef(false);

  const role = (session?.user as Record<string, unknown>)?.role as string;
  const isAdmin = role === "ADMIN" || role === "ACCOUNTANT";

  const fetchHealth = useCallback(async () => {
    if (inFlightRef.current) return;
    if (Date.now() - lastFetchRef.current < CACHE_MS) return;
    inFlightRef.current = true;
    try {
      const res = await fetch("/api/admin/health-bar");
      if (res.ok) {
        setHealth(await res.json());
        lastFetchRef.current = Date.now();
      }
    } catch {
      /* silent */
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchHealth();
    const id = setInterval(fetchHealth, CACHE_MS);
    return () => clearInterval(id);
  }, [isAdmin, fetchHealth]);

  if (!isAdmin) return null;

  const isProd = health?.env === "production";

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-4 py-1.5 bg-white/80 border-b border-slate-100 backdrop-blur-sm">
      <span className="text-[10px] font-semibold text-slate-400 mr-1">Hệ thống:</span>
      <Pill label={health ? (health.db === "ok" ? "DB" : "DB lỗi") : "DB"} status={health?.db ?? "loading"} />
      <Pill label="Telegram" status={health?.telegram ?? "loading"} />
      <Pill label="Zalo" status={health?.zalo ?? "loading"} />
      <Pill label="Email" status={health?.email ?? "loading"} />
      <Pill label="Messenger" status={health?.messenger ?? "loading"} />
      <Pill label={isProd ? "Production" : health?.env ?? "..."} status={health ? (isProd ? "ok" : "off") : "loading"} />
    </div>
  );
}
