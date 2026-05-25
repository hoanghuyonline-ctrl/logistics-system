"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n";

const RichTextEditor = dynamic(() => import("@/components/products/RichTextEditor"), { ssr: false });

const CATEGORIES = [
  "IMPORT_POLICY",
  "EXPORT_TAX",
  "HS_CODE",
  "LOGISTICS_NEWS",
  "EXPORT_GUIDE",
  "INCOTERMS",
  "VIETNAM_PORTS",
];

export default function NewArticlePage() {
  const { t } = useI18n();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    summary: "",
    content: "",
    category: "LOGISTICS_NEWS",
    coverImage: "",
    tags: "",
    isPublished: false,
  });

  const updateForm = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (publish: boolean) => {
    setError("");
    if (!form.title.trim()) { setError(t("knowledge.error.noTitle")); return; }
    if (!form.content.trim()) { setError(t("knowledge.error.noContent")); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, isPublished: publish }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error");
        return;
      }

      router.push("/admin/knowledge");
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title={t("knowledge.newArticle")} subtitle={t("knowledge.newArticleDesc")} />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      <Card className="mb-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              {t("knowledge.articleTitle")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateForm("title", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t("knowledge.titlePlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">{t("knowledge.summary")}</label>
            <textarea
              value={form.summary}
              onChange={(e) => updateForm("summary", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t("knowledge.summaryPlaceholder")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t("knowledge.categoryLabel")}</label>
              <select
                value={form.category}
                onChange={(e) => updateForm("category", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{t(`knowledge.category.${c}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t("knowledge.tags")}</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => updateForm("tags", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t("knowledge.tagsPlaceholder")}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">{t("knowledge.coverImage")}</label>
            <input
              type="text"
              value={form.coverImage}
              onChange={(e) => updateForm("coverImage", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t("knowledge.coverImagePlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              {t("knowledge.content")} <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              value={form.content}
              onChange={(html: string) => updateForm("content", html)}
              placeholder={t("knowledge.contentPlaceholder")}
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-3 mb-8">
        <button
          type="button"
          onClick={() => router.push("/admin/knowledge")}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={saving}
          className="px-6 py-2.5 bg-gray-600 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
        >
          {t("knowledge.saveDraft")}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={saving}
          className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
        >
          {t("knowledge.publishNow")}
        </button>
      </div>
    </div>
  );
}
