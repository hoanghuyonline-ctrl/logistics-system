"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";
import { Tabs, Table, Tag, Button, Modal, InputNumber, Select, Input, Space, Popconfirm, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ProductForm, { emptyFormData } from "@/components/products/ProductForm";
import type { ProductFormData } from "@/components/products/ProductForm";

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  estimatedPrice: string | null;
  imageUrl: string | null;
  images: { path: string; url: string }[] | null;
  variants: { groups: { name: string; values: string[] }[]; rows: { combination: Record<string, string>; price: string; sku: string; stock: string; imageIndex: number | null }[] } | null;
  specs: { weight: string; length: string; width: string; height: string } | null;
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
  selectedOptions: string | null;
  paidAt: string | null;
  paidFromWallet: boolean;
  paymentMethod: string;
  createdAt: string;
  customer: { id: string; fullName: string; email: string; phone: string | null };
  product: { id: string; name: string; imageUrl: string | null } | null;
  confirmedBy: { id: string; fullName: string } | null;
  order: { id: string; orderCode: string } | null;
}

const STATUS_OPTIONS = ["NEW", "CONTACTED", "PRICE_CONFIRMED", "PAID", "PROCESSING", "COMPLETED", "CANCELLED"];

const STATUS_LABELS: Record<string, string> = {
  NEW: "Mới",
  CONTACTED: "Đã liên hệ",
  PRICE_CONFIRMED: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  PROCESSING: "Đang xử lý",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const STATUS_TAG_COLORS: Record<string, string> = {
  NEW: "blue",
  CONTACTED: "orange",
  PRICE_CONFIRMED: "purple",
  PAID: "green",
  PROCESSING: "geekblue",
  COMPLETED: "cyan",
  CANCELLED: "red",
};

function fmtVND(val: string | number | null | undefined): string {
  if (val == null) return "—";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "—";
  return num.toLocaleString("vi-VN") + " ₫";
}

export default function AdminSalesPage() {
  const { t } = useI18n();
  const { toast: showToast } = useToast();

  // ── Products state ──
  const [products, setProducts] = useState<Product[]>([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState<ProductFormData>(emptyFormData());
  const [prodSaving, setProdSaving] = useState(false);

  // ── Requests state (Antd Table) ──
  const [requests, setRequests] = useState<SalesRequest[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqPage, setReqPage] = useState(1);
  const [reqTotal, setReqTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  // Price confirmation modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmingReq, setConfirmingReq] = useState<SalesRequest | null>(null);
  const [confirmPriceVal, setConfirmPriceVal] = useState<number | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Status update loading
  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  // ── Fetch ──
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
      }
    } catch { /* */ } finally {
      setReqLoading(false);
    }
  }, [reqPage, statusFilter, searchQuery]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const statusLabel = useCallback((status: string) => {
    return STATUS_LABELS[status] || status;
  }, []);

  // ── Product CRUD ──
  const resetProdForm = () => setProdForm(emptyFormData());

  const handleSaveProduct = async () => {
    setProdSaving(true);
    try {
      const coverUrl = prodForm.images.length > 0 ? prodForm.images[0].url : (prodForm.imageUrl || null);
      const payload = {
        name: prodForm.name,
        description: prodForm.description || null,
        category: prodForm.category || null,
        estimatedPrice: prodForm.estimatedPrice || null,
        imageUrl: coverUrl,
        images: prodForm.images.length > 0 ? prodForm.images : null,
        variants: prodForm.variantGroups.length > 0 ? { groups: prodForm.variantGroups, rows: prodForm.variantRows } : null,
        specs: (prodForm.specs.weight || prodForm.specs.length || prodForm.specs.width || prodForm.specs.height) ? prodForm.specs : null,
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

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác.")) return;
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Đã xóa sản phẩm thành công", "success");
        fetchProducts();
      } else {
        const err = await res.json();
        showToast(err.error || "Lỗi khi xóa sản phẩm", "error");
      }
    } catch {
      showToast("Lỗi khi xóa sản phẩm", "error");
    }
  };

  const startEdit = (p: Product) => {
    setEditingProduct(p);
    const v = p.variants as Product["variants"];
    setProdForm({
      name: p.name,
      description: p.description || "",
      category: p.category || "",
      estimatedPrice: p.estimatedPrice || "",
      imageUrl: p.imageUrl || "",
      images: Array.isArray(p.images) ? p.images : [],
      sortOrder: String(p.sortOrder),
      variantGroups: v?.groups || [],
      variantRows: v?.rows || [],
      specs: p.specs ? { weight: (p.specs as ProductFormData["specs"]).weight || "", length: (p.specs as ProductFormData["specs"]).length || "", width: (p.specs as ProductFormData["specs"]).width || "", height: (p.specs as ProductFormData["specs"]).height || "" } : { weight: "", length: "", width: "", height: "" },
    });
    setShowAddProduct(true);
  };

  // ── Request actions (Antd-based) ──
  const openConfirmModal = (req: SalesRequest) => {
    setConfirmingReq(req);
    setConfirmPriceVal(null);
    setConfirmModalOpen(true);
  };

  const handleConfirmPrice = async () => {
    if (!confirmingReq || !confirmPriceVal || confirmPriceVal <= 0) return;
    setConfirmLoading(true);
    try {
      const res = await fetch(`/api/sales-requests/${confirmingReq.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmedPrice: confirmPriceVal, status: "PRICE_CONFIRMED" }),
      });
      if (res.ok) {
        message.success(t("salesAdmin.priceConfirmedOk"));
        setConfirmModalOpen(false);
        setConfirmingReq(null);
        setConfirmPriceVal(null);
        fetchRequests();
      } else {
        const err = await res.json();
        message.error(err.error || t("salesAdmin.errorOccurred"));
      }
    } catch {
      message.error(t("salesAdmin.errorOccurred"));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setStatusLoading(id);
    try {
      const res = await fetch(`/api/sales-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        message.success(t("salesAdmin.statusUpdatedOk"));
        fetchRequests();
      } else {
        const err = await res.json();
        message.error(err.error || t("salesAdmin.errorOccurred"));
      }
    } catch {
      message.error(t("salesAdmin.errorOccurred"));
    } finally {
      setStatusLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setStatusLoading(id);
    try {
      const res = await fetch(`/api/sales-requests/${id}`, { method: "DELETE" });
      if (res.ok) {
        message.success("Đã xóa yêu cầu");
        fetchRequests();
      } else {
        const err = await res.json();
        message.error(err.error || t("salesAdmin.errorOccurred"));
      }
    } catch {
      message.error(t("salesAdmin.errorOccurred"));
    } finally {
      setStatusLoading(null);
    }
  };

  // ── Antd Table columns ──
  const columns: ColumnsType<SalesRequest> = [
    {
      title: t("salesAdmin.code"),
      dataIndex: "requestCode",
      key: "requestCode",
      width: 160,
      render: (code: string, record: SalesRequest) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-semibold text-slate-700">{code}</span>
          {record.paymentMethod === "COD" && (
            <Tag color="orange" className="text-[10px] leading-tight m-0">COD</Tag>
          )}
        </div>
      ),
    },
    {
      title: t("salesAdmin.customer"),
      key: "customer",
      width: 160,
      render: (_: unknown, record: SalesRequest) => (
        <div>
          <div className="font-medium text-sm text-slate-800">{record.customer.fullName}</div>
          {record.customer.phone && (
            <div className="text-xs text-slate-400">{record.customer.phone}</div>
          )}
        </div>
      ),
    },
    {
      title: t("salesAdmin.product"),
      dataIndex: "productName",
      key: "productName",
      width: 180,
      render: (name: string, record: SalesRequest) => (
        <div className="flex items-center gap-2">
          {record.product?.imageUrl && (
            <img src={record.product.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />
          )}
          <div>
            <span className="text-sm">{name}</span>
            {record.selectedOptions && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {record.selectedOptions.split(" | ").map((opt) => (
                  <Tag key={opt} color="default" className="text-[10px] leading-tight m-0">{opt}</Tag>
                ))}
              </div>
            )}
            {record.customerNote && (
              <div className="mt-1 px-2 py-1 bg-blue-50 border border-blue-100 rounded text-[10px] text-slate-600 italic leading-snug">
                <span className="not-italic">📝</span> Ghi chú: &ldquo;{record.customerNote}&rdquo;
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: t("salesAdmin.qty"),
      dataIndex: "quantity",
      key: "quantity",
      width: 60,
      align: "center" as const,
    },
    {
      title: t("salesAdmin.estTotal"),
      key: "estimatedTotal",
      width: 130,
      render: (_: unknown, record: SalesRequest) => (
        <span className="text-sm">{fmtVND(record.estimatedTotal)}</span>
      ),
    },
    {
      title: t("salesAdmin.confirmedPriceCol"),
      key: "confirmedPrice",
      width: 130,
      render: (_: unknown, record: SalesRequest) => (
        record.confirmedPrice
          ? <span className="text-sm font-semibold text-green-700">{fmtVND(record.confirmedPrice)}</span>
          : <span className="text-xs text-slate-400">—</span>
      ),
    },
    {
      title: t("salesAdmin.status"),
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (status: string, record: SalesRequest) => (
        <div className="flex flex-col gap-1">
          <Tag color={STATUS_TAG_COLORS[status] || "default"}>{statusLabel(status)}</Tag>
          {record.order && (
            <a href={`/admin/orders/${record.order.id}`} className="inline-block">
              <Tag color="blue" className="cursor-pointer text-[10px]">
                {record.order.orderCode}
              </Tag>
            </a>
          )}
        </div>
      ),
    },
    {
      title: t("salesAdmin.createdAt"),
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (val: string) => (
        <span className="text-xs text-slate-500">
          {new Date(val).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
        </span>
      ),
    },
    {
      title: t("salesAdmin.actions"),
      key: "actions",
      width: 240,
      render: (_: unknown, record: SalesRequest) => {
        const { status, id } = record;

        if (status === "NEW") {
          return (
            <Space>
              <Button type="primary" size="small" onClick={() => openConfirmModal(record)}>
                {t("salesAdmin.confirmPriceBtn")}
              </Button>
              <Popconfirm
                title="Hủy yêu cầu này?"
                description="Yêu cầu sẽ chuyển sang trạng thái Đã hủy."
                onConfirm={() => handleStatusUpdate(id, "CANCELLED")}
                okText="Hủy đơn"
                cancelText="Không"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" danger loading={statusLoading === id}>Hủy</Button>
              </Popconfirm>
              <Popconfirm
                title="Xóa yêu cầu này?"
                description="Yêu cầu sẽ bị xóa vĩnh viễn khỏi hệ thống."
                onConfirm={() => handleDelete(id)}
                okText="Xóa"
                cancelText="Không"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" danger type="text" loading={statusLoading === id}>Xóa</Button>
              </Popconfirm>
            </Space>
          );
        }

        if (status === "PRICE_CONFIRMED") {
          return (
            <Space>
              <Popconfirm
                title="Hủy yêu cầu này?"
                description="Yêu cầu sẽ chuyển sang trạng thái Đã hủy."
                onConfirm={() => handleStatusUpdate(id, "CANCELLED")}
                okText="Hủy đơn"
                cancelText="Không"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" danger loading={statusLoading === id}>Hủy đơn</Button>
              </Popconfirm>
            </Space>
          );
        }

        if (status === "PAID") {
          return (
            <Space>
              <Button
                size="small"
                loading={statusLoading === id}
                onClick={() => handleStatusUpdate(id, "PROCESSING")}
                style={{ background: "#2563eb", color: "#fff", borderColor: "#2563eb" }}
              >
                {t("salesAdmin.nextOrdered")}
              </Button>
              <Popconfirm
                title="Hủy đơn hàng này?"
                description="Bạn có chắc chắn muốn hủy đơn hàng này? Hệ thống sẽ tự động hoàn lại số tiền đã thanh toán vào ví của khách hàng nếu thanh toán qua Ví."
                onConfirm={() => handleStatusUpdate(id, "CANCELLED")}
                okText="Hủy đơn"
                cancelText="Không"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" danger loading={statusLoading === id}>Hủy</Button>
              </Popconfirm>
            </Space>
          );
        }

        if (status === "PROCESSING") {
          return (
            <Button
              size="small"
              loading={statusLoading === id}
              onClick={() => handleStatusUpdate(id, "COMPLETED")}
              style={{ background: "#059669", color: "#fff", borderColor: "#059669" }}
            >
              {t("salesAdmin.nextCompleted")}
            </Button>
          );
        }

        if (status === "CANCELLED") {
          return (
            <Popconfirm
              title="Xóa yêu cầu này?"
              description="Yêu cầu sẽ bị xóa vĩnh viễn khỏi hệ thống."
              onConfirm={() => handleDelete(id)}
              okText="Xóa"
              cancelText="Không"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger type="text" loading={statusLoading === id}>Xóa</Button>
            </Popconfirm>
          );
        }

        return <span className="text-xs text-slate-400">—</span>;
      },
    },
  ];

  // ── Render ──
  return (
    <div>
      <PageHeader title={t("sales.adminTitle")} subtitle={t("sales.adminSubtitle")} />

      <Tabs
        defaultActiveKey="requests"
        items={[
          {
            key: "requests",
            label: `${t("sales.requestsTab")} (${reqTotal})`,
            children: (
              <div>
                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-5">
                  <Input.Search
                    placeholder={t("salesAdmin.search")}
                    allowClear
                    onSearch={(val) => { setSearchQuery(val); setReqPage(1); }}
                    style={{ width: 260 }}
                  />
                  <Select
                    value={statusFilter}
                    onChange={(val) => { setStatusFilter(val); setReqPage(1); }}
                    allowClear
                    placeholder={t("salesAdmin.allStatuses")}
                    style={{ width: 180 }}
                    options={STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_LABELS[s] || s }))}
                  />
                </div>

                {/* Mobile card view for sales requests */}
                <div className="md:hidden flex flex-col gap-2">
                  {reqLoading ? (
                    <LoadingSpinner />
                  ) : requests.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">{t("salesAdmin.noRequests")}</div>
                  ) : (
                    <>
                      {requests.map((req) => (
                        <div key={req.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-semibold text-slate-700">{req.requestCode}</span>
                              {req.paymentMethod === "COD" && (
                                <Tag color="orange" className="text-[10px] leading-tight m-0">COD</Tag>
                              )}
                            </div>
                            <Tag color={STATUS_TAG_COLORS[req.status] || "default"}>{statusLabel(req.status)}</Tag>
                          </div>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                            <div>
                              <div className="text-[11px] font-medium text-slate-400 uppercase">Khách</div>
                              <div className="text-sm text-slate-800">{req.customer.fullName}</div>
                            </div>
                            <div>
                              <div className="text-[11px] font-medium text-slate-400 uppercase">SL</div>
                              <div className="text-sm text-slate-800">{req.quantity}</div>
                            </div>
                            <div className="col-span-2">
                              <div className="text-[11px] font-medium text-slate-400 uppercase">Sản phẩm</div>
                              <div className="text-sm text-slate-800 truncate">{req.productName}</div>
                            </div>
                            <div>
                              <div className="text-[11px] font-medium text-slate-400 uppercase">Dự toán</div>
                              <div className="text-sm">{fmtVND(req.estimatedTotal)}</div>
                            </div>
                            <div>
                              <div className="text-[11px] font-medium text-slate-400 uppercase">Xác nhận</div>
                              <div className="text-sm font-semibold text-green-700">{req.confirmedPrice ? fmtVND(req.confirmedPrice) : "\u2014"}</div>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                            {req.status === "NEW" && (
                              <>
                                <Button type="primary" size="small" onClick={() => openConfirmModal(req)}>
                                  {t("salesAdmin.confirmPriceBtn")}
                                </Button>
                                <Button size="small" danger onClick={() => handleStatusUpdate(req.id, "CANCELLED")}>Hủy</Button>
                              </>
                            )}
                            {req.status === "PAID" && (
                              <Button size="small" onClick={() => handleStatusUpdate(req.id, "PROCESSING")}
                                style={{ background: "#2563eb", color: "#fff", borderColor: "#2563eb" }}>
                                {t("salesAdmin.nextOrdered")}
                              </Button>
                            )}
                            {req.status === "PROCESSING" && (
                              <Button size="small" onClick={() => handleStatusUpdate(req.id, "COMPLETED")}
                                style={{ background: "#059669", color: "#fff", borderColor: "#059669" }}>
                                {t("salesAdmin.nextCompleted")}
                              </Button>
                            )}
                            {req.order && (
                              <a href={`/admin/orders/${req.order.id}`}>
                                <Tag color="blue" className="cursor-pointer text-[10px]">{req.order.orderCode}</Tag>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between px-1 py-2 text-xs text-slate-500">
                        <span>{reqTotal} yêu cầu</span>
                        <div className="flex gap-1.5">
                          <button disabled={reqPage <= 1} onClick={() => setReqPage(reqPage - 1)}
                            className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg disabled:opacity-40">←</button>
                          <button disabled={reqPage * 20 >= reqTotal} onClick={() => setReqPage(reqPage + 1)}
                            className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg disabled:opacity-40">→</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Desktop table view */}
                <div className="hidden md:block">
                  <Table<SalesRequest>
                    columns={columns}
                    dataSource={requests}
                    rowKey="id"
                    loading={reqLoading}
                    pagination={{
                      current: reqPage,
                      total: reqTotal,
                      pageSize: 20,
                      onChange: (p) => setReqPage(p),
                      showSizeChanger: false,
                      showTotal: (tot) => `${tot}`,
                    }}
                    scroll={{ x: 1100 }}
                    locale={{ emptyText: t("salesAdmin.noRequests") }}
                    size="middle"
                  />
                </div>
              </div>
            ),
          },
          {
            key: "products",
            label: `${t("sales.productsTab")} (${products.length})`,
            children: (
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
                  <ProductForm
                    data={prodForm}
                    onChange={setProdForm}
                    onSave={handleSaveProduct}
                    onCancel={() => { setShowAddProduct(false); setEditingProduct(null); }}
                    saving={prodSaving}
                    isEdit={!!editingProduct}
                  />
                )}

                {prodLoading ? <LoadingSpinner /> : (
                  <div className="space-y-2">
                    {products.map((p) => {
                      const imgArr = Array.isArray(p.images) ? p.images : [];
                      const variantData = p.variants as Product["variants"];
                      const variantCount = variantData?.rows?.length || 0;
                      const specData = p.specs as Product["specs"];
                      return (
                        <div key={p.id} className={`bg-white rounded-xl border p-4 ${!p.isActive ? "opacity-50" : ""}`}>
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                              {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-2xl">🛍️</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm text-slate-900">{p.name}</h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${p.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                                  {p.isActive ? t("sales.productActive") : t("sales.productHidden")}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                {p.category && <span>{p.category}</span>}
                                {p.estimatedPrice && <span className="text-orange-600 font-semibold">{parseFloat(p.estimatedPrice).toLocaleString("vi-VN")} ₫</span>}
                                {imgArr.length > 0 && <span>🖼 {imgArr.length} ảnh</span>}
                                {variantCount > 0 && <span>🎨 {variantCount} biến thể</span>}
                                {specData?.weight && <span>⚖️ {specData.weight} kg</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button onClick={() => handleToggleProduct(p)} className="text-xs px-2 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">{p.isActive ? "Ẩn" : "Hiện"}</button>
                              <button onClick={() => startEdit(p)} className="text-xs px-2 py-1 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50">{t("common.edit")}</button>
                              <button onClick={() => handleDeleteProduct(p)} className="text-xs px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">Xóa</button>
                            </div>
                          </div>
                          {imgArr.length > 1 && (
                            <div className="flex gap-1.5 mt-3 overflow-x-auto">
                              {imgArr.slice(0, 6).map((img, i) => (
                                <img key={i} src={img.url} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0" />
                              ))}
                              {imgArr.length > 6 && <span className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-500 flex-shrink-0">+{imgArr.length - 6}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* Price Confirmation Modal */}
      <Modal
        open={confirmModalOpen}
        title={`${t("salesAdmin.confirmPriceTitle")} ${confirmingReq?.requestCode || ""}`}
        onCancel={() => { setConfirmModalOpen(false); setConfirmingReq(null); }}
        onOk={handleConfirmPrice}
        okText={t("salesAdmin.confirm")}
        cancelText={t("salesAdmin.cancel")}
        confirmLoading={confirmLoading}
        okButtonProps={{ disabled: !confirmPriceVal || confirmPriceVal <= 0 }}
      >
        <div className="py-4">
          {confirmingReq && (
            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <div className="text-sm"><strong>{t("salesAdmin.product")}:</strong> {confirmingReq.productName}</div>
              <div className="text-sm"><strong>{t("salesAdmin.customer")}:</strong> {confirmingReq.customer.fullName}</div>
              <div className="text-sm"><strong>{t("salesAdmin.qty")}:</strong> {confirmingReq.quantity}</div>
              <div className="text-sm"><strong>{t("salesAdmin.estTotal")}:</strong> {fmtVND(confirmingReq.estimatedTotal)}</div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t("salesAdmin.enterPrice")}
            </label>
            <InputNumber
              value={confirmPriceVal}
              onChange={(val) => setConfirmPriceVal(val)}
              min={1}
              style={{ width: "100%" }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => Number(value?.replace(/,/g, "") || 0)}
              addonAfter="₫"
              size="large"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
