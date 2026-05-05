"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Card from "@/components/ui/Card";

interface Order {
  id: string;
  orderCode: string;
  productName: string;
  weightKg: string | null;
  user: { fullName: string };
}

export default function ChinaPackagesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pkgWeight, setPkgWeight] = useState("");
  const [dims, setDims] = useState({ lengthCm: "", widthCm: "", heightCm: "" });
  const [msg, setMsg] = useState("");

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
      setMsg(`Package ${pkg.packageCode} created!`);
      setSelectedIds([]);
      setPkgWeight("");
      setDims({ lengthCm: "", widthCm: "", heightCm: "" });
      loadOrders();
    }
    setTimeout(() => setMsg(""), 5000);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create Packages - China Warehouse</h1>

      {msg && <div className="bg-green-50 text-green-700 p-3 rounded mb-4 text-sm">{msg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Orders at China WH ({orders.length})</h2>
            <p className="text-sm text-gray-500">Select orders to group into a package</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Order</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Product</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((o) => (
                  <tr key={o.id} className={`hover:bg-gray-50 cursor-pointer ${selectedIds.includes(o.id) ? "bg-blue-50" : ""}`}
                    onClick={() => toggleSelect(o.id)}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.includes(o.id)} onChange={() => toggleSelect(o.id)} />
                    </td>
                    <td className="px-4 py-3 font-medium">{o.orderCode}</td>
                    <td className="px-4 py-3">{o.productName}</td>
                    <td className="px-4 py-3">{o.user.fullName}</td>
                    <td className="px-4 py-3">{o.weightKg ? `${o.weightKg} kg` : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Card title="Package Details">
          <form onSubmit={createPackage} className="space-y-3">
            <p className="text-sm text-gray-600">Selected: {selectedIds.length} orders</p>
            <input type="number" step="0.001" placeholder="Total Weight (kg)" value={pkgWeight}
              onChange={(e) => setPkgWeight(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
            <input type="number" step="0.1" placeholder="Length (cm)" value={dims.lengthCm}
              onChange={(e) => setDims({ ...dims, lengthCm: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            <input type="number" step="0.1" placeholder="Width (cm)" value={dims.widthCm}
              onChange={(e) => setDims({ ...dims, widthCm: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            <input type="number" step="0.1" placeholder="Height (cm)" value={dims.heightCm}
              onChange={(e) => setDims({ ...dims, heightCm: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            <button type="submit" disabled={selectedIds.length === 0}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              Create Package
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
