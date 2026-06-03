'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type {
  HomePageBlock,
  BannerBlock,
  AboutBlock,
  ServicesBlock,
} from '@/types/page';

/* ------------------------------------------------------------------ */
/* Dữ liệu fallback khi DB chưa có cấu hình                             */
/* ------------------------------------------------------------------ */
const initialBlocks: HomePageBlock[] = [
  {
    id: 'b1',
    type: 'banner',
    isVisible: true,
    title: 'BẮC TRUNG HẢI LOGISTICS',
    subtitle: 'Giải pháp vận tải toàn diện, uy tín hàng đầu',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
    buttonText: 'Liên hệ ngay',
    buttonLink: '#contact',
  },
  {
    id: 'a1',
    type: 'about',
    isVisible: true,
    title: 'Về Chúng Tôi',
    content:
      'Hệ thống bến bãi hiện đại, mạng lưới vận chuyển phủ rộng khắp các tỉnh thành, cam kết mang đến dịch vụ logistics nhanh chóng, an toàn và tối ưu chi phí nhất.',
    imageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec',
  },
  {
    id: 's1',
    type: 'services',
    isVisible: true,
    title: 'Dịch Vụ Nổi Bật',
    itemCount: 4,
  },
];

/* ------------------------------------------------------------------ */
/* Toast notification state type                                         */
/* ------------------------------------------------------------------ */
type ToastState = {
  type: 'success' | 'error';
  message: string;
} | null;

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
const BLOCK_LABELS: Record<HomePageBlock['type'], string> = {
  banner: 'Banner chính',
  about: 'Giới thiệu',
  services: 'Dịch vụ',
};

const BLOCK_ICONS: Record<HomePageBlock['type'], string> = {
  banner: '🖼️',
  about: 'ℹ️',
  services: '⚙️',
};

/* ------------------------------------------------------------------ */
/* Sub-components: reusable form fields                                  */
/* ------------------------------------------------------------------ */
function InputField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: 'text' | 'number' | 'url';
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Block-specific editor forms                                          */
/* ------------------------------------------------------------------ */
function BannerEditor({
  block,
  update,
}: {
  block: BannerBlock;
  update: (fields: Partial<BannerBlock>) => void;
}) {
  return (
    <div className="space-y-4">
      <InputField label="Tiêu đề chính" value={block.title} onChange={(v) => update({ title: v })} />
      <InputField label="Tiêu đề phụ" value={block.subtitle} onChange={(v) => update({ subtitle: v })} />
      <InputField label="URL ảnh nền" value={block.imageUrl} onChange={(v) => update({ imageUrl: v })} type="url" />
      {block.imageUrl && (
        <div className="overflow-hidden rounded-lg border border-slate-200 h-32">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.imageUrl} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}
      <InputField label="Văn bản nút CTA" value={block.buttonText} onChange={(v) => update({ buttonText: v })} />
      <InputField label="Đường dẫn nút CTA" value={block.buttonLink} onChange={(v) => update({ buttonLink: v })} />
    </div>
  );
}

