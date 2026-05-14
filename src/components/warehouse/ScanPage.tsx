"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import CameraScanner from "@/components/warehouse/CameraScanner";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n";
import type { PackageStatus, OrderStatus } from "@prisma/client";

interface PackageOrder {
  id: string;
  orderCode: string;
  productName: string;
  quantity: number;
  status: string;
  user: { fullName: string };
}

interface ScannedPackage {
  id: string;
  packageCode: string;
  barcode: string | null;
  status: PackageStatus;
  totalWeightKg: string | null;
  orders: PackageOrder[];
  creator: { fullName: string };
  createdAt: string;
}

const STATUS_TRANSITIONS: Record<string, { next: PackageStatus; label: string }> = {
  AT_CHINA_WH: { next: "SHIPPING", label: "scan.markShipping" },
  SHIPPING: { next: "AT_VIETNAM_WH", label: "scan.markArrivedVN" },
  AT_VIETNAM_WH: { next: "DELIVERED", label: "scan.markDelivered" },
};

interface ScanPageProps {
  warehouse: "china" | "vietnam";
}

export default function ScanPage({ warehouse }: ScanPageProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [barcode, setBarcode] = useState("");
  const [pkg, setPkg] = useState<ScannedPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [lastUpdateInfo, setLastUpdateInfo] = useState<{
    packageCode: string;
    barcode: string | null;
    newStatus: string;
    orderCodes: string[];
    updatedAt: Date;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCameraDetected = useCallback((code: string) => {
    setBarcode(code);
    setPkg(null);
    setLoading(true);
    fetch("/api/warehouse/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode: code, action: "lookup" }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          toast(data.error || t("scan.notFound"), "error");
        } else {
          setPkg(data.package);
          toast(t("scan.found"), "success");
        }
      })
      .catch(() => toast(t("scan.error"), "error"))
      .finally(() => setLoading(false));
  }, [toast, t]);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = barcode.trim();
    if (!trimmed) return;

    setLoading(true);
    setPkg(null);
    try {
      const res = await fetch("/api/warehouse/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode: trimmed, action: "lookup" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || t("scan.notFound"), "error");
        return;
      }
      setPkg(data.package);
      toast(t("scan.found"), "success");
    } catch {
      toast(t("scan.error"), "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate() {
    if (!pkg) return;
    const transition = STATUS_TRANSITIONS[pkg.status];
    if (!transition) return;

    setUpdating(true);
    try {
      const res = await fetch("/api/warehouse/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode: pkg.packageCode,
          action: "update",
          newStatus: transition.next,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || t("scan.updateFailed"), "error");
        return;
      }
      setPkg(data.package);
      setLastUpdateInfo({
        packageCode: data.package.packageCode,
        barcode: data.package.barcode,
        newStatus: transition.next,
        orderCodes: data.package.orders.map((o: PackageOrder) => o.orderCode),
        updatedAt: new Date(),
      });
      toast(t("scan.updateSuccess"), "success");
    } catch {
      toast(t("scan.error"), "error");
    } finally {
      setUpdating(false);
    }
  }

  function handleClear() {
    setBarcode("");
    setPkg(null);
    setLastUpdateInfo(null);
    inputRef.current?.focus();
  }

  const subtitle = warehouse === "china" ? t("scan.subtitleCN") : t("scan.subtitleVN");
  const transition = pkg ? STATUS_TRANSITIONS[pkg.status] : null;

  return (
    <div className="max-w-3xl">
      <PageHeader title={t("scan.title")} subtitle={subtitle} />

      <Card title={t("scan.inputTitle")} className="mb-6">
        <CameraScanner onDetected={handleCameraDetected} />
        <div className="border-t border-slate-100 my-4" />
        <form onSubmit={handleLookup} className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder={t("scan.placeholder")}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !barcode.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm text-sm"
          >
            {loading ? t("common.loading") : t("scan.lookup")}
          </button>
          {pkg && (
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2.5 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-colors text-sm"
            >
              {t("scan.clear")}
            </button>
          )}
        </form>
      </Card>

      {pkg && (
        <Card title={t("scan.resultTitle")} className="mb-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 font-medium">{t("scan.packageCode")}</p>
                <p className="text-sm font-semibold text-slate-900">{pkg.packageCode}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">{t("scan.barcode")}</p>
                <p className="text-sm font-semibold text-slate-900">{pkg.barcode || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">{t("scan.status")}</p>
                <StatusBadge status={pkg.status as unknown as OrderStatus} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">{t("scan.weight")}</p>
                <p className="text-sm text-slate-700">{pkg.totalWeightKg ? `${pkg.totalWeightKg} kg` : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">{t("scan.createdBy")}</p>
                <p className="text-sm text-slate-700">{pkg.creator.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">{t("scan.orders")}</p>
                <p className="text-sm text-slate-700">{pkg.orders.length}</p>
              </div>
            </div>

            {pkg.orders.length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-400 font-medium mb-2">{t("scan.ordersInPackage")}</p>
                <div className="space-y-2">
                  {pkg.orders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                      <div>
                        <span className="text-sm font-medium text-slate-900">{o.orderCode}</span>
                        <span className="text-xs text-slate-400 ml-2">{o.productName} x{o.quantity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{o.user.fullName}</span>
                        <StatusBadge status={o.status as OrderStatus} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {transition && (
              <div className="border-t border-slate-100 pt-4">
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm text-sm"
                >
                  {updating ? t("common.loading") : t(transition.label)}
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      {lastUpdateInfo && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">✅</span>
            <p className="text-sm font-semibold text-emerald-900">Cập nhật trạng thái thành công</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-emerald-600 font-medium">Mã kiện</p>
              <p className="font-semibold text-emerald-900">{lastUpdateInfo.packageCode}</p>
            </div>
            {lastUpdateInfo.barcode && (
              <div>
                <p className="text-xs text-emerald-600 font-medium">Barcode</p>
                <p className="font-semibold text-emerald-900">{lastUpdateInfo.barcode}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-emerald-600 font-medium">Trạng thái mới</p>
              <StatusBadge status={lastUpdateInfo.newStatus} />
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-medium">Thời gian cập nhật</p>
              <p className="text-emerald-800">{lastUpdateInfo.updatedAt.toLocaleTimeString("vi-VN")}</p>
            </div>
            {lastUpdateInfo.orderCodes.length > 0 && (
              <div className="col-span-2">
                <p className="text-xs text-emerald-600 font-medium">Mã đơn hàng</p>
                <p className="text-emerald-800">{lastUpdateInfo.orderCodes.join(", ")}</p>
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-emerald-700">Có thể tiếp tục quét mã tiếp theo.</p>
        </div>
      )}
    </div>
  );
}
