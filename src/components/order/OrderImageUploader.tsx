"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";

interface UploadedImage {
  path: string;
  url: string;
}

interface OrderImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
}

export default function OrderImageUploader({
  images,
  onImagesChange,
  maxImages = 5,
}: OrderImageUploaderProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);

  const uploadFile = useCallback(
    async (file: File) => {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast(t("newOrder.imageUploadError") + " — JPG, PNG, WebP only", "error");
        return;
      }
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast(t("newOrder.imageUploadError") + " — Max 5MB", "error");
        return;
      }
      if (images.length + uploadingCount >= maxImages) {
        toast(`Max ${maxImages} images`, "error");
        return;
      }

      setUploadingCount((c) => c + 1);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/orders/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Upload failed");
        }

        const data = await res.json();
        onImagesChange([...images, { path: data.path, url: data.url }]);
        toast(t("newOrder.imageUploadSuccess"), "success");
      } catch (err) {
        toast(
          t("newOrder.imageUploadError") +
            (err instanceof Error ? ` — ${err.message}` : ""),
          "error"
        );
      } finally {
        setUploadingCount((c) => c - 1);
      }
    },
    [images, uploadingCount, maxImages, onImagesChange, toast, t]
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        uploadFile(file);
      }
    },
    [uploadFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  // Clipboard paste listener
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        handleFiles(imageFiles);
      }
    }

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handleFiles]);

  const removeImage = useCallback(
    (index: number) => {
      const updated = images.filter((_, i) => i !== index);
      onImagesChange(updated);
    },
    [images, onImagesChange]
  );

  const isUploading = uploadingCount > 0;
  const canAddMore = images.length + uploadingCount < maxImages;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        {t("newOrder.imageUploadTitle")} <span className="text-red-500">*</span>
      </label>

      {/* Uploaded images grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div
              key={img.path}
              className="relative group aspect-square rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={`Product ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              >
                ✕
              </button>
              {idx === 0 && (
                <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-semibold rounded-md">
                  Cover
                </span>
              )}
            </div>
          ))}

          {/* Upload skeleton placeholders */}
          {Array.from({ length: uploadingCount }).map((_, idx) => (
            <div
              key={`uploading-${idx}`}
              className="aspect-square rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 flex items-center justify-center animate-pulse"
            >
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] text-blue-500 font-medium">
                  {t("newOrder.imageUploading")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 ${
            isDragging
              ? "border-blue-500 bg-blue-50 scale-[1.01] shadow-lg shadow-blue-100"
              : "border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50"
          } ${images.length > 0 ? "p-5" : "p-8"}`}
        >
          <div className="flex flex-col items-center text-center">
            {/* Upload icon */}
            <div
              className={`mb-3 rounded-2xl flex items-center justify-center transition-colors ${
                isDragging ? "bg-blue-100" : "bg-slate-100"
              } ${images.length > 0 ? "w-10 h-10" : "w-14 h-14"}`}
            >
              <svg
                className={`text-slate-400 ${images.length > 0 ? "w-5 h-5" : "w-7 h-7"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>

            <p className="text-sm font-semibold text-slate-700">
              {t("newOrder.imageUploadDrop")}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {t("newOrder.imageUploadOr")}{" "}
              <span className="text-blue-600 font-medium underline underline-offset-2">
                {t("newOrder.imageUploadBrowse")}
              </span>
            </p>
            <div className="mt-3 flex flex-col gap-1">
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">
                  Ctrl+V
                </kbd>
                {t("newOrder.imageUploadPaste")}
              </p>
              <p className="text-[11px] text-slate-400">
                {t("newOrder.imageUploadFormats")}
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {/* Loading bar for active uploads */}
      {isUploading && (
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-pulse w-2/3" />
        </div>
      )}
    </div>
  );
}
