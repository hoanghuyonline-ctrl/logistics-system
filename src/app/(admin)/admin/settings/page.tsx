"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    exchange_rate: "",
    service_fee_percent: "",
    china_domestic_shipping_default: "",
    international_shipping_rate: "",
    vietnam_delivery_fee_default: "",
  });
  const [loading, setLoading] = useState(true);

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
    toast(res.ok ? "Settings saved successfully" : "Failed to save settings", res.ok ? "success" : "error");
  }

  if (loading) return <LoadingSpinner text="Loading settings..." />;

  const fields = [
    { key: "exchange_rate", label: "Exchange Rate (1 CNY = ? VND)", unit: "VND", desc: "Current CNY to VND conversion rate" },
    { key: "service_fee_percent", label: "Service Fee", unit: "%", desc: "Percentage charged on product cost" },
    { key: "china_domestic_shipping_default", label: "China Domestic Shipping (default)", unit: "VND", desc: "Default domestic shipping fee within China" },
    { key: "international_shipping_rate", label: "International Shipping (per kg)", unit: "VND/kg", desc: "Rate per kilogram for China to Vietnam shipping" },
    { key: "vietnam_delivery_fee_default", label: "Vietnam Delivery Fee (default)", unit: "VND", desc: "Default last-mile delivery fee in Vietnam" },
  ] as const;

  return (
    <div className="max-w-2xl">
      <PageHeader title="System Settings" subtitle="Configure fees, exchange rates, and shipping costs" />

      <Card title="Fee Configuration">
        <form onSubmit={save} className="space-y-6">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.01"
                  value={settings[f.key]}
                  onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
                <span className="text-sm font-medium text-slate-500 w-16 text-right">{f.unit}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{f.desc}</p>
            </div>
          ))}
          <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-sm">
            Save Settings
          </button>
        </form>
      </Card>
    </div>
  );
}
