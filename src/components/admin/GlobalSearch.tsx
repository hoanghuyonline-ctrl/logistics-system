"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface SearchResult {
  id: string;
  code?: string;
  label: string;
  sub?: string;
  status?: string;
  description?: string;
  href: string;
}

interface SearchResults {
  orders: SearchResult[];
  packages: SearchResult[];
  customers: SearchResult[];
  leads: SearchResult[];
  issues: SearchResult[];
  query: string;
}

const CATEGORY_META: { key: keyof Omit<SearchResults, "query">; icon: string; label: string }[] = [
  { key: "orders", icon: "📦", label: "Đơn hàng" },
  { key: "packages", icon: "📫", label: "Kiện hàng" },
  { key: "customers", icon: "👥", label: "Khách hàng" },
  { key: "leads", icon: "🎯", label: "Lead" },
  { key: "issues", icon: "📝", label: "Khiếu nại" },
];

export default function GlobalSearch() {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/global-search?q=${encodeURIComponent(q)}`);
      if (r.ok) {
        const data = await r.json();
        setResults(data);
        setOpen(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 300);
  };

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (!isAdmin) return null;

  const totalResults = results
    ? CATEGORY_META.reduce((sum, c) => sum + (results[c.key] as SearchResult[]).length, 0)
    : 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results && setOpen(true)}
          placeholder="🔍 Tìm đơn, kiện, khách, lead..."
          className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder-slate-400 transition-all"
        />
        {loading && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && results && totalResults > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-[70vh] overflow-auto">
          {CATEGORY_META.map((cat) => {
            const items = results[cat.key] as SearchResult[];
            if (items.length === 0) return null;
            return (
              <div key={cat.key}>
                <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 sticky top-0">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {cat.icon} {cat.label} ({items.length})
                  </span>
                </div>
                <div className="divide-y divide-slate-50">
                  {items.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => { setOpen(false); setQuery(""); setResults(null); }}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-slate-900 truncate">{item.label}</div>
                        {(item.sub || item.description) && (
                          <div className="text-[11px] text-slate-400 truncate">
                            {item.sub || item.description}
                          </div>
                        )}
                      </div>
                      {item.status && (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                          {item.status}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && results && totalResults === 0 && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-4 text-center">
          <span className="text-sm text-slate-400">Không tìm thấy kết quả cho &ldquo;{query}&rdquo;</span>
        </div>
      )}
    </div>
  );
}
