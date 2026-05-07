interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  trend?: { value: string; positive?: boolean };
}

export default function KPICard({ title, value, subtitle, icon, color = "blue", trend }: KPICardProps) {
  const iconColors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    yellow: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-violet-50 text-violet-600",
    cyan: "bg-cyan-50 text-cyan-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  const borderAccent: Record<string, string> = {
    blue: "border-l-blue-500",
    green: "border-l-emerald-500",
    yellow: "border-l-amber-500",
    red: "border-l-red-500",
    purple: "border-l-violet-500",
    cyan: "border-l-cyan-500",
    indigo: "border-l-indigo-500",
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-6 border-l-4 ${borderAccent[color] || borderAccent.blue}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-medium ${trend.positive ? "text-emerald-600" : "text-red-600"}`}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${iconColors[color] || iconColors.blue}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
