"use client";

import { STATUS_LABELS, STATUS_COLORS } from "@/types";
import { OrderStatus } from "@prisma/client";

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide ${STATUS_COLORS[status]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABELS[status]}
    </span>
  );
}
