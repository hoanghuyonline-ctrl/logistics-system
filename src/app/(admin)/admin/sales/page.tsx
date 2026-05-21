"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";
import { Tabs, Table, Tag, Button, Modal, InputNumber, Select, Input, Space, Popconfirm, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

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
  const [prodForm, setProdForm] = useState({ name: "", description: "", category: "", estimatedPrice: "", imageUrl: "", sortOrder: "0" });
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

                {/* Table */}
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
