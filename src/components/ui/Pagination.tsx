"use client";

import { useI18n } from "@/lib/i18n";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const { t } = useI18n();

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-t border-slate-100 gap-2">
      <p className="text-xs sm:text-sm text-slate-500 shrink-0">
        <span className="font-medium text-slate-700">{page}</span>/{totalPages}
      </p>
      <div className="flex gap-1.5 sm:gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span className="hidden sm:inline">← {t("pagination.previous")}</span>
          <span className="sm:hidden">←</span>
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span className="hidden sm:inline">{t("pagination.next")} →</span>
          <span className="sm:hidden">→</span>
        </button>
      </div>
    </div>
  );
}
