"use client";

import { useEffect, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

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

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [orderIds, setOrderIds] = useState("");
  const [pkgWeight, setPkgWeight] = useState("");
  const [dims, setDims] = useState({ lengthCm: "", widthCm: "", heightCm: "" });

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

  const statusColors: Record<string, string> = {
    AT_CHINA_WH: "bg-purple-100 text-purple-800",
    SHIPPING: "bg-cyan-100 text-cyan-800",
    AT_VIETNAM_WH: "bg-teal-100 text-teal-800",
    DELIVERED: "bg-green-100 text-green-800",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Package Management</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          + Create Package
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-lg shadow border p-6 mb-6">
          <form onSubmit={createPackage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Order IDs (comma-separated)</label>
              <input type="text" value={orderIds} onChange={(e) => setOrderIds(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="uuid1, uuid2, ..." required />
            </div>
            <div className="grid grid-cols-4 gap-3">
              <input type="number" step="0.001" placeholder="Weight (kg)" value={pkgWeight} onChange={(e) => setPkgWeight(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
              <input type="number" step="0.01" placeholder="Length (cm)" value={dims.lengthCm} onChange={(e) => setDims({ ...dims, lengthCm: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              <input type="number" step="0.01" placeholder="Width (cm)" value={dims.widthCm} onChange={(e) => setDims({ ...dims, widthCm: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              <input type="number" step="0.01" placeholder="Height (cm)" value={dims.heightCm} onChange={(e) => setDims({ ...dims, heightCm: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
            </div>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Create</button>
          </form>
        </div>
      )}

      {loading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-lg shadow border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Package Code</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Barcode</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Orders</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Weight</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {packages.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{p.packageCode}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.barcode}</td>
                    <td className="px-4 py-3">
                      {p.orders.map((o) => o.orderCode).join(", ") || "None"}
                    </td>
                    <td className="px-4 py-3">{p.totalWeightKg ? `${p.totalWeightKg} kg` : "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[p.status] || "bg-gray-100"}`}>
                        {p.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
