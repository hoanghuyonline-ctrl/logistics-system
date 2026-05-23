"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Card from "@/components/ui/Card";
import ImageGalleryUploader from "./ImageGalleryUploader";
import type { GalleryImage } from "./ImageGalleryUploader";
import VariantGenerator from "./VariantGenerator";
import type { VariantGroup, VariantRow } from "./VariantGenerator";

const RichTextEditor = dynamic(() => import("./RichTextEditor"), { ssr: false });

export interface ProductFormData {
  name: string;
  category: string;
  estimatedPrice: string;
  imageUrl: string;
  images: GalleryImage[];
  description: string;
  sortOrder: string;
  variantGroups: VariantGroup[];
  variantRows: VariantRow[];
  specs: {
    weight: string;
    length: string;
    width: string;
    height: string;
  };
}

export function emptyFormData(): ProductFormData {
  return {
    name: "",
    category: "",
    estimatedPrice: "",
    imageUrl: "",
    images: [],
    description: "",
    sortOrder: "0",
    variantGroups: [],
    variantRows: [],
    specs: { weight: "", length: "", width: "", height: "" },
  };
}

interface Props {
  data: ProductFormData;
  onChange: (data: ProductFormData) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isEdit: boolean;
}

export default function ProductForm({ data, onChange, onSave, onCancel, saving, isEdit }: Props) {
  const set = <K extends keyof ProductFormData>(key: K, val: ProductFormData[K]) =>
    onChange({ ...data, [key]: val });

  const setSpec = (key: keyof ProductFormData["specs"], val: string) =>
    onChange({ ...data, specs: { ...data.specs, [key]: val } });

  return (
    <div className="space-y-5">
      {/* ─── Basic Info ─── */}
      <Card>
        <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <span className="text-lg">📋</span> Thông tin cơ bản
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Tên sản phẩm *</label>
            <input
              value={data.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              placeholder="VD: Áo khoác gió unisex cao cấp..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Danh mục</label>
            <input
              value={data.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              placeholder="VD: Thời trang, Điện tử..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Giá ước tính (VND)</label>
            <input
              type="number"
              value={data.estimatedPrice}
              onChange={(e) => set("estimatedPrice", e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Thứ tự hiển thị</label>
            <input
              type="number"
              value={data.sortOrder}
              onChange={(e) => set("sortOrder", e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              placeholder="0"
            />
          </div>
        </div>
      </Card>

      {/* ─── Image Gallery ─── */}
      <Card>
        <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <span className="text-lg">🖼️</span> Thư viện ảnh sản phẩm
        </h4>
        <ImageGalleryUploader
          images={data.images}
          onChange={(imgs) => {
            set("images", imgs);
            if (imgs.length > 0 && !data.imageUrl) {
              set("imageUrl", imgs[0].url);
            }
          }}
        />
        <div className="mt-3 pt-3 border-t border-slate-100">
          <label className="block text-xs text-slate-400 mb-1">Hoặc nhập URL ảnh thủ công (tương thích ngược)</label>
          <input
            value={data.imageUrl}
            onChange={(e) => set("imageUrl", e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500"
            placeholder="https://..."
          />
        </div>
      </Card>

      {/* ─── Rich Description ─── */}
      <Card>
        <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <span className="text-lg">✏️</span> Mô tả chi tiết
        </h4>
        <RichTextEditor
          value={data.description}
          onChange={(html) => set("description", html)}
          placeholder="Viết mô tả sản phẩm chi tiết, hấp dẫn..."
        />
      </Card>

      {/* ─── Variants ─── */}
      <Card>
        <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <span className="text-lg">🎨</span> Biến thể sản phẩm
        </h4>
        <VariantGenerator
          groups={data.variantGroups}
          rows={data.variantRows}
          onGroupsChange={(g) => set("variantGroups", g)}
          onRowsChange={(r) => set("variantRows", r)}
          imageCount={data.images.length}
        />
        {data.variantGroups.length === 0 && (
          <p className="text-xs text-slate-400 mt-2">
            Chưa có biến thể. Thêm nhóm biến thể (VD: Màu sắc, Kích thước) để tự động tạo bảng kết hợp.
          </p>
        )}
      </Card>

      {/* ─── Logistics Specs ─── */}
      <Card>
        <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <span className="text-lg">📦</span> Thông số Vận tải
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Trọng lượng (kg)</label>
            <input
              type="number"
              step="0.01"
              value={data.specs.weight}
              onChange={(e) => setSpec("weight", e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              placeholder="0.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Dài (cm)</label>
            <input
              type="number"
              step="0.1"
              value={data.specs.length}
              onChange={(e) => setSpec("length", e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              placeholder="30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Rộng (cm)</label>
            <input
              type="number"
              step="0.1"
              value={data.specs.width}
              onChange={(e) => setSpec("width", e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              placeholder="20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Cao (cm)</label>
            <input
              type="number"
              step="0.1"
              value={data.specs.height}
              onChange={(e) => setSpec("height", e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              placeholder="10"
            />
          </div>
        </div>
      </Card>

      {/* ─── Actions ─── */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!data.name || saving}
          className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition"
        >
          {saving ? "Đang lưu..." : isEdit ? "Cập nhật sản phẩm" : "Tạo sản phẩm"}
        </button>
      </div>
    </div>
  );
}
