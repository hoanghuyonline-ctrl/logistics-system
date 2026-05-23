"use client";

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  emptyMessage?: string;
  emptyIcon?: string;
  onRowClick?: (item: T) => void;
  mobileCard?: (item: T) => React.ReactNode;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  emptyMessage = "No data found",
  emptyIcon = "📭",
  onRowClick,
  mobileCard,
}: DataTableProps<T>) {
  return (
    <>
      {/* Mobile card view */}
      {mobileCard && (
        <div className="md:hidden flex flex-col gap-2 p-2">
          {data.map((item) => (
            <div
              key={String(item[keyField])}
              className={onRowClick ? "cursor-pointer" : ""}
              onClick={() => onRowClick?.(item)}
            >
              {mobileCard(item)}
            </div>
          ))}
          {data.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12">
              <span className="text-3xl">{emptyIcon}</span>
              <p className="text-sm text-slate-500">{emptyMessage}</p>
            </div>
          )}
        </div>
      )}

      {/* Desktop table view */}
      <div className={`overflow-x-auto ${mobileCard ? "hidden md:block" : ""}`}>
        <table className={`w-full ${!mobileCard ? "mobile-cards" : ""}`}>
          <thead>
            <tr className="border-b border-slate-100">
              {columns.map((col) => (
                <th key={col.key} className={`px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ${col.className || ""}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((item) => (
              <tr
                key={String(item[keyField])}
                className={`hover:bg-slate-50/50 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td key={col.key} data-label={col.label} className={`px-6 py-4 text-sm text-slate-700 ${col.className || ""}`}>
                    {col.render ? col.render(item) : String(item[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">{emptyIcon}</span>
                    <p className="text-sm text-slate-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
