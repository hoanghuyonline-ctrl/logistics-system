"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Table, Tag, Button, Modal, InputNumber, Select, Input, Space, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import PageHeader from "@/components/ui/PageHeader";

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

export default function AdminSalesRequestsPage() {
  const { t } = useI18n();

  const [requests, setRequests] = useState<SalesRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");

  // Price confirmation modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmingReq, setConfirmingReq] = useState<SalesRequest | null>(null);
  const [confirmPrice, setConfirmPrice] = useState<number | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Status update loading per id
  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  const statusLabel = useCallback((status: string) => {
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
  }, [t]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/sales-requests?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        setTotal(data.total || 0);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const openConfirmModal = (req: SalesRequest) => {
    setConfirmingReq(req);
    setConfirmPrice(null);
    setConfirmModalOpen(true);
  };

  const handleConfirmPrice = async () => {
    if (!confirmingReq || !confirmPrice || confirmPrice <= 0) return;
    setConfirmLoading(true);
    try {
      const res = await fetch(`/api/admin/sales-requests/${confirmingReq.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmedPrice: confirmPrice }),
      });
      if (res.ok) {
        message.success(t("salesAdmin.priceConfirmedOk"));
        setConfirmModalOpen(false);
        setConfirmingReq(null);
        setConfirmPrice(null);
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
      const res = await fetch(`/api/admin/sales-requests/${id}/status`, {
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

  const columns: ColumnsType<SalesRequest> = [
    {
      title: t("salesAdmin.code"),
      dataIndex: "requestCode",
      key: "requestCode",
      width: 140,
      render: (code: string) => <span className="font-mono text-xs font-semibold text-slate-700">{code}</span>,
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
          <span className="text-sm">{name}</span>
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
      width: 140,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] || "default"}>{statusLabel(status)}</Tag>
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
      width: 200,
      render: (_: unknown, record: SalesRequest) => {
        const { status, id } = record;

        if (status === "NEW") {
          return (
            <Button
              type="primary"
              size="small"
              onClick={() => openConfirmModal(record)}
            >
              {t("salesAdmin.confirmPriceBtn")}
            </Button>
          );
        }

        if (status === "PAID") {
          return (
            <Button
              size="small"
              loading={statusLoading === id}
              onClick={() => handleStatusUpdate(id, "PROCESSING")}
              style={{ background: "#2563eb", color: "#fff", borderColor: "#2563eb" }}
            >
              {t("salesAdmin.nextOrdered")}
            </Button>
          );
        }

        if (status === "PROCESSING") {
          return (
            <Space>
              <Button
                size="small"
                loading={statusLoading === id}
                onClick={() => handleStatusUpdate(id, "COMPLETED")}
                style={{ background: "#059669", color: "#fff", borderColor: "#059669" }}
              >
                {t("salesAdmin.nextCompleted")}
              </Button>
            </Space>
          );
        }

        return <span className="text-xs text-slate-400">—</span>;
      },
    },
  ];

  return (
    <div>
      <PageHeader title={t("salesAdmin.title")} subtitle={t("salesAdmin.subtitle")} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <Input.Search
          placeholder={t("salesAdmin.search")}
          allowClear
          onSearch={(val) => { setSearch(val); setPage(1); }}
          style={{ width: 260 }}
        />
        <Select
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); setPage(1); }}
          allowClear
          placeholder={t("salesAdmin.allStatuses")}
          style={{ width: 180 }}
          options={STATUS_OPTIONS.map((s) => ({ value: s, label: statusLabel(s) }))}
        />
      </div>

      {/* Table */}
      <Table<SalesRequest>
        columns={columns}
        dataSource={requests}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: (p) => setPage(p),
          showSizeChanger: false,
          showTotal: (t) => `${t}`,
        }}
        scroll={{ x: 1100 }}
        locale={{ emptyText: t("salesAdmin.noRequests") }}
        size="middle"
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
        okButtonProps={{ disabled: !confirmPrice || confirmPrice <= 0 }}
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
              value={confirmPrice}
              onChange={(val) => setConfirmPrice(val)}
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
