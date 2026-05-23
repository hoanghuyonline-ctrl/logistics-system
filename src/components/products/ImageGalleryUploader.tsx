"use client";

import { useRef, useState, useCallback } from "react";

export interface GalleryImage {
  path: string;
  url: string;
}

interface Props {
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  max?: number;
}

const MAX_DEFAULT = 8;

export default function ImageGalleryUploader({ images, onChange, max = MAX_DEFAULT }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const upload = useCallback(async (files: FileList | File[]) => {
    const toUpload = Array.from(files).slice(0, max - images.length);
    if (toUpload.length === 0) return;

    setUploading(true);
    const newImages: GalleryImage[] = [];
    for (const file of toUpload) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/products/upload", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          newImages.push({ path: data.path, url: data.url });
        }
      } catch { /* skip failed */ }
    }
    if (newImages.length > 0) {
      onChange([...images, ...newImages]);
    }
    setUploading(false);
  }, [images, onChange, max]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      upload(e.dataTransfer.files);
    }
  }, [upload]);

  const remove = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  const handleReorderDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return;
    const reordered = [...images];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    onChange(reordered);
    setDragIdx(null);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-slate-700">Ảnh sản phẩm</span>
        <span className="text-xs text-slate-400">({images.length}/{max})</span>
        {images.length > 0 && (
          <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Ảnh đầu = Ảnh đại diện</span>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {images.map((img, idx) => (
          <div
            key={img.path}
            draggable
            onDragStart={() => setDragIdx(idx)}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={() => handleReorderDrop(idx)}
            onDragEnd={() => setDragIdx(null)}
            className={`relative group w-24 h-24 rounded-xl border-2 overflow-hidden cursor-grab active:cursor-grabbing transition-all ${
              idx === 0 ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"
            } ${dragIdx === idx ? "opacity-40" : ""}`}
          >
            <img src={img.url} alt="" className="w-full h-full object-cover" />
            {idx === 0 && (
              <div className="absolute top-0 left-0 bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-br-lg font-medium">
                Cover
              </div>
            )}
            <button
              type="button"
              onClick={() => remove(idx)}
              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              ×
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-black/30 text-white text-[9px] text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              Kéo để sắp xếp
            </div>
          </div>
        ))}

        {images.length < max && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            disabled={uploading}
            className={`w-24 h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors ${
              dragOver
                ? "border-blue-400 bg-blue-50"
                : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
            } ${uploading ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-[10px] text-slate-400">Thêm ảnh</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files) upload(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}
