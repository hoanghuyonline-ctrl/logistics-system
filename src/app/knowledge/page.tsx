"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LandingNavbar, LandingFooter, LandingMobileBar } from "@/components/landing";
import { useI18n } from "@/lib/i18n";

interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  category: string;
  coverImage: string | null;
  tags: string | null;
  viewCount: number;
  publishedAt: string | null;
  author: { fullName: string };
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

export default function KnowledgePage() {
  const { t } = useI18n();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (selectedCategory) params.set("category", selectedCategory);
    if (search) params.set("search", search);

    fetch(`/api/public/knowledge?${params}`)
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
  }, [page, selectedCategory, search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      <LandingNavbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 pb-24 sm:pb-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            📚 {t("knowledge.publicTitle")}
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            {t("knowledge.publicSubtitle")}
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t("knowledge.searchArticles")}
            className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <button
            onClick={() => { setSelectedCategory(""); setPage(1); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              !selectedCategory
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {t("common.all")}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => { setSelectedCategory(c); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === c
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {CATEGORY_ICONS[c]} {t(`knowledge.category.${c}`)}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500">{t("knowledge.noArticles")}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/knowledge/${article.slug}`}
                  className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
                >
                  {article.coverImage && (
                    <div className="h-40 bg-gray-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">{CATEGORY_ICONS[article.category] || "📄"}</span>
                      <span className="text-xs text-blue-600 font-medium">
                        {t(`knowledge.category.${article.category}`)}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition line-clamp-2 mb-1">
                      {article.title}
                    </h3>
                    {article.summary && (
                      <p className="text-xs text-gray-500 line-clamp-2">{article.summary}</p>
                    )}
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                      <span>{article.author.fullName}</span>
                      <span className="flex items-center gap-1">
                        👁 {article.viewCount}
                        {article.publishedAt && (
                          <> · {new Date(article.publishedAt).toLocaleDateString("vi-VN")}</>
                        )}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  ← {t("common.prev")}
                </button>
                <span className="text-sm text-gray-500">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  {t("common.next")} →
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <LandingFooter />
      <LandingMobileBar />
    </div>
  );
}
