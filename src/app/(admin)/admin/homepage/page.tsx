'use client';
/**
 * src/app/(admin)/admin/homepage/page.tsx
 * Admin CMS — Quản lý trang chủ (Drag & Drop + Edit Modal + Tỷ giá)
 * API: GET/PUT /api/admin/homepage/sections
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type {
  HomepageSectionDto,
  HomepageItemDto,
  UpsertHomepageSectionPayload,
  BannerSectionMeta,
} from '@/types/homepage-cms';
import { SECTION_TYPE_LABELS } from '@/types/homepage-cms';
import RichTextEditor from '@/components/admin/RichTextEditor';

// ─── Types ────────────────────────────────────────────────────────────────────
type Toast = { type: 'success' | 'error'; msg: string } | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sectionIcon(type: string) {
  const m: Record<string, string> = {
    banner: '🖼️', stats: '📊', services: '⚙️',
    why_choose_us: '✅', about: 'ℹ️', locations: '📍',
    social: '🌐', cta: '📣',
  };
  return m[type] ?? '📄';
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function ToastBanner({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border max-w-sm ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
      <span className="text-xl">{toast.type === 'success' ? '✅' : '❌'}</span>
      <p className="text-sm font-medium flex-1">{toast.msg}</p>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl ml-2">×</button>
    </div>
  );
}

// ─── Item Editor (mục con trong modal) ────────────────────────────────────────
function ItemEditor({
  item, onChange,
}: {
  item: HomepageItemDto;
  onChange: (fields: Partial<HomepageItemDto>) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{item.icon ?? '📄'}</span>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mục: {item.label}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-semibold text-slate-500 uppercase">Tên / Tiêu đề</label>
          <input
            value={item.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-slate-500 uppercase">Icon (emoji)</label>
          <input
            value={item.icon ?? ''}
            onChange={(e) => onChange({ icon: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="🚚"
          />
        </div>
      </div>
      <div>
        <label className="text-[11px] font-semibold text-slate-500 uppercase mb-1 block">Mô tả</label>
        <RichTextEditor
          value={item.content ?? ''}
          onChange={(html) => onChange({ content: html })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
        <input
          type="checkbox"
          checked={item.isActive}
          onChange={(e) => onChange({ isActive: e.target.checked })}
          className="rounded border-slate-300"
        />
        Hiển thị mục này
      </label>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({
  section,
  systemExchangeRate,
  onSave,
  onClose,
}: {
  section: HomepageSectionDto;
  systemExchangeRate: number;
  onSave: (updated: HomepageSectionDto) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<HomepageSectionDto>(() => JSON.parse(JSON.stringify(section)));
  const overlayRef = useRef<HTMLDivElement>(null);
  const bannerMeta = draft.sectionType === 'banner' ? (draft.meta as BannerSectionMeta | null) : null;

  const updateMeta = (patch: Partial<BannerSectionMeta>) =>
    setDraft((d) => ({ ...d, meta: { ...(d.meta ?? {}), ...patch } }));

  const updateItem = (itemId: string, fields: Partial<HomepageItemDto>) =>
    setDraft((d) => ({
      ...d,
      items: d.items.map((i) => (i.id === itemId ? { ...i, ...fields } : i)),
    }));

  // Đóng khi click overlay
  const handleOverlay = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlay}
      className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{sectionIcon(draft.sectionType)}</span>
            <div>
              <h2 className="font-bold text-slate-800">Chỉnh sửa Section</h2>
              <p className="text-xs text-slate-400">{SECTION_TYPE_LABELS[draft.sectionType] ?? draft.sectionType}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 text-lg">×</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Section chung */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Thông tin Section</h3>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Tiêu đề chính</label>
              <input
                value={draft.title ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase mb-1 block">Mô tả / Subtitle</label>
              <RichTextEditor
                value={draft.subtitle ?? ''}
                onChange={(html) => setDraft((d) => ({ ...d, subtitle: html }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => setDraft((d) => ({ ...d, isActive: e.target.checked }))}
                className="rounded border-slate-300"
              />
              Hiển thị section này trên trang chủ
            </label>
          </div>

          {/* Banner đặc biệt: tỷ giá + CTA */}
          {draft.sectionType === 'banner' && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 space-y-3">
              <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wide flex items-center gap-1">
                💱 Cấu hình Banner (Tỷ giá & CTA)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase">
                    Tỷ giá CNY→VND (₫)
                  </label>
                  <div className="mt-1 w-full rounded-lg border border-orange-200 bg-orange-100/50 px-3 py-2 text-sm font-bold text-orange-700 select-none">
                    {systemExchangeRate.toLocaleString('vi-VN')} ₫
                  </div>
                  <p className="text-[10px] text-orange-500 mt-1">Được đồng bộ tự động từ hệ thống</p>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase">Văn bản nút CTA</label>
                  <input
                    value={bannerMeta?.buttonText ?? ''}
                    onChange={(e) => updateMeta({ buttonText: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="Liên hệ ngay"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase">Link nút CTA</label>
                  <input
                    value={bannerMeta?.buttonLink ?? ''}
                    onChange={(e) => updateMeta({ buttonLink: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="#contact"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase">Tiêu đề card phụ</label>
                  <input
                    value={bannerMeta?.cardTitle ?? ''}
                    onChange={(e) => updateMeta({ cardTitle: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          {draft.items.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Các mục ({draft.items.length})
              </h3>
              {draft.items.map((item) => (
                <ItemEditor
                  key={item.id}
                  item={item}
                  onChange={(fields) => updateItem(item.id, fields)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => { onSave(draft); onClose(); }}
            className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
          >
            ✓ Áp dụng thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminHomepagePage() {
  const [sections, setSections] = useState<HomepageSectionDto[]>([]);
  const [systemExchangeRate, setSystemExchangeRate] = useState<number>(3980);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [editingSection, setEditingSection] = useState<HomepageSectionDto | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  // ── Fetch từ API admin ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [resSec, resRate] = await Promise.all([
          fetch('/api/admin/homepage/sections'),
          fetch('/api/settings/exchange-rate'),
        ]);
        if (resSec.ok) {
          const data: HomepageSectionDto[] = await resSec.json();
          setSections(data.sort((a, b) => a.orderIndex - b.orderIndex));
        }
        if (resRate.ok) {
          const rateData = await resRate.json();
          setSystemExchangeRate(Number(rateData.exchange_rate) || 3980);
        }
      } catch {
        setToast({ type: 'error', msg: 'Không thể tải cấu hình. Kiểm tra kết nối.' });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    setSections((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(result.source.index, 1);
      arr.splice(result.destination!.index, 0, moved);
      // Cập nhật orderIndex theo vị trí mới
      return arr.map((s, i) => ({ ...s, orderIndex: i + 1 }));
    });
    setIsDirty(true);
  }, []);

  // ── Toggle hiện/ẩn section ────────────────────────────────────────────────
  const toggleActive = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)),
    );
    setIsDirty(true);
  };

  // ── Áp dụng thay đổi từ modal ─────────────────────────────────────────────
  const applyEdit = (updated: HomepageSectionDto) => {
    setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setIsDirty(true);
  };

  // ── Lưu toàn bộ ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: UpsertHomepageSectionPayload[] = sections.map((s) => {
        let meta = s.meta;
        if (s.sectionType === 'banner' && meta) {
          const { exchangeRate, ...rest } = meta as any;
          meta = rest;
        }
        return {
          id: s.id,
          sectionType: s.sectionType,
          label: s.label,
          orderIndex: s.orderIndex,
          isActive: s.isActive,
          title: s.title,
          subtitle: s.subtitle,
          meta: meta,
          items: s.items.map((i) => ({
            id: i.id,
            label: i.label,
            content: i.content,
            icon: i.icon,
            imageUrl: i.imageUrl,
            orderIndex: i.orderIndex,
            isActive: i.isActive,
            meta: i.meta,
          })),
        };
      });

      const res = await fetch('/api/admin/homepage/sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', msg: data.message ?? 'Đã lưu thành công!' });
        setIsDirty(false);
      } else {
        setToast({ type: 'error', msg: data.error ?? 'Lưu thất bại. Thử lại.' });
      }
    } catch {
      setToast({ type: 'error', msg: 'Lỗi kết nối. Kiểm tra mạng.' });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-72" />
        {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Quản lý Giao diện Trang Chủ</h1>
            <p className="mt-1 text-sm text-slate-500">
              Kéo thả để sắp xếp thứ tự · Nhấn <strong>Chỉnh sửa</strong> để sửa nội dung · Toggle để ẩn/hiện
            </p>
          </div>
          <button
            id="cms-save-btn"
            onClick={handleSave}
            disabled={isSaving}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shrink-0 ${
              isDirty
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 ring-2 ring-indigo-200'
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
            ) : isDirty ? '💾 Lưu cấu hình' : '✓ Đã lưu'}
          </button>
        </div>

        {/* Chú thích tỷ giá */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-orange-50 border border-orange-200 text-sm text-orange-700">
          <span className="text-base">💱</span>
          <span>
            Tỷ giá hiện tại của hệ thống:{' '}
            <strong>
              {systemExchangeRate.toLocaleString('vi-VN')} ₫
            </strong>
            {' '}(Được đồng bộ tự động)
          </span>
        </div>

        {/* Drag & Drop List */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-700">Bố cục trang chủ</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {sections.length} sections · Kéo thả ⠿ để sắp xếp thứ tự hiển thị
            </p>
          </div>

          {sections.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-sm">Chưa có section nào. Chạy migration seed để tạo dữ liệu mặc định.</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="homepage-sections">
                {(drop) => (
                  <div ref={drop.innerRef} {...drop.droppableProps} className="divide-y divide-slate-100">
                    {sections.map((section, index) => {
                      const bannerMeta = section.sectionType === 'banner'
                        ? (section.meta as BannerSectionMeta | null)
                        : null;

                      return (
                        <Draggable key={section.id} draggableId={section.id} index={index}>
                          {(drag, snapshot) => (
                            <div
                              ref={drag.innerRef}
                              {...drag.draggableProps}
                              className={`flex items-center gap-4 px-5 py-4 transition-all duration-150 ${
                                snapshot.isDragging
                                  ? 'bg-indigo-50 shadow-lg rounded-xl scale-[1.01]'
                                  : 'bg-white hover:bg-slate-50'
                              } ${!section.isActive ? 'opacity-50' : ''}`}
                            >
                              {/* Drag handle */}
                              <div
                                {...drag.dragHandleProps}
                                className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing text-xl select-none shrink-0"
                                title="Kéo để sắp xếp"
                              >
                                ⠿
                              </div>

                              {/* Icon + thông tin */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl leading-none">{sectionIcon(section.sectionType)}</span>
                                  <div>
                                    <p className="font-semibold text-slate-800 text-sm">{section.label}</p>
                                    <p className="text-xs text-slate-400">
                                      {SECTION_TYPE_LABELS[section.sectionType] ?? section.sectionType}
                                      {section.items.length > 0 && ` · ${section.items.length} mục`}
                                      {section.sectionType === 'banner' && (
                                        <span className="ml-2 font-medium text-orange-500">
                                          💱 {systemExchangeRate.toLocaleString('vi-VN')} ₫
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Controls */}
                              <div className="flex items-center gap-2 shrink-0">
                                {/* Edit */}
                                <button
                                  onClick={() => setEditingSection(section)}
                                  className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                >
                                  ✏️ Chỉnh sửa
                                </button>

                                {/* Toggle */}
                                <label
                                  className="relative inline-flex cursor-pointer items-center"
                                  title={section.isActive ? 'Đang hiển thị' : 'Đang ẩn'}
                                  onClick={(e) => { e.preventDefault(); toggleActive(section.id); }}
                                >
                                  <div className={`w-10 h-5 rounded-full transition-colors ${section.isActive ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                                    <div className={`absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-white shadow transition-transform ${section.isActive ? 'translate-x-5' : ''}`} />
                                  </div>
                                </label>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {drop.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>

        {/* JSON debug */}
        <details className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <summary className="cursor-pointer px-5 py-3 text-xs text-slate-400 hover:text-slate-600 select-none">
            🔍 Xem JSON cấu hình hiện tại (debug)
          </summary>
          <pre className="px-5 pb-4 max-h-64 overflow-auto text-[10px] text-green-400 bg-slate-900">
            {JSON.stringify(sections, null, 2)}
          </pre>
        </details>
      </div>

      {/* Edit Modal */}
      {editingSection && (
        <EditModal
          section={editingSection}
          systemExchangeRate={systemExchangeRate}
          onSave={applyEdit}
          onClose={() => setEditingSection(null)}
        />
      )}

      {/* Toast */}
      <ToastBanner toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
