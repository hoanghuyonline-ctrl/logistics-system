"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { LandingNavbar, LandingFooter, LandingMobileBar } from "@/components/landing";
import { useI18n } from "@/lib/i18n";

interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
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

export default function ArticleDetailPage() {
  const { t } = useI18n();
  const params = useParams();
  const slug = params.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/public/knowledge/${slug}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) setArticle(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      <LandingNavbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 pb-24 sm:pb-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : !article ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500 mb-4">{t("knowledge.articleNotFound")}</p>
            <Link
              href="/knowledge"
              className="text-blue-600 hover:underline text-sm"
            >
              ← {t("knowledge.backToList")}
            </Link>
          </div>
        ) : (
          <article>
            {/* Back link */}
            <Link
              href="/knowledge"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-6"
            >
              ← {t("knowledge.backToList")}
            </Link>

            {/* Cover image */}
            {article.coverImage && (
              <div className="rounded-2xl overflow-hidden mb-6 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-48 sm:h-64 object-cover"
                />
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                {CATEGORY_ICONS[article.category] || "📄"} {t(`knowledge.category.${article.category}`)}
              </span>
              <span className="text-xs text-gray-400">
                {article.author.fullName}
              </span>
              {article.publishedAt && (
                <span className="text-xs text-gray-400">
                  {new Date(article.publishedAt).toLocaleDateString("vi-VN")}
                </span>
              )}
              <span className="text-xs text-gray-400">👁 {article.viewCount}</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>

            {/* Summary */}
            {article.summary && (
              <p className="text-gray-600 text-base leading-relaxed mb-6 border-l-4 border-blue-300 pl-4 bg-blue-50/50 py-3 rounded-r-xl">
                {article.summary}
              </p>
            )}

            {/* Content */}
            <div
              className="prose prose-sm sm:prose max-w-none prose-headings:text-gray-900 prose-a:text-blue-600 prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Tags */}
            {article.tags && (
              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-200">
                <span className="text-xs text-gray-400">{t("knowledge.tags")}:</span>
                {article.tags.split(",").map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </article>
        )}
      </main>

      <LandingFooter />
      <LandingMobileBar />
    </div>
  );
}
