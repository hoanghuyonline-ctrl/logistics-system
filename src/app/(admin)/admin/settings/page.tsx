"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    exchange_rate: "",
    service_fee_percent: "",
    china_domestic_shipping_default: "",
    international_shipping_rate: "",
    vietnam_delivery_fee_default: "",
  });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings({
          exchange_rate: d.exchange_rate || "3500",
          service_fee_percent: d.service_fee_percent || "5",
          china_domestic_shipping_default: d.china_domestic_shipping_default || "50000",
          international_shipping_rate: d.international_shipping_rate || "35000",
          vietnam_delivery_fee_default: d.vietnam_delivery_fee_default || "30000",
        });
        setLoading(false);
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setMsg(res.ok ? "Settings saved!" : "Failed to save");
    setTimeout(() => setMsg(""), 3000);
  }

  if (loading) return <LoadingSpinner />;

  const fields = [
    { key: "exchange_rate", label: "Exchange Rate (1 CNY = ? VND)", unit: "VND" },
    { key: "service_fee_percent", label: "Service Fee", unit: "%" },
    { key: "china_domestic_shipping_default", label: "China Domestic Shipping (default)", unit: "VND" },
    { key: "international_shipping_rate", label: "International Shipping (per kg)", unit: "VND/kg" },
    { key: "vietnam_delivery_fee_default", label: "Vietnam Delivery Fee (default)", unit: "VND" },
  ] as const;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>

      <Card title="Fee Configuration">
        {msg && <div className="bg-green-50 text-green-700 p-2 rounded mb-3 text-sm">{msg}</div>}
        <form onSubmit={save} className="space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={settings[f.key]}
                  onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  required
                />
                <span className="text-sm text-gray-500 w-16">{f.unit}</span>
              </div>
            </div>
          ))}
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Settings</button>
        </form>
      </Card>
    </div>
  );
}
