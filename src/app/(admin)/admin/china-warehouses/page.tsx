"use client";

import { useEffect, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n";

interface ChinaWarehouse {
  id: string;
  nameVi: string;
  nameZh: string;
  nameEn: string;
  addressVi: string;
  addressZh: string;
  addressEn: string;
  isActive: boolean;
  createdAt: string;
  _count: { orders: number };
}

interface WarehouseForm {
  nameVi: string;
  nameZh: string;
  nameEn: string;
  addressVi: string;
  addressZh: string;
  addressEn: string;
}

const emptyForm: WarehouseForm = {
  nameVi: "",
  nameZh: "",
  nameEn: "",
  addressVi: "",
  addressZh: "",
  addressEn: "",
};

export default function ChinaWarehousesPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [warehouses, setWarehouses] = useState<ChinaWarehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WarehouseForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [translatingField, setTranslatingField] = useState<"name" | "address" | null>(null);

  const fetchWarehouses = useCallback(async () => {
    const res = await fetch("/api/admin/china-warehouses");
    const data = await res.json();
    setWarehouses(data.warehouses || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(wh: ChinaWarehouse) {
    setEditingId(wh.id);
    setForm({
      nameVi: wh.nameVi,
      nameZh: wh.nameZh,
      nameEn: wh.nameEn,
      addressVi: wh.addressVi,
      addressZh: wh.addressZh,
      addressEn: wh.addressEn,
    });
    setShowForm(true);
  }

  async function handleTranslateField(field: "name" | "address") {
    const textToTranslate = field === "name" ? form.nameVi : form.addressVi;
    if (!textToTranslate || !textToTranslate.trim()) {
      toast("Vui lòng nhập thông tin tiếng Việt trước", "error");
      return;
    }

    setTranslatingField(field);
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToTranslate }),
      });
      if (res.ok) {
        const data = await res.json();
        if (field === "name") {
          setForm((prev) => ({
            ...prev,
            nameZh: data.zh,
            nameEn: data.en,
          }));
          toast("Đã tự động dịch tên kho bằng AI!", "success");
        } else {
          setForm((prev) => ({
            ...prev,
            addressZh: data.zh,
            addressEn: data.en,
          }));
          toast("Đã tự động dịch địa chỉ kho bằng AI!", "success");
        }
      } else {
        const data = await res.json();
        toast(data.error || "Dịch thuật thất bại", "error");
      }
    } catch {
      toast("Lỗi kết nối khi gọi AI dịch thuật", "error");
    } finally {
      setTranslatingField(null);
    }
  }

  async function handleSave() {
    if (!form.nameVi || !form.nameZh || !form.nameEn || !form.addressVi || !form.addressZh || !form.addressEn) {
      toast(t("warehouse.fillAllFields"), "error");
      return;
    }
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/china-warehouses/${editingId}`
        : "/api/admin/china-warehouses";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast(editingId ? t("warehouse.updated") : t("warehouse.created"), "success");
        setShowForm(false);
        setForm(emptyForm);
        setEditingId(null);
        await fetchWarehouses();
      } else {
        const data = await res.json();
        toast(data.error || t("warehouse.saveFailed"), "error");
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(wh: ChinaWarehouse) {
    const res = await fetch(`/api/admin/china-warehouses/${wh.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !wh.isActive }),
    });
    if (res.ok) {
      toast(
        wh.isActive ? t("warehouse.deactivated") : t("warehouse.activated"),
        "success"
      );
      await fetchWarehouses();
    }
  }

  async function handleDelete(wh: ChinaWarehouse) {
    if (!confirm(t("warehouse.confirmDelete"))) return;
    const res = await fetch(`/api/admin/china-warehouses/${wh.id}`, { method: "DELETE" });
    if (res.ok) {
      toast(t("warehouse.deleted"), "success");
      await fetchWarehouses();
    } else {
      const data = await res.json();
      toast(data.error || t("warehouse.deleteFailed"), "error");
    }
  }

  if (loading) return <LoadingSpinner text={t("common.loading")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("warehouse.title")}
        subtitle={t("warehouse.subtitle")}
        action={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            + {t("warehouse.addNew")}
          </button>
        }
      />

      {showForm && (
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {editingId ? t("warehouse.editWarehouse") : t("warehouse.addWarehouse")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-500">🇻🇳 {t("warehouse.nameVi")}</label>
                <button
                  type="button"
                  onClick={() => handleTranslateField("name")}
                  disabled={translatingField === "name" || !form.nameVi}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-0.5 cursor-pointer"
                >
                  {translatingField === "name" ? "⏳ Đang dịch..." : "✨ Tự dịch AI"}
                </button>
              </div>
              <input
                type="text"
                value={form.nameVi}
                onChange={(e) => setForm({ ...form, nameVi: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Kho Bằng Tường"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">🇨🇳 {t("warehouse.nameZh")}</label>
              <input
                type="text"
                value={form.nameZh}
                onChange={(e) => setForm({ ...form, nameZh: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="凭祥仓"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">🇬🇧 {t("warehouse.nameEn")}</label>
              <input
                type="text"
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Pingxiang Warehouse"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-500">🇻🇳 {t("warehouse.addressVi")}</label>
                <button
                  type="button"
                  onClick={() => handleTranslateField("address")}
                  disabled={translatingField === "address" || !form.addressVi}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-0.5 cursor-pointer"
                >
                  {translatingField === "address" ? "⏳ Đang dịch..." : "✨ Tự dịch AI"}
                </button>
              </div>
              <textarea
                value={form.addressVi}
                onChange={(e) => setForm({ ...form, addressVi: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">🇨🇳 {t("warehouse.addressZh")}</label>
              <textarea
                value={form.addressZh}
                onChange={(e) => setForm({ ...form, addressZh: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">🇬🇧 {t("warehouse.addressEn")}</label>
              <textarea
                value={form.addressEn}
                onChange={(e) => setForm({ ...form, addressEn: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? t("common.saving") : t("common.save")}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="px-5 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors"
            >
              {t("common.cancel")}
            </button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {warehouses.map((wh) => (
          <Card key={wh.id}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-semibold text-slate-900">🏭 {wh.nameVi}</span>
                  {!wh.isActive && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-100 text-red-600">
                      {t("warehouse.inactive")}
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-500 mb-2">
                  <span className="mr-3">🇨🇳 {wh.nameZh}</span>
                  <span>🇬🇧 {wh.nameEn}</span>
                </div>
                <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2 mb-2">
                  <p>🇻🇳 {wh.addressVi}</p>
                  <p className="mt-1">🇨🇳 {wh.addressZh}</p>
                  <p className="mt-1">🇬🇧 {wh.addressEn}</p>
                </div>
                <div className="text-xs text-slate-400">
                  {t("warehouse.ordersCount")}: {wh._count.orders}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2 shrink-0">
                <button
                  onClick={() => openEdit(wh)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title={t("common.edit")}
                >
                  ✏️
                </button>
                <button
                  onClick={() => toggleActive(wh)}
                  className={`p-1.5 rounded-lg transition-colors ${wh.isActive ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50" : "text-slate-400 hover:text-green-600 hover:bg-green-50"}`}
                  title={wh.isActive ? t("warehouse.deactivate") : t("warehouse.activate")}
                >
                  {wh.isActive ? "⏸️" : "▶️"}
                </button>
                {wh._count.orders === 0 && (
                  <button
                    onClick={() => handleDelete(wh)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title={t("common.delete")}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {warehouses.length === 0 && !showForm && (
        <Card>
          <div className="text-center py-8 text-slate-400">
            <div className="text-4xl mb-2">🏭</div>
            <p className="font-medium">{t("warehouse.empty")}</p>
            <p className="text-sm mt-1">{t("warehouse.emptyDesc")}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
