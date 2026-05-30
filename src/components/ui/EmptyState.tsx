import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { safeEmoji } from "@/lib/emoji-utils";

interface EmptyStateProps {
  /** Accepts emoji string or React node (e.g. a Lucide icon component).
   *  String values are sanitized via safeEmoji() to prevent surrogate-pair rendering glitches.
   *  Prefer passing a Lucide icon: icon={<Package className="w-8 h-8 text-slate-400" />} */
  icon?: string | React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

const DEFAULT_ICON = <FolderOpen className="w-8 h-8 text-slate-400" />;

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  let renderedIcon: React.ReactNode;
  if (icon === undefined || icon === null) {
    renderedIcon = DEFAULT_ICON;
  } else if (typeof icon === "string") {
    renderedIcon = safeEmoji(icon, "") || DEFAULT_ICON;
  } else {
    renderedIcon = icon;
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        {renderedIcon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 text-center max-w-sm mb-4">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
