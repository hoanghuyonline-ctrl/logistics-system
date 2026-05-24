"use client";

import { useState, useRef, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";

interface UploadedDoc {
  path: string;
  url: string;
  name: string;
  type: string;
}

interface DocumentUploaderProps {
  documents: UploadedDoc[];
  onDocumentsChange: (docs: UploadedDoc[]) => void;
  maxFiles?: number;
  label: string;
  hint?: string;
  acceptImages?: boolean;
}

const DOC_ICONS: Record<string, string> = {
  "application/pdf": "📄",
  "application/msword": "📝",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "📝",
  "application/vnd.ms-excel": "📊",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "📊",
  "image/jpeg": "🖼️",
  "image/png": "🖼️",
  "image/webp": "🖼️",
};

export default function DocumentUploader({
  documents,
  onDocumentsChange,
  maxFiles = 10,
  label,
  hint,
  acceptImages = true,
}: DocumentUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      if (documents.length >= maxFiles) {
        toast(`Tối đa ${maxFiles} tệp`, "error");
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/orders/upload-document", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          toast(data.error || "Upload failed", "error");
          return;
        }

        const data = await res.json();
        onDocumentsChange([...documents, { path: data.path, url: data.url, name: data.name || file.name, type: file.type }]);
      } catch {
        toast("Upload failed", "error");
      } finally {
        setUploading(false);
      }
    },
    [documents, maxFiles, onDocumentsChange, toast]
  );

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((f) => uploadFile(f));
    e.target.value = "";
  }

  function removeDoc(index: number) {
    onDocumentsChange(documents.filter((_, i) => i !== index));
  }

  const accept = acceptImages
    ? ".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx"
    : ".pdf,.doc,.docx,.xls,.xlsx";

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {hint && <p className="text-xs text-slate-400 mb-2">{hint}</p>}

      {documents.length > 0 && (
        <div className="space-y-2 mb-3">
          {documents.map((doc, i) => {
            const isImage = doc.type.startsWith("image/");
            return (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                {isImage ? (
                  <img src={doc.url} alt={doc.name} className="w-10 h-10 rounded object-cover shrink-0" />
                ) : (
                  <span className="text-xl shrink-0">{DOC_ICONS[doc.type] || "📎"}</span>
                )}
                <span className="text-sm text-slate-700 truncate flex-1">{doc.name}</span>
                <button
                  type="button"
                  onClick={() => removeDoc(i)}
                  className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {documents.length < maxFiles && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
              <span>Đang tải...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Chọn tệp ({documents.length}/{maxFiles})</span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
