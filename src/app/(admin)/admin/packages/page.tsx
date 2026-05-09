"use client";

import { useEffect, useState, useCallback } from "react";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n";

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

interface PackageWithImages extends Package {
  images?: Array<{ id: string }>;
}

const statusColors: Record<string, string> = {
  AT_CHINA_WH: "bg-violet-50 text-violet-700",
  SHIPPING: "bg-cyan-50 text-cyan-700",
  AT_VIETNAM_WH: "bg-teal-50 text-teal-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
};

export default function PackagesPage() {
  const { t } = useI18n();
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
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${t("packages.label")} - ${packageCode}</title>
      <style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:system-ui,sans-serif}
      .label{text-align:center;padding:24px;border:2px solid #000;width:360px}
      .code{font-size:18px;font-weight:700;margin-bottom:8px}
      .barcode-text{font-size:11px;color:#666;margin-top:4px}
      img{max-width:100%}
      @media print{body{margin:0}.label{border:none}}</style></head>
      <body><div class="label">
      <div class="code">${packageCode}</div>
      <img src="/api/packages/${pkgId}/barcode?format=png" alt="${t("scan.barcode")}" onload="window.print()"/>
      <div class="barcode-text">${barcode}</div>
      </div></body></html>`);
    printWindow.document.close();
  }, [t]);

  const loadPackages = useCallback(() => {
    fetch(`/api/packages?page=${page}&limit=15`)
      .then((r) => r.json())
      .then((d) => {
        setPackages(d.packages || []);
        setTotalPages(d.totalPages || 1);
        setLoading(false);
      });
  }, [page]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/packages?page=${page}&limit=15`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setPackages(d.packages || []);
        setTotalPages(d.totalPages || 1);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page]);

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
        title={t("packages.title")}
        subtitle={t("packages.subtitle")}
        action={
          <button onClick={() => setShowCreate(!showCreate)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            + {t("packages.createPackage")}
          </button>
        }
      />

      {showCreate && (
        <Card className="mb-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">{t("packages.createNewPackage")}</h2>
          <form onSubmit={createPackage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("packages.orderIds")}</label>
              <input type="text" value={orderIds} onChange={(e) => setOrderIds(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder={t("packages.orderIdsPlaceholder")} required />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">{t("orderDetail.weightKg")}</label>
                <input type="number" step="0.001" placeholder="0.000" value={pkgWeight} onChange={(e) => setPkgWeight(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">{t("packages.lengthCm")}</label>
                <input type="number" step="0.01" placeholder="0.00" value={dims.lengthCm} onChange={(e) => setDims({ ...dims, lengthCm: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">{t("packages.widthCm")}</label>
                <input type="number" step="0.01" placeholder="0.00" value={dims.widthCm} onChange={(e) => setDims({ ...dims, widthCm: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">{t("packages.heightCm")}</label>
                <input type="number" step="0.01" placeholder="0.00" value={dims.heightCm} onChange={(e) => setDims({ ...dims, heightCm: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              </div>
            </div>
            <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
              {t("packages.createPackage")}
            </button>
          </form>
        </Card>
      )}

      {loading ? <LoadingSpinner text={t("packages.loading")} /> : (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("packages.packageCode")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("scan.barcode")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("scan.orders")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("scan.weight")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.status")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("packages.created")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("packages.images")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("packages.label")}</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("common.actions")}</th>
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
                        {t(`packageStatus.${p.status}`, p.status.replace(/_/g, " "))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{(p as PackageWithImages).images?.length || 0}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => printLabel(p.id, p.packageCode, p.barcode)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        {t("packages.printLabel")}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`/admin/packages/${p.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        {t("common.view")}
                      </a>
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
