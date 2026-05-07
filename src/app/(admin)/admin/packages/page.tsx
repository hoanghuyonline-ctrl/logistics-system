"use client";

import { useEffect, useState, useCallback } from "react";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

interface Package {
  id: string;
  packageCode: string;
  barcode: string;
  totalWeightKg: string | null;
  status: string;
  createdAt: string;
  creator: { fullName: string };
  orders: Array<{ id: string; orderCode: string; productName: string }>;
}

const statusColors: Record<string, string> = {
  AT_CHINA_WH: "bg-violet-50 text-violet-700",
  SHIPPING: "bg-cyan-50 text-cyan-700",
  AT_VIETNAM_WH: "bg-teal-50 text-teal-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [orderIds, setOrderIds] = useState("");
  const [pkgWeight, setPkgWeight] = useState("");
  const [dims, setDims] = useState({ lengthCm: "", widthCm: "", heightCm: "" });

  const printLabel = useCallback((pkgId: string, packageCode: string, barcode: string) => {
    const printWindow = window.open("", "_blank", "width=420,height=340");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Label - ${packageCode}</title>
      <style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:system-ui,sans-serif}
      .label{text-align:center;padding:24px;border:2px solid #000;width:360px}
      .code{font-size:18px;font-weight:700;margin-bottom:8px}
      .barcode-text{font-size:11px;color:#666;margin-top:4px}
      img{max-width:100%}
      @media print{body{margin:0}.label{border:none}}</style></head>
      <body><div class="label">
      <div class="code">${packageCode}</div>
      <img src="/api/packages/${pkgId}/barcode?format=png" alt="barcode" onload="window.print()"/>
      <div class="barcode-text">${barcode}</div>
      </div></body></html>`);
    printWindow.document.close();
  }, []);

  function loadPackages() {
    setLoading(true);
    fetch(`/api/packages?page=${page}&limit=15`)
      .then((r) => r.json())
      .then((d) => {
        setPackages(d.packages || []);
        setTotalPages(d.totalPages || 1);
        setLoading(false);
      });
  }

  useEffect(() => { loadPackages(); }, [page]);

  async function createPackage(e: React.FormEvent) {
    e.preventDefault();
    const ids = orderIds.split(",").map((s) => s.trim()).filter(Boolean);
    await fetch("/api/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderIds: ids, totalWeightKg: pkgWeight || null, ...dims }),
    });
    setShowCreate(false);
    setOrderIds("");
    setPkgWeight("");
    setDims({ lengthCm: "", widthCm: "", heightCm: "" });
    loadPackages();
  }

  return (
    <div>
      <PageHeader
        title="Package Management"
        subtitle="Create and manage shipping packages"
        action={
          <button onClick={() => setShowCreate(!showCreate)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            + Create Package
          </button>
        }
      />

      {showCreate && (
        <Card className="mb-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Create New Package</h2>
          <form onSubmit={createPackage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Order IDs (comma-separated)</label>
              <input type="text" value={orderIds} onChange={(e) => setOrderIds(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="uuid1, uuid2, ..." required />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Weight (kg)</label>
                <input type="number" step="0.001" placeholder="0.000" value={pkgWeight} onChange={(e) => setPkgWeight(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Length (cm)</label>
                <input type="number" step="0.01" placeholder="0.00" value={dims.lengthCm} onChange={(e) => setDims({ ...dims, lengthCm: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Width (cm)</label>
                <input type="number" step="0.01" placeholder="0.00" value={dims.widthCm} onChange={(e) => setDims({ ...dims, widthCm: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Height (cm)</label>
                <input type="number" step="0.01" placeholder="0.00" value={dims.heightCm} onChange={(e) => setDims({ ...dims, heightCm: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              </div>
            </div>
            <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
              Create Package
            </button>
          </form>
        </Card>
      )}

      {loading ? <LoadingSpinner text="Loading packages..." /> : (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Package Code</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Barcode</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Weight</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Label</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {packages.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{p.packageCode}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-slate-50 px-2.5 py-1 rounded-lg text-slate-700">{p.barcode}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{p.orders.map((o) => o.orderCode).join(", ")}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{p.totalWeightKg || "—"} kg</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${statusColors[p.status] || "bg-slate-100 text-slate-700"}`}>
                        {p.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => printLabel(p.id, p.packageCode, p.barcode)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        🖨 Print Label
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </Card>
      )}
    </div>
  );
}
