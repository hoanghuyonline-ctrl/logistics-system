"use client";

interface MobileDataCardField {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}

interface MobileDataCardProps {
  fields: MobileDataCardField[];
  header?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  highlight?: string;
}

export default function MobileDataCard({ fields, header, actions, onClick, className = "", highlight }: MobileDataCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm p-3 ${highlight || ""} ${onClick ? "cursor-pointer active:bg-slate-50" : ""} ${className}`}
      onClick={onClick}
    >
      {header && <div className="mb-2">{header}</div>}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {fields.map((f, i) => (
          <div key={i} className={f.fullWidth ? "col-span-2" : ""}>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{f.label}</div>
            <div className="text-sm text-slate-800 mt-0.5">{f.value}</div>
          </div>
        ))}
      </div>
      {actions && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
}
