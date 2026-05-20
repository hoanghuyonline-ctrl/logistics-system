"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  estimatedPrice: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface SalesRequest {
  id: string;
  requestCode: string;
  productName: string;
  quantity: number;
  estimatedTotal: string | null;
  confirmedPrice: string | null;
  status: string;
  adminNote: string | null;
  customerNote: string | null;
  paidAt: string | null;
  paidFromWallet: boolean;
  createdAt: string;
  customer: { id: string; fullName: string; email: string; phone: string | null };
  product: { id: string; name: string; imageUrl: string | null } | null;
  confirmedBy: { id: string; fullName: string } | null;
}

const STATUS_OPTIONS = ["NEW", "CONTACTED", "PRICE_CONFIRMED", "PAID", "PROCESSING", "COMPLETED", "CANCELLED"];
const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700",
  CONTACTED: "bg-amber-50 text-amber-700",
  PRICE_CONFIRMED: "bg-purple-50 text-purple-700",
  PAID: "bg-green-50 text-green-700",
  PROCESSING: "bg-indigo-50 text-indigo-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  NEW: ["CONTACTED", "PRICE_CONFIRMED", "CANCELLED"],
  CONTACTED: ["PRICE_CONFIRMED", "CANCELLED"],
  PRICE_CONFIRMED: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["COMPLETED", "CANCELLED"],
};

