"use client";

import { STATUS_COLORS } from "@/types";
import { OrderStatus } from "@/types";
import { useI18n } from "@/lib/i18n";

export default function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide ${STATUS_COLORS[status as OrderStatus] || "bg-slate-100 text-slate-700"}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {t(`status.${status}`)}
    </span>
  );
}
