"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LandingNavbar, LandingFooter, LandingMobileBar } from "@/components/landing";
import { useI18n } from "@/lib/i18n";

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  estimatedPrice: string | null;
  imageUrl: string | null;
}

export default function PublicShopPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/public/products");
      if (res.ok) setProducts(await res.json());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];

  const filtered = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  const formatPrice = (price: string | null) => {
    if (!price) return t("sales.contactForPrice");
    return parseFloat(price).toLocaleString("vi-VN") + " \u20AB";
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pb-14 sm:pb-0">
      <LandingNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{t("publicShop.title")}</h1>
          <p className="text-sm text-slate-500 mt-1">{t("publicShop.subtitle")}</p>
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${!selectedCategory ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {t("sales.allCategories")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${selectedCategory === cat ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">{t("common.loading")}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">{t("sales.noProducts")}</div>
        ) : (
          /* Product grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition group"
              >
                {/* Image */}
                <div
                  className="aspect-square bg-slate-50 flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={() => router.push(`/shop/${product.id}`)}
                >
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  ) : (
                    <span className="text-4xl text-slate-300">{"\uD83D\uDECD\uFE0F"}</span>
                  )}
                </div>
                {/* Info */}
                <div className="p-2.5">
                  <h3
                    className="text-sm font-medium text-slate-800 line-clamp-2 leading-tight mb-1 cursor-pointer hover:text-orange-600 transition"
                    onClick={() => router.push(`/shop/${product.id}`)}
                  >{product.name}</h3>
                  {product.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-1">{product.description}</p>
                  )}
                  {product.category && (
                    <span className="inline-block text-[10px] font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full mb-1.5">{product.category}</span>
                  )}
                  <div className="mt-1">
                    <span className="text-orange-600 font-bold text-sm">
                      {formatPrice(product.estimatedPrice)}
                    </span>
                  </div>
                  <button
                    onClick={() => router.push(`/shop/${product.id}`)}
                    className="mt-2 w-full px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 active:scale-[0.98] transition"
                  >
                    {t("sales.buyNow")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <LandingFooter />
      <LandingMobileBar />
    </div>
  );
}
