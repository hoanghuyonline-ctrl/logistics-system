"use client";

/**
 * @file src/components/admin/RichTextEditor.tsx
 *
 * Bộ soạn thảo Rich Text Editor cao cấp sử dụng TipTap v2.
 * Hỗ trợ:
 *   - Định dạng cơ bản: Bold, Italic, Underline, Strike, Blockquote
 *   - Thẻ tiêu đề: H1, H2, H3, H4
 *   - Danh sách: Bullet List, Ordered List
 *   - Highlight màu sắc & Căn lề văn bản (Trái, Giữa, Phải, Đều)
 *   - Chèn ảnh thông qua Drag & Drop hoặc Paste từ clipboard (Upload bất đồng bộ lên Server)
 *   - Menu nổi (Bubble Menu) khi bôi đen chữ tương tự Notion.
 */

import React, { useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Image as ImageIcon,
  Highlighter,
  Trash2,
  UploadCloud,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung định dạng tại đây...",
}: RichTextEditorProps) {
  const [isUploading, setIsUploading] = useState(false);

  // 1. Hàm upload ảnh bất đồng bộ lên server
  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/homepage/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        return data.url; // Đường dẫn URL của file ảnh sau khi upload thành công
      }
    } catch (error) {
      console.error("Upload image error:", error);
    } finally {
      setIsUploading(false);
    }
    return null;
  }, []);

  // 2. Khởi tạo cấu hình TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: "mx-auto max-w-full my-4 rounded-2xl border border-slate-200 shadow-md",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none focus:outline-none min-h-[180px] px-5 py-4 text-slate-800 bg-white placeholder-slate-400 focus:ring-0",
      },
      // Xử lý kéo thả ảnh trực tiếp từ máy tính vào khung soạn thảo
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            uploadImage(file).then((url) => {
              if (url) {
                const { schema } = view.state;
                const node = schema.nodes.image.create({ src: url });
                const transaction = view.state.tr.replaceSelectionWith(node);
                view.dispatch(transaction);
              }
            });
            return true;
          }
        }
        return false;
      },
      // Xử lý paste ảnh trực tiếp từ Clipboard (chụp màn hình / copy ảnh)
      handlePaste: (view, event) => {
        if (event.clipboardData && event.clipboardData.files && event.clipboardData.files[0]) {
          const file = event.clipboardData.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            uploadImage(file).then((url) => {
              if (url) {
                const { schema } = view.state;
                const node = schema.nodes.image.create({ src: url });
                const transaction = view.state.tr.replaceSelectionWith(node);
                view.dispatch(transaction);
              }
            });
            return true;
          }
        }
        return false;
      },
    },
  });

  const triggerImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const url = await uploadImage(file);
        if (url && editor) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      }
    };
    input.click();
  };

  if (!editor) return null;

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:border-slate-300 transition-all duration-200">
      {/* 1. THANH CÔNG CỤ SOẠN THẢO CHÍNH (TOOLBAR) */}
      <div className="flex flex-wrap items-center gap-1.5 p-3 border-b border-slate-100 bg-slate-50">
        {/* Nhóm định dạng Text */}
        <div className="flex items-center gap-0.5 bg-white rounded-lg border border-slate-200/60 p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors ${editor.isActive("bold") ? "bg-slate-200 text-indigo-700 font-bold" : "text-slate-600"}`}
            title="Bôi đậm (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors ${editor.isActive("italic") ? "bg-slate-200 text-indigo-700 font-bold" : "text-slate-600"}`}
            title="In nghiêng (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors ${editor.isActive("underline") ? "bg-slate-200 text-indigo-700 font-bold" : "text-slate-600"}`}
            title="Gạch chân (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Nhóm Headings */}
        <div className="flex items-center gap-0.5 bg-white rounded-lg border border-slate-200/60 p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors ${editor.isActive("heading", { level: 1 }) ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-600"}`}
            title="Tiêu đề H1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors ${editor.isActive("heading", { level: 2 }) ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-600"}`}
            title="Tiêu đề H2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors ${editor.isActive("heading", { level: 3 }) ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-600"}`}
            title="Tiêu đề H3"
          >
            <Heading3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
            className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors ${editor.isActive("heading", { level: 4 }) ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-600"}`}
            title="Tiêu đề H4"
          >
            <Heading4 className="w-4 h-4" />
          </button>
        </div>

        {/* Nhóm lists & blocks */}
        <div className="flex items-center gap-0.5 bg-white rounded-lg border border-slate-200/60 p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors ${editor.isActive("bulletList") ? "bg-slate-200 text-indigo-700 font-bold" : "text-slate-600"}`}
            title="Danh sách dấu chấm"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors ${editor.isActive("orderedList") ? "bg-slate-200 text-indigo-700 font-bold" : "text-slate-600"}`}
            title="Danh sách số thứ tự"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors ${editor.isActive("blockquote") ? "bg-slate-200 text-indigo-700 font-bold" : "text-slate-600"}`}
            title="Trích dẫn"
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>

        {/* Nhóm căn lề */}
        <div className="flex items-center gap-0.5 bg-white rounded-lg border border-slate-200/60 p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors ${editor.isActive({ textAlign: "left" }) ? "bg-slate-200 text-indigo-700" : "text-slate-600"}`}
            title="Căn trái"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors ${editor.isActive({ textAlign: "center" }) ? "bg-slate-200 text-indigo-700" : "text-slate-600"}`}
            title="Căn giữa"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors ${editor.isActive({ textAlign: "right" }) ? "bg-slate-200 text-indigo-700" : "text-slate-600"}`}
            title="Căn phải"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors ${editor.isActive({ textAlign: "justify" }) ? "bg-slate-200 text-indigo-700" : "text-slate-600"}`}
            title="Căn đều hai bên"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Highlight màu sắc */}
        <div className="flex items-center gap-0.5 bg-white rounded-lg border border-slate-200/60 p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()}
            className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors ${editor.isActive("highlight", { color: "#fef08a" }) ? "bg-yellow-200 text-yellow-900" : "text-slate-600"}`}
            title="Tô màu nền vàng"
          >
            <Highlighter className="w-4 h-4 text-yellow-500" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight({ color: "#bfdbfe" }).run()}
            className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors ${editor.isActive("highlight", { color: "#bfdbfe" }) ? "bg-blue-200 text-blue-900" : "text-slate-600"}`}
            title="Tô màu nền xanh"
          >
            <Highlighter className="w-4 h-4 text-blue-500" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight({ color: "#bbf7d0" }).run()}
            className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors ${editor.isActive("highlight", { color: "#bbf7d0" }) ? "bg-green-200 text-green-900" : "text-slate-600"}`}
            title="Tô màu nền xanh lá"
          >
            <Highlighter className="w-4 h-4 text-green-500" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetHighlight().run()}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 transition-colors"
            title="Xóa màu nền"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Chèn ảnh */}
        <div className="flex items-center gap-0.5 bg-white rounded-lg border border-slate-200/60 p-0.5 shadow-sm">
          <button
            type="button"
            onClick={triggerImageUpload}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-50 disabled:cursor-wait text-xs font-semibold"
            title="Tải lên ảnh từ máy tính"
          >
            {isUploading ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4 text-indigo-500" />
            )}
            Ảnh
          </button>
        </div>
      </div>

      {/* 2. MENU BONG BÓNG NỔI (BUBBLE MENU - NOTION STYLE) */}
      {editor && (
        <BubbleMenu
          editor={editor}
          className="flex items-center gap-0.5 bg-slate-900/95 backdrop-blur-sm text-white rounded-xl p-1 shadow-xl border border-slate-800"
        >
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-lg transition-colors hover:bg-slate-800 ${editor.isActive("bold") ? "text-indigo-400" : "text-white"}`}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-lg transition-colors hover:bg-slate-800 ${editor.isActive("italic") ? "text-indigo-400" : "text-white"}`}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded-lg transition-colors hover:bg-slate-800 ${editor.isActive("underline") ? "text-indigo-400" : "text-white"}`}
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-yellow-300"
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>
        </BubbleMenu>
      )}

      {/* 3. KHU VỰC NHẬP NỘI DUNG SOẠN THẢO */}
      <div className="relative">
        <EditorContent editor={editor} />
        {isUploading && (
          <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
            <div className="bg-white/80 border border-slate-100 shadow-md px-4 py-2.5 rounded-xl flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-slate-600">Đang tải ảnh lên...</span>
            </div>
          </div>
        )}
      </div>

      {/* Chú thích kéo thả bên dưới */}
      <div className="px-5 py-2 border-t border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 flex items-center justify-between">
        <span>💡 Mẹo: Bôi đen văn bản để hiện Menu nổi Notion. Hỗ trợ Ctrl+B/I/U.</span>
        <span>Drag & Drop hoặc Paste ảnh trực tiếp vào đây</span>
      </div>
    </div>
  );
}
