"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

interface PackageImage {
  id: string;
  imageUrl: string;
  createdAt: string;
}

interface PackageOrder {
  id: string;
  orderCode: string;
  productName: string;
  weightKg: string | null;
  user: { fullName: string; email: string };
}

interface PackageDetail {
  id: string;
  packageCode: string;
  barcode: string;
  totalWeightKg: string | null;
  lengthCm: string | null;
  widthCm: string | null;
  heightCm: string | null;
  status: string;
  createdAt: string;
  creator: { fullName: string };
  orders: PackageOrder[];
  images: PackageImage[];
}

const statusColors: Record<string, string> = {
  AT_CHINA_WH: "bg-violet-50 text-violet-700",
  SHIPPING: "bg-cyan-50 text-cyan-700",
  AT_VIETNAM_WH: "bg-teal-50 text-teal-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
};

export default function PackageDetailPage() {
  const params = useParams();
  const pkgId = params.id as string;
  const { toast } = useToast();
  const [pkg, setPkg] = useState<PackageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const loadPackage = useCallback(() => {
    fetch(`/api/packages/${pkgId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          toast(d.error, "error");
        } else {
          setPkg(d);
        }
        setLoading(false);
      });
  }, [pkgId, toast]);

  useEffect(() => {
    loadPackage();
  }, [loadPackage]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast("Only JPG, PNG, and WebP images are allowed", "error");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast("Image must be smaller than 5 MB", "error");
      e.target.value = "";
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`/api/packages/${pkgId}/images`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        toast("Image uploaded successfully", "success");
        loadPackage();
      } else {
        toast(data.error || "Upload failed", "error");
      }
    } catch {
      toast("Upload failed", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(imageId: string) {
    if (!confirm("Delete this image?")) return;

    try {
      const res = await fetch(`/api/packages/${pkgId}/images?imageId=${imageId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast("Image deleted", "success");
        loadPackage();
      } else {
        const data = await res.json();
        toast(data.error || "Delete failed", "error");
      }
    } catch {
      toast("Delete failed", "error");
    }
  }

  if (loading) return <LoadingSpinner text="Loading package..." />;
  if (!pkg) return <div className="text-center text-slate-500 py-12">Package not found</div>;

  return (
    <div>
      <PageHeader
        title={`Package ${pkg.packageCode}`}
        subtitle={`Created by ${pkg.creator.fullName} on ${new Date(pkg.createdAt).toLocaleDateString()}`}
        action={
          <a href="/admin/packages" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">
            &larr; Back to Packages
          </a>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card title="Package Info">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Status</dt>
              <dd>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${statusColors[pkg.status] || "bg-slate-100 text-slate-700"}`}>
                  {pkg.status.replace(/_/g, " ")}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Barcode</dt>
              <dd className="font-mono text-xs bg-slate-50 px-2 py-1 rounded-lg">{pkg.barcode}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Weight</dt>
              <dd className="text-slate-900 font-medium">{pkg.totalWeightKg ? `${pkg.totalWeightKg} kg` : "—"}</dd>
            </div>
            {(pkg.lengthCm || pkg.widthCm || pkg.heightCm) && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Dimensions</dt>
                <dd className="text-slate-900">{pkg.lengthCm || "—"} x {pkg.widthCm || "—"} x {pkg.heightCm || "—"} cm</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card title={`Orders (${pkg.orders.length})`} className="lg:col-span-2" noPadding>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pkg.orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 text-sm font-semibold text-slate-900">{o.orderCode}</td>
                    <td className="px-6 py-3 text-sm text-slate-700">{o.productName}</td>
                    <td className="px-6 py-3 text-sm text-slate-700">{o.user.fullName}</td>
                    <td className="px-6 py-3 text-sm text-slate-700">{o.weightKg ? `${o.weightKg} kg` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card
        title={`Images (${pkg.images.length})`}
        action={
          <label className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl cursor-pointer transition-colors shadow-sm ${uploading ? "bg-slate-300 text-slate-500" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
            {uploading ? "Uploading..." : "Upload Image"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        }
      >
        {pkg.images.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No images uploaded yet</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {pkg.images.map((img) => (
              <div key={img.id} className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <img
                  src={img.imageUrl}
                  alt="Package"
                  className="w-full h-40 object-cover cursor-pointer"
                  onClick={() => setPreviewUrl(img.imageUrl)}
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDelete(img.id)}
                    className="w-7 h-7 bg-red-600 text-white rounded-lg flex items-center justify-center text-xs hover:bg-red-700 shadow-sm"
                    title="Delete image"
                  >
                    &times;
                  </button>
                </div>
                <div className="px-3 py-2">
                  <p className="text-xs text-slate-400">{new Date(img.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={previewUrl} alt="Preview" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl" />
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white text-slate-700 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-100 text-lg font-bold"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