export default function AdminSalesPage() {
  const { t } = useI18n();
  const { toast: showToast } = useToast();

  const [tab, setTab] = useState<"products" | "requests">("requests");

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState({ name: "", description: "", category: "", estimatedPrice: "", imageUrl: "", sortOrder: "0" });
  const [prodSaving, setProdSaving] = useState(false);

  // Requests state
  const [requests, setRequests] = useState<SalesRequest[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqPage, setReqPage] = useState(1);
  const [reqTotal, setReqTotal] = useState(0);
  const [reqTotalPages, setReqTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmPrice, setConfirmPrice] = useState("");
  const [adminNoteId, setAdminNoteId] = useState<string | null>(null);
  const [adminNoteText, setAdminNoteText] = useState("");

  const fetchProducts = useCallback(async () => {
    setProdLoading(true);
    try {
      const res = await fetch("/api/products?all=1");
      if (res.ok) setProducts(await res.json());
    } catch { /* */ } finally {
      setProdLoading(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setReqLoading(true);
    try {
      const params = new URLSearchParams({ page: String(reqPage), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/sales-requests?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        setReqTotal(data.total || 0);
        setReqTotalPages(data.totalPages || 1);
      }
    } catch { /* */ } finally {
      setReqLoading(false);
    }
  }, [reqPage, statusFilter, searchQuery]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      NEW: t("sales.statusNew"),
      CONTACTED: t("sales.statusContacted"),
      PRICE_CONFIRMED: t("sales.statusPriceConfirmed"),
      PAID: t("sales.statusPaid"),
      PROCESSING: t("sales.statusProcessing"),
      COMPLETED: t("sales.statusCompleted"),
      CANCELLED: t("sales.statusCancelled"),
    };
    return map[status] || status;
  };

  // Product CRUD
  const resetProdForm = () => setProdForm({ name: "", description: "", category: "", estimatedPrice: "", imageUrl: "", sortOrder: "0" });

  const handleSaveProduct = async () => {
    setProdSaving(true);
    try {
      const payload = {
        name: prodForm.name,
        description: prodForm.description || null,
        category: prodForm.category || null,
        estimatedPrice: prodForm.estimatedPrice || null,
        imageUrl: prodForm.imageUrl || null,
        sortOrder: prodForm.sortOrder || "0",
      };
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        showToast(t("sales.productSaved"), "success");
        setShowAddProduct(false);
        setEditingProduct(null);
        resetProdForm();
        fetchProducts();
      } else {
        const err = await res.json();
        showToast(err.error || "Error", "error");
      }
    } catch {
      showToast("Error", "error");
    } finally {
      setProdSaving(false);
    }
  };

  const handleToggleProduct = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      if (res.ok) fetchProducts();
    } catch { /* */ }
  };

  const startEdit = (p: Product) => {
    setEditingProduct(p);
    setProdForm({
      name: p.name,
      description: p.description || "",
      category: p.category || "",
      estimatedPrice: p.estimatedPrice || "",
      imageUrl: p.imageUrl || "",
      sortOrder: String(p.sortOrder),
    });
    setShowAddProduct(true);
  };

  // Request actions
  const handleConfirmPrice = async (id: string) => {
    if (!confirmPrice || parseFloat(confirmPrice) <= 0) return;
    try {
      const res = await fetch(`/api/sales-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmedPrice: confirmPrice, status: "PRICE_CONFIRMED" }),
      });
      if (res.ok) {
        showToast(t("sales.priceConfirmed"), "success");
        setConfirmingId(null);
        setConfirmPrice("");
        fetchRequests();
      } else {
        const err = await res.json();
        showToast(err.error || "Error", "error");
      }
    } catch {
      showToast("Error", "error");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/sales-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(t("sales.statusUpdated"), "success");
        fetchRequests();
      } else {
        const err = await res.json();
        showToast(err.error || "Error", "error");
      }
    } catch {
      showToast("Error", "error");
    }
  };

  const handleSaveNote = async (id: string) => {
    try {
      const res = await fetch(`/api/sales-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: adminNoteText }),
      });
      if (res.ok) {
        setAdminNoteId(null);
        setAdminNoteText("");
        fetchRequests();
      }
    } catch { /* */ }
  };

  return (
    <div>
      <PageHeader title={t("sales.adminTitle")} subtitle={t("sales.adminSubtitle")} />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("requests")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === "requests" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
        >
          {t("sales.requestsTab")} ({reqTotal})
        </button>
        <button
          onClick={() => setTab("products")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === "products" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
        >
          {t("sales.productsTab")} ({products.length})
        </button>
      </div>

      {/* ===== Products Tab ===== */}
      {tab === "products" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800">{t("sales.productsTab")}</h3>
            <button
              onClick={() => { resetProdForm(); setEditingProduct(null); setShowAddProduct(true); }}
              className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
            >
              + {t("sales.addProduct")}
            </button>
          </div>

          {/* Add/Edit form */}
          {showAddProduct && (
            <Card className="mb-4">
              <h4 className="font-semibold mb-3">{editingProduct ? t("sales.editProduct") : t("sales.addProduct")}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-600 block mb-1">{t("sales.productName")} *</label>
                  <input value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm text-slate-600 block mb-1">{t("sales.productCategory")}</label>
                  <input value={prodForm.category} onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm text-slate-600 block mb-1">{t("sales.productPrice")}</label>
                  <input type="number" value={prodForm.estimatedPrice} onChange={(e) => setProdForm({ ...prodForm, estimatedPrice: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm text-slate-600 block mb-1">{t("sales.productImage")}</label>
                  <input value={prodForm.imageUrl} onChange={(e) => setProdForm({ ...prodForm, imageUrl: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" placeholder="https://..." />
                </div>
                <div>
                  <label className="text-sm text-slate-600 block mb-1">{t("sales.productSort")}</label>
                  <input type="number" value={prodForm.sortOrder} onChange={(e) => setProdForm({ ...prodForm, sortOrder: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm text-slate-600 block mb-1">{t("sales.productDesc")}</label>
                  <textarea value={prodForm.description} onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 text-sm resize-none h-16" />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => { setShowAddProduct(false); setEditingProduct(null); }} className="px-3 py-1.5 border border-slate-300 rounded text-sm text-slate-600">{t("common.cancel")}</button>
                <button onClick={handleSaveProduct} disabled={!prodForm.name || prodSaving} className="px-3 py-1.5 bg-orange-500 text-white rounded text-sm font-medium disabled:opacity-50">{prodSaving ? t("common.loading") : t("common.save")}</button>
              </div>
            </Card>
          )}

          {prodLoading ? <LoadingSpinner /> : (
            <div className="space-y-2">
              {products.map((p) => (
                <div key={p.id} className={`flex items-center gap-3 bg-white rounded-lg border p-3 ${!p.isActive ? "opacity-50" : ""}`}>
                  <div className="w-12 h-12 bg-slate-50 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-lg">🛍️</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-slate-900">{p.name}</h4>
                    <div className="text-xs text-slate-400">
                      {p.category && <span className="mr-2">{p.category}</span>}
                      {p.estimatedPrice && <span className="text-orange-600 font-medium">{parseFloat(p.estimatedPrice).toLocaleString("vi-VN")} ₫</span>}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {p.isActive ? t("sales.productActive") : t("sales.productHidden")}
                  </span>
                  <button onClick={() => handleToggleProduct(p)} className="text-xs text-slate-400 hover:text-slate-600">{p.isActive ? "Ẩn" : "Hiện"}</button>
                  <button onClick={() => startEdit(p)} className="text-xs text-blue-600 hover:underline">{t("common.edit")}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== Requests Tab ===== */}
      {tab === "requests" && (
        <div>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setReqPage(1); }}
              placeholder={t("common.search")}
              className="border border-slate-300 rounded px-3 py-1.5 text-sm w-48"
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setReqPage(1); }}
              className="border border-slate-300 rounded px-3 py-1.5 text-sm"
            >
              <option value="">{t("common.status")}</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
          </div>

          {reqLoading ? <LoadingSpinner /> : (
            <>
              <div className="space-y-3">
                {requests.map((req) => {
                  const transitions = VALID_TRANSITIONS[req.status] || [];
                  return (
                    <Card key={req.id} className="!p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-mono text-slate-400">{req.requestCode}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[req.status] || ""}`}>
                              {statusLabel(req.status)}
                            </span>
                            {req.paidFromWallet && <span className="text-xs text-green-600">💰 Wallet</span>}
                          </div>
                          <h4 className="font-medium text-slate-900">{req.productName} × {req.quantity}</h4>
                          <div className="text-sm text-slate-500 mt-0.5">
                            👤 {req.customer.fullName} {req.customer.phone && `• ${req.customer.phone}`}
                          </div>
                          <div className="text-sm text-slate-500 mt-0.5">
                            {req.estimatedTotal && <span className="mr-3">{t("sales.estimatedTotal")}: {parseFloat(req.estimatedTotal).toLocaleString("vi-VN")} ₫</span>}
                            {req.confirmedPrice && <span className="font-semibold text-orange-600">{t("sales.confirmedPrice")}: {parseFloat(req.confirmedPrice).toLocaleString("vi-VN")} ₫</span>}
                          </div>
                          {req.customerNote && <p className="text-xs text-slate-400 mt-1">KH: {req.customerNote}</p>}
                          {req.adminNote && <p className="text-xs text-blue-600 mt-1">📝 {req.adminNote}</p>}
                          <p className="text-xs text-slate-300 mt-1">{new Date(req.createdAt).toLocaleString("vi-VN")}</p>
                        </div>
                      </div>

                      {/* Admin actions */}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                        {/* Confirm price button */}
                        {(req.status === "NEW" || req.status === "CONTACTED") && (
                          confirmingId === req.id ? (
                            <div className="flex gap-1 items-center">
                              <input
                                type="number"
                                value={confirmPrice}
                                onChange={(e) => setConfirmPrice(e.target.value)}
                                placeholder={t("sales.enterPrice")}
                                className="border border-slate-300 rounded px-2 py-1 text-sm w-32"
                              />
                              <button onClick={() => handleConfirmPrice(req.id)} className="px-2 py-1 bg-purple-600 text-white rounded text-xs font-medium">OK</button>
                              <button onClick={() => setConfirmingId(null)} className="px-2 py-1 text-xs text-slate-400">✕</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setConfirmingId(req.id); setConfirmPrice(req.estimatedTotal || ""); }}
                              className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium hover:bg-purple-100"
                            >
                              {t("sales.confirmPrice")}
                            </button>
                          )
                        )}

                        {/* Status transition buttons */}
                        {transitions.filter((s) => s !== "CANCELLED").map((nextStatus) => (
                          <button
                            key={nextStatus}
                            onClick={() => handleUpdateStatus(req.id, nextStatus)}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium hover:bg-slate-200"
                          >
                            → {statusLabel(nextStatus)}
                          </button>
                        ))}

                        {/* Cancel */}
                        {transitions.includes("CANCELLED") && (
                          <button
                            onClick={() => handleUpdateStatus(req.id, "CANCELLED")}
                            className="px-2.5 py-1 bg-red-50 text-red-600 rounded text-xs font-medium hover:bg-red-100"
                          >
                            {t("sales.statusCancelled")}
                          </button>
                        )}

                        {/* Admin note */}
                        {adminNoteId === req.id ? (
                          <div className="flex gap-1 items-center w-full mt-1">
                            <input
                              value={adminNoteText}
                              onChange={(e) => setAdminNoteText(e.target.value)}
                              placeholder={t("sales.adminNote")}
                              className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm"
                            />
                            <button onClick={() => handleSaveNote(req.id)} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">💾</button>
                            <button onClick={() => setAdminNoteId(null)} className="px-2 py-1 text-xs text-slate-400">✕</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setAdminNoteId(req.id); setAdminNoteText(req.adminNote || ""); }}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100"
                          >
                            📝 {t("sales.adminNote")}
                          </button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
              {reqTotalPages > 1 && (
                <div className="mt-4">
                  <Pagination page={reqPage} totalPages={reqTotalPages} onPageChange={setReqPage} />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
