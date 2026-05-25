"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import { useI18n } from "@/lib/i18n";

interface Author {
  id: string;
  fullName: string;
}

interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  category: string;
  isPublished: boolean;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  author: Author;
}

const CATEGORY_ICONS: Record<string, string> = {
  IMPORT_POLICY: "📜",
  EXPORT_TAX: "💰",
  HS_CODE: "🔢",
  LOGISTICS_NEWS: "📰",
  EXPORT_GUIDE: "📖",
  INCOTERMS: "📋",
  VIETNAM_PORTS: "🚢",
};

const CATEGORIES = [
  "IMPORT_POLICY",
  "EXPORT_TAX",
  "HS_CODE",
  "LOGISTICS_NEWS",
  "EXPORT_GUIDE",
  "INCOTERMS",
  "VIETNAM_PORTS",
];

export default function AdminKnowledgePage() {
  const { t } = useI18n();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [publishedFilter, setPublishedFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (categoryFilter) params.set("category", categoryFilter);
    if (publishedFilter) params.set("published", publishedFilter);
    if (search) params.set("search", search);

    fetch(`/api/admin/knowledge?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setArticles(data.articles || []);
          setTotalPages(data.totalPages || 1);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setArticles([]);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [page, categoryFilter, publishedFilter, search]);

  const handleDelete = async (id: string) => {
    if (!confirm(t("knowledge.confirmDelete"))) return;
    const res = await fetch(`/api/admin/knowledge/${id}`, { method: "DELETE" });
    if (res.ok) {
      setArticles((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const togglePublish = async (article: Article) => {
    const res = await fetch(`/api/admin/knowledge/${article.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !article.isPublished }),
    });
    if (res.ok) {
      const updated = await res.json();
      setArticles((prev) => prev.map((a) => (a.id === article.id ? { ...a, isPublished: updated.isPublished, publishedAt: updated.publishedAt } : a)));
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title={t("knowledge.adminTitle")}
        subtitle={t("knowledge.adminSubtitle")}
        action={
          <Link
            href="/admin/knowledge/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
          >
            ➕ {t("knowledge.newArticle")}
          </Link>
        }
      />

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">{t("common.search")}</label>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t("knowledge.searchPlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t("knowledge.categoryFilter")}</label>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t("common.all")}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{t(`knowledge.category.${c}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t("knowledge.publishedFilter")}</label>
            <select
              value={publishedFilter}
              onChange={(e) => { setPublishedFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t("common.all")}</option>
              <option value="true">{t("knowledge.published")}</option>
              <option value="false">{t("knowledge.draft")}</option>
            </select>
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner />
      ) : articles.length === 0 ? (
        <EmptyState
          icon="📚"
          title={t("knowledge.empty")}
          description={t("knowledge.emptyDesc")}
        />
      ) : (
        <>
          <div className="space-y-3">
            {articles.map((article) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{CATEGORY_ICONS[article.category] || "📄"}</span>
                      <Link
                        href={`/admin/knowledge/${article.id}`}
                        className="font-semibold text-sm text-gray-900 hover:text-blue-600 transition"
                      >
                        {article.title}
                      </Link>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          article.isPublished
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {article.isPublished ? t("knowledge.published") : t("knowledge.draft")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {t(`knowledge.category.${article.category}`)} · {article.author.fullName} · 👁 {article.viewCount}
                    </p>
                    {article.summary && (
                      <p className="text-sm text-gray-500 truncate mt-1">{article.summary}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => togglePublish(article)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                        article.isPublished
                          ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                          : "bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                    >
                      {article.isPublished ? t("knowledge.unpublish") : t("knowledge.publish")}
                    </button>
                    <Link
                      href={`/admin/knowledge/${article.id}`}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition"
                    >
                      {t("common.edit")}
                    </Link>
                    <button
                      onClick={() => handleDelete(article.id)}
                      className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition"
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