function AboutEditor({
  block,
  update,
}: {
  block: AboutBlock;
  update: (fields: Partial<AboutBlock>) => void;
}) {
  return (
    <div className="space-y-4">
      <InputField label="Tiêu đề phần" value={block.title} onChange={(v) => update({ title: v })} />
      <TextareaField label="Nội dung chi tiết" value={block.content} onChange={(v) => update({ content: v })} rows={5} />
      <InputField label="URL ảnh minh họa" value={block.imageUrl} onChange={(v) => update({ imageUrl: v })} type="url" />
      {block.imageUrl && (
        <div className="overflow-hidden rounded-lg border border-slate-200 h-32">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.imageUrl} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}

function ServicesEditor({
  block,
  update,
}: {
  block: ServicesBlock;
  update: (fields: Partial<ServicesBlock>) => void;
}) {
  return (
    <div className="space-y-4">
      <InputField label="Tiêu đề phần" value={block.title} onChange={(v) => update({ title: v })} />
      <InputField
        label="Số dịch vụ hiển thị"
        value={block.itemCount}
        onChange={(v) => update({ itemCount: Math.max(1, parseInt(v) || 1) })}
        type="number"
      />
      <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
        💡 Lưới tự động: 1 cột (mobile) → 2 cột (tablet) → 4 cột (desktop).
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toast Component                                                       */
/* ------------------------------------------------------------------ */
function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-4 shadow-2xl border transition-all duration-300 max-w-sm ${
        isSuccess
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}
    >
      <span className="text-xl">{isSuccess ? '✅' : '❌'}</span>
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 text-lg leading-none ml-2"
        aria-label="Đóng thông báo"
      >
        ×
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page Component                                                  */
/* ------------------------------------------------------------------ */
export default function AdminHomePage() {
  const [blocks, setBlocks] = useState<HomePageBlock[]>(initialBlocks);
  const [selectedId, setSelectedId] = useState<string | null>('b1');
  const [activeTab, setActiveTab] = useState<'layout' | 'content'>('layout');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const [isDirty, setIsDirty] = useState(false);

  /* ── Fetch cấu hình từ DB khi mount ─────────────────────────────── */
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/admin/homepage');
        if (res.ok) {
          const data: HomePageBlock[] = await res.json();
          // Nếu DB có dữ liệu (mảng không rỗng) thì dùng, không thì giữ initialBlocks
          if (Array.isArray(data) && data.length > 0) {
            setBlocks(data);
            setSelectedId(data[0]?.id ?? null);
          }
        }
      } catch {
        // Không kết nối được → dùng initialBlocks đã set sẵn
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  /* ── Drag-and-drop handler ───────────────────────────────────────── */
  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const copy = Array.from(blocks);
      const [moved] = copy.splice(result.source.index, 1);
      copy.splice(result.destination.index, 0, moved);
      setBlocks(copy);
      setIsDirty(true);
    },
    [blocks],
  );

  /* ── Generic block field updater ────────────────────────────────── */
  const updateBlock = useCallback((id: string, fields: Partial<HomePageBlock>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? ({ ...b, ...fields } as HomePageBlock) : b)),
    );
    setIsDirty(true);
  }, []);

  /* ── Select block + switch tab on mobile ────────────────────────── */
  const selectBlock = useCallback((id: string) => {
    setSelectedId(id);
    setActiveTab('content');
  }, []);

  /* ── Save → PUT /api/admin/homepage ─────────────────────────────── */
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blocks),
      });

      const data = await res.json();

      if (res.ok) {
        setToast({ type: 'success', message: data.message ?? 'Đã lưu cấu hình trang chủ thành công!' });
        setIsDirty(false);
      } else {
        setToast({ type: 'error', message: data.error ?? 'Lưu thất bại. Vui lòng thử lại.' });
      }
    } catch {
      setToast({ type: 'error', message: 'Lỗi kết nối. Kiểm tra mạng và thử lại.' });
    } finally {
      setIsSaving(false);
    }
  }, [blocks]);

  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null;

  /* ── Loading skeleton ────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-72" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-100 rounded-2xl" />
          <div className="h-64 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  /* ── Main render ─────────────────────────────────────────────────── */
  return (
    <>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Quản lý Giao diện Trang Chủ</h1>
            <p className="mt-1 text-sm text-slate-500">
              Kéo thả để sắp xếp · Nhấn khối để sửa nội dung · Lưu để cập nhật ngay trên web
            </p>
          </div>
          <button
            id="cms-save-btn"
            onClick={handleSave}
            disabled={isSaving}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
              isDirty
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 ring-2 ring-indigo-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Đang lưu...
              </>
            ) : (
              <>{isDirty ? '💾 Lưu thay đổi' : '✓ Đã lưu'}</>
            )}
          </button>
        </div>

        {/* Mobile tab switcher */}
        <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 md:hidden">
          {(['layout', 'content'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'layout' ? '📋 Sắp xếp khối' : '✏️ Sửa nội dung'}
            </button>
          ))}
        </div>

        {/* Main two-column editor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* ── LEFT: Block list with DnD ─────────────────────────── */}
          <div
            className={`${
              activeTab === 'layout' ? 'block' : 'hidden md:block'
            } rounded-2xl border border-slate-200 bg-white shadow-sm`}
          >
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-700">Bố cục trang chủ</h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Kéo thả để thay đổi thứ tự · Toggle để ẩn/hiện
              </p>
            </div>
            <div className="p-4">
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="homepage-blocks">
                  {(droppableProvided) => (
                    <div
                      {...droppableProvided.droppableProps}
                      ref={droppableProvided.innerRef}
                      className="space-y-3"
                    >
                      {blocks.map((block, index) => (
                        <Draggable key={block.id} draggableId={block.id} index={index}>
                          {(draggableProvided, snapshot) => (
                            <div
                              ref={draggableProvided.innerRef}
                              {...draggableProvided.draggableProps}
                              {...draggableProvided.dragHandleProps}
                              onClick={() => selectBlock(block.id)}
                              className={`flex cursor-pointer touch-none items-center justify-between gap-3 rounded-xl border-2 p-4 transition-all duration-150 select-none ${
                                snapshot.isDragging
                                  ? 'border-indigo-400 bg-indigo-50 shadow-lg rotate-1 scale-[1.02]'
                                  : selectedId === block.id
                                    ? 'border-indigo-500 bg-indigo-50/60'
                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                              }`}
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="text-xl leading-none">{BLOCK_ICONS[block.type]}</span>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-800 text-sm">
                                    {BLOCK_LABELS[block.type]}
                                  </p>
                                  <p className="text-[11px] text-slate-400">ID: {block.id}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                {/* Visibility toggle */}
                                <label
                                  className="relative inline-flex cursor-pointer items-center"
                                  title={block.isVisible ? 'Đang hiển thị' : 'Đang ẩn'}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={block.isVisible}
                                    onChange={(e) =>
                                      updateBlock(block.id, { isVisible: e.target.checked })
                                    }
                                  />
                                  <div className="w-9 h-5 rounded-full bg-slate-200 peer-checked:bg-indigo-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4" />
                                </label>
                                <span className="text-slate-300 text-lg">⠿</span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {droppableProvided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>

            {/* JSON debug panel */}
            <details className="border-t border-slate-100 px-5 py-3">
              <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600 select-none">
                🔍 Xem JSON cấu hình (debug)
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-900 p-3 text-[10px] text-green-400">
                {JSON.stringify(blocks, null, 2)}
              </pre>
            </details>
          </div>

          {/* ── RIGHT: Content editor ─────────────────────────────── */}
          <div
            className={`${
              activeTab === 'content' ? 'block' : 'hidden md:block'
            } rounded-2xl border border-slate-200 bg-white shadow-sm`}
          >
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-700">Cấu hình nội dung</h2>
              {selectedBlock ? (
                <p className="mt-0.5 text-xs text-slate-400">
                  Đang chỉnh:{' '}
                  <span className="font-semibold text-indigo-600">
                    {BLOCK_ICONS[selectedBlock.type]} {BLOCK_LABELS[selectedBlock.type]}
                  </span>
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-slate-400">Chọn một khối bên trái để bắt đầu</p>
              )}
            </div>

            <div className="p-5">
              {selectedBlock ? (
                <>
                  {selectedBlock.type === 'banner' && (
                    <BannerEditor
                      block={selectedBlock as BannerBlock}
                      update={(fields) => updateBlock(selectedBlock.id, fields)}
                    />
                  )}
                  {selectedBlock.type === 'about' && (
                    <AboutEditor
                      block={selectedBlock as AboutBlock}
                      update={(fields) => updateBlock(selectedBlock.id, fields)}
                    />
                  )}
                  {selectedBlock.type === 'services' && (
                    <ServicesEditor
                      block={selectedBlock as ServicesBlock}
                      update={(fields) => updateBlock(selectedBlock.id, fields)}
                    />
                  )}
                </>
              ) : (
                <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 text-center text-slate-400">
                  <span className="text-4xl">👈</span>
                  <p className="text-sm">Nhấn vào một khối để chỉnh sửa nội dung</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
