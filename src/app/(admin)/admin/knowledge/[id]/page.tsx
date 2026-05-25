"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
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

interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  category: string;
  coverImage: string | null;
  tags: string | null;
  isPublished: boolean;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  author: { id: string; fullName: string };
}

export default function EditArticlePage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    summary: "",
    content: "",
    category: "LOGISTICS_NEWS",
    coverImage: "",
    tags: "",
  });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/knowledge/${id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) {
          setArticle(data);
          setForm({
            title: data.title,
            summary: data.summary || "",
            content: data.content,
            category: data.category,
            coverImage: data.coverImage || "",
            tags: data.tags || "",
          });
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (publish?: boolean) => {
    setError("");
    if (!form.title.trim()) { setError(t("knowledge.error.noTitle")); return; }
    if (!form.content.trim()) { setError(t("knowledge.error.noContent")); return; }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (publish !== undefined) payload.isPublished = publish;

      const res = await fetch(`/api/admin/knowledge/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error");
        return;
      }

      const updated = await res.json();
      setArticle(updated);
      router.push("/admin/knowledge");
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!article) return <div className="text-center py-8 text-gray-500">{t("common.notFound")}</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={t("knowledge.editArticle")}
        subtitle={article.slug}
        action={
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              article.isPublished ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
            }`}>
              {article.isPublished ? t("knowledge.published") : t("knowledge.draft")}
            </span>
            <span className="text-xs text-gray-400">👁 {article.viewCount}</span>
          </div>
        }
      />

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
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">{t("knowledge.summary")}</label>
            <textarea
              value={form.summary}
              onChange={(e) => updateForm("summary", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

      {/* Meta info */}
      <Card className="mb-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{t("knowledge.articleInfo")}</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-gray-400 text-xs">{t("knowledge.author")}</span>
            <p className="font-medium">{article.author.fullName}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">{t("knowledge.views")}</span>
            <p className="font-medium">{article.viewCount}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">{t("common.createdAt")}</span>
            <p className="font-medium">{new Date(article.createdAt).toLocaleDateString("vi-VN")}</p>
          </div>
          <div>
            <span className="text-gray-400 text-xs">{t("knowledge.publishedAt")}</span>
            <p className="font-medium">
              {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("vi-VN") : "—"}
            </p>
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
        {article.isPublished ? (
          <>
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-6 py-2.5 bg-yellow-600 text-white rounded-xl text-sm font-medium hover:bg-yellow-700 transition disabled:opacity-50"
            >
              {t("knowledge.unpublish")}
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? t("common.saving") : t("knowledge.saveChanges")}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="px-6 py-2.5 bg-gray-600 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
            >
              {saving ? t("common.saving") : t("knowledge.saveDraft")}
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
            >
              {t("knowledge.publishNow")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
