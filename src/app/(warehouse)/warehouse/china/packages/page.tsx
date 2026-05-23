"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import MobileDataCard from "@/components/ui/MobileDataCard";
import { useToast } from "@/components/ui/Toast";

interface Order {
  id: string;
  orderCode: string;
  productName: string;
  weightKg: string | null;
  user: { fullName: string };
}

export default function ChinaPackagesPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pkgWeight, setPkgWeight] = useState("");
  const [dims, setDims] = useState({ lengthCm: "", widthCm: "", heightCm: "" });

  function loadOrders() {
    fetch("/api/orders?status=ARRIVED_CHINA_WH&limit=50")
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders || []); setLoading(false); });
  }

  useEffect(() => { loadOrders(); }, []);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function createPackage(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    const res = await fetch("/api/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderIds: selectedIds,
        totalWeightKg: pkgWeight || null,
        lengthCm: dims.lengthCm || null,
        widthCm: dims.widthCm || null,
        heightCm: dims.heightCm || null,
      }),
    });
    if (res.ok) {
      const pkg = await res.json();
      toast(`Package ${pkg.packageCode} created!`, "success");
      setSelectedIds([]);
      setPkgWeight("");
      setDims({ lengthCm: "", widthCm: "", heightCm: "" });
      loadOrders();
    }
  }

  if (loading) return <LoadingSpinner text="Loading orders..." />;

  return (
    <div>
      <PageHeader title="Create Packages" subtitle="Group orders into packages for shipping" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title={`Orders at China WH (${orders.length})`} noPadding>
            {/* Mobile card view */}
            <div className="md:hidden flex flex-col gap-2 p-2">
              {orders.map((o) => (
                <MobileDataCard
                  key={o.id}
                  onClick={() => toggleSelect(o.id)}
                  className={selectedIds.includes(o.id) ? "bg-blue-50 border-blue-300" : ""}
                  header={
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={selectedIds.includes(o.id)} onChange={() => toggleSelect(o.id)}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                      <span className="text-sm font-semibold text-slate-900">{o.orderCode}</span>
                    </div>
                  }
                  fields={[
                    { label: "Product", value: o.productName, fullWidth: true },
                    { label: "Customer", value: o.user.fullName },
                    { label: "Weight", value: o.weightKg ? `${o.weightKg} kg` : "\u2014" },
                  ]}
                />
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-3.5 w-12"></th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map((o) => (
                    <tr key={o.id}
                      className={`cursor-pointer transition-colors ${selectedIds.includes(o.id) ? "bg-blue-50" : "hover:bg-slate-50/50"}`}
                      onClick={() => toggleSelect(o.id)}>
                      <td className="px-4 py-3.5">
                        <input type="checkbox" checked={selectedIds.includes(o.id)} onChange={() => toggleSelect(o.id)}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-slate-900">{o.orderCode}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-700">{o.productName}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-700">{o.user.fullName}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-700">{o.weightKg ? `${o.weightKg} kg` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card title="Package Details">
          <form onSubmit={createPackage} className="space-y-4">
            <div className="bg-blue-50 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-blue-700">Selected: {selectedIds.length} order{selectedIds.length !== 1 ? "s" : ""}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Total Weight (kg)</label>
              <input type="number" step="0.001" placeholder="0.000" value={pkgWeight}
                onChange={(e) => setPkgWeight(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Length (cm)</label>
              <input type="number" step="0.1" placeholder="0.0" value={dims.lengthCm}
                onChange={(e) => setDims({ ...dims, lengthCm: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Width (cm)</label>
              <input type="number" step="0.1" placeholder="0.0" value={dims.widthCm}
                onChange={(e) => setDims({ ...dims, widthCm: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Height (cm)</label>
              <input type="number" step="0.1" placeholder="0.0" value={dims.heightCm}
                onChange={(e) => setDims({ ...dims, heightCm: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
            </div>
            <button type="submit" disabled={selectedIds.length === 0}
              className="w-full py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm text-sm">
              Create Package
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
