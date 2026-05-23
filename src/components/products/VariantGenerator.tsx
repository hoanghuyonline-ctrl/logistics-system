"use client";

import { useState, useEffect, useCallback } from "react";

export interface VariantGroup {
  name: string;
  values: string[];
}

export interface VariantRow {
  combination: Record<string, string>;
  price: string;
  sku: string;
  stock: string;
  imageIndex: number | null;
}

interface Props {
  groups: VariantGroup[];
  rows: VariantRow[];
  onGroupsChange: (groups: VariantGroup[]) => void;
  onRowsChange: (rows: VariantRow[]) => void;
  imageCount: number;
}

function cartesian(groups: VariantGroup[]): Record<string, string>[] {
  if (groups.length === 0) return [];
  const valid = groups.filter((g) => g.name && g.values.length > 0);
  if (valid.length === 0) return [];

  return valid.reduce<Record<string, string>[]>(
    (acc, group) => {
      if (acc.length === 0) {
        return group.values.map((v) => ({ [group.name]: v }));
      }
      const result: Record<string, string>[] = [];
      for (const existing of acc) {
        for (const val of group.values) {
          result.push({ ...existing, [group.name]: val });
        }
      }
      return result;
    },
    [],
  );
}

function comboKey(combo: Record<string, string>): string {
  return Object.entries(combo).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`).join("|");
}

export default function VariantGenerator({ groups, rows, onGroupsChange, onRowsChange, imageCount }: Props) {
  const [newValueInputs, setNewValueInputs] = useState<Record<number, string>>({});

  const regenerateRows = useCallback((newGroups: VariantGroup[]) => {
    const combos = cartesian(newGroups);
    const existingMap = new Map(rows.map((r) => [comboKey(r.combination), r]));

    const newRows = combos.map((combo) => {
      const key = comboKey(combo);
      const existing = existingMap.get(key);
      return existing ? { ...existing, combination: combo } : {
        combination: combo,
        price: "",
        sku: "",
        stock: "",
        imageIndex: null,
      };
    });
    onRowsChange(newRows);
  }, [rows, onRowsChange]);

  const addGroup = () => {
    onGroupsChange([...groups, { name: "", values: [] }]);
  };

  const removeGroup = (idx: number) => {
    const next = groups.filter((_, i) => i !== idx);
    onGroupsChange(next);
    regenerateRows(next);
  };

  const updateGroupName = (idx: number, name: string) => {
    const next = groups.map((g, i) => (i === idx ? { ...g, name } : g));
    onGroupsChange(next);
  };

  const addValue = (groupIdx: number) => {
    const val = (newValueInputs[groupIdx] || "").trim();
    if (!val) return;
    if (groups[groupIdx].values.includes(val)) return;
    const next = groups.map((g, i) =>
      i === groupIdx ? { ...g, values: [...g.values, val] } : g,
    );
    onGroupsChange(next);
    setNewValueInputs({ ...newValueInputs, [groupIdx]: "" });
    regenerateRows(next);
  };

  const removeValue = (groupIdx: number, valIdx: number) => {
    const next = groups.map((g, i) =>
      i === groupIdx ? { ...g, values: g.values.filter((_, vi) => vi !== valIdx) } : g,
    );
    onGroupsChange(next);
    regenerateRows(next);
  };

  const updateRow = (rowIdx: number, field: keyof VariantRow, value: string | number | null) => {
    onRowsChange(rows.map((r, i) => (i === rowIdx ? { ...r, [field]: value } : r)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Nhóm biến thể</span>
        <button
          type="button"
          onClick={addGroup}
          className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium"
        >
          + Thêm nhóm
        </button>
      </div>

      {groups.map((group, gIdx) => (
        <div key={gIdx} className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <input
              value={group.name}
              onChange={(e) => updateGroupName(gIdx, e.target.value)}
              onBlur={() => regenerateRows(groups)}
              placeholder="Tên nhóm (VD: Màu sắc, Kích thước)"
              className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => removeGroup(gIdx)}
              className="text-red-400 hover:text-red-600 text-sm"
            >
              Xóa
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {group.values.map((val, vIdx) => (
              <span
                key={vIdx}
                className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-full px-2.5 py-1 text-xs text-slate-700"
              >
                {val}
                <button type="button" onClick={() => removeValue(gIdx, vIdx)} className="text-slate-400 hover:text-red-500">×</button>
              </span>
            ))}
            <div className="flex items-center gap-1">
              <input
                value={newValueInputs[gIdx] || ""}
                onChange={(e) => setNewValueInputs({ ...newValueInputs, [gIdx]: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addValue(gIdx); } }}
                placeholder="Thêm giá trị..."
                className="border border-slate-300 rounded-full px-2.5 py-1 text-xs w-28"
              />
              <button
                type="button"
                onClick={() => addValue(gIdx)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                +
              </button>
            </div>
          </div>
        </div>
      ))}

      {rows.length > 0 && (
        <div className="mt-4">
          <span className="text-sm font-medium text-slate-700 block mb-2">
            Bảng biến thể ({rows.length} kết hợp)
          </span>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {groups.filter((g) => g.name).map((g) => (
                    <th key={g.name} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 border-b">{g.name}</th>
                  ))}
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 border-b">Giá (VND)</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 border-b">SKU</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 border-b">Kho</th>
                  {imageCount > 0 && (
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 border-b">Ảnh #</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-slate-100 last:border-0">
                    {groups.filter((g) => g.name).map((g) => (
                      <td key={g.name} className="px-3 py-2 text-slate-700 font-medium">{row.combination[g.name]}</td>
                    ))}
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        value={row.price}
                        onChange={(e) => updateRow(rIdx, "price", e.target.value)}
                        placeholder="0"
                        className="w-28 border border-slate-200 rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        value={row.sku}
                        onChange={(e) => updateRow(rIdx, "sku", e.target.value)}
                        placeholder="SKU"
                        className="w-28 border border-slate-200 rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        value={row.stock}
                        onChange={(e) => updateRow(rIdx, "stock", e.target.value)}
                        placeholder="0"
                        className="w-20 border border-slate-200 rounded px-2 py-1 text-sm"
                      />
                    </td>
                    {imageCount > 0 && (
                      <td className="px-2 py-1.5">
                        <select
                          value={row.imageIndex ?? ""}
                          onChange={(e) => updateRow(rIdx, "imageIndex", e.target.value ? Number(e.target.value) : null)}
                          className="w-16 border border-slate-200 rounded px-2 py-1 text-sm"
                        >
                          <option value="">—</option>
                          {Array.from({ length: imageCount }, (_, i) => (
                            <option key={i} value={i}>#{i + 1}</option>
                          ))}
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
