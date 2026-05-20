"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LandingNavbar, LandingFooter, LandingMobileBar } from "@/components/landing";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";

const PENDING_KEY = "pending_sales_request";

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
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const pendingSubmitted = useRef(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [buyingProduct, setBuyingProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customerNote, setCustomerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

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

  useEffect(() => {
    if (status !== "authenticated" || pendingSubmitted.current) return;
    let raw: string | null = null;
    try { raw = window.localStorage.getItem(PENDING_KEY); } catch { return; }
    if (!raw) return;
    pendingSubmitted.current = true;
    let payload: { productId: string; productName: string; quantity: number; customerNote?: string };
    try { payload = JSON.parse(raw); } catch { window.localStorage.removeItem(PENDING_KEY); return; }
    (async () => {
      try {
        const res = await fetch("/api/sales-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast(t("sales.purchaseSuccess"), "success");
        } else {
          toast(t("publicShop.submitError"), "error");
        }
      } catch {
        toast(t("publicShop.submitError"), "error");
      } finally {
        try { window.localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
      }
    })();
  }, [status, t, toast]);

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];

  const filtered = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  const formatPrice = (price: string | null) => {
    if (!price) return t("sales.contactForPrice");
    return parseFloat(price).toLocaleString("vi-VN") + " \u20AB";
  };

  const handleBuy = async () => {
    if (!buyingProduct) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/sales-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: buyingProduct.id,
          productName: buyingProduct.name,
          quantity,
          customerNote: customerNote || undefined,
        }),
      });
      if (res.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setBuyingProduct(null);
          setQuantity(1);
          setCustomerNote("");
          setSubmitSuccess(false);
        }, 2000);
      } else if (res.status === 401) {
        try {
          window.localStorage.setItem(PENDING_KEY, JSON.stringify({
            productId: buyingProduct.id,
            productName: buyingProduct.name,
            quantity,
            customerNote: customerNote || undefined,
          }));
        } catch { /* localStorage unavailable */ }
        setBuyingProduct(null);
        router.push("/login?callbackUrl=/shop");
      } else {
        const err = await res.json();
        setSubmitError(err.error || t("publicShop.submitError"));
      }
    } catch {
      setSubmitError(t("publicShop.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pb-14 sm:pb-0">
      <LandingNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition group"
              >
                {/* Image */}
                <div className="aspect-square bg-slate-50 flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  ) : (
                    <span className="text-4xl text-slate-300">{"\uD83D\uDECD\uFE0F"}</span>
                  )}
                </div>
                {/* Info */}
                <div className="p-2.5">
                  <h3 className="text-sm font-medium text-slate-800 line-clamp-2 leading-tight mb-1">{product.name}</h3>
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
                    onClick={() => { setBuyingProduct(product); setQuantity(1); setCustomerNote(""); setSubmitError(""); setSubmitSuccess(false); }}
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

      {/* Buy modal */}
      {buyingProduct && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => { if (!submitting) setBuyingProduct(null); }}>
          <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-5 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {submitSuccess ? (
              <div className="text-center py-8">
                <span className="text-5xl mb-3 block">{"\u2705"}</span>
                <p className="text-lg font-semibold text-green-700">{t("sales.purchaseSuccess")}</p>
              </div>
            ) : (
              <>
                {/* Product header */}
                <div className="flex gap-3 mb-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {buyingProduct.imageUrl ? (
                      <img src={buyingProduct.imageUrl} alt={buyingProduct.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">{"\uD83D\uDECD\uFE0F"}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900">{buyingProduct.name}</h3>
                    {buyingProduct.description && (
                      <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{buyingProduct.description}</p>
                    )}
                    <div className="text-orange-600 font-bold mt-1">
                      {formatPrice(buyingProduct.estimatedPrice)}
                    </div>
                  </div>
                </div>

                {/* Quantity */}
                <div className="mb-3">
                  <label className="text-sm font-medium text-slate-700 mb-1 block">{t("sales.quantity")}</label>
                  <div className="flex items-center gap-2">
                    <button
                      className="w-8 h-8 rounded border border-slate-300 flex items-center justify-center text-lg font-bold text-slate-600 hover:bg-slate-50"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >{"\u2212"}</button>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center border border-slate-300 rounded px-2 py-1.5 text-sm"
                    />
                    <button
                      className="w-8 h-8 rounded border border-slate-300 flex items-center justify-center text-lg font-bold text-slate-600 hover:bg-slate-50"
                      onClick={() => setQuantity(quantity + 1)}
                    >+</button>
                  </div>
                </div>

                {/* Estimated total */}
                {buyingProduct.estimatedPrice && (
                  <div className="mb-3 p-2.5 bg-orange-50 rounded-lg">
                    <span className="text-sm text-slate-600">{t("sales.estimatedTotal")}: </span>
                    <span className="font-bold text-orange-600">
                      {(parseFloat(buyingProduct.estimatedPrice) * quantity).toLocaleString("vi-VN")} {"\u20AB"}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">{t("sales.waitingPrice")}</p>
                  </div>
                )}

                {/* Customer note */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-slate-700 mb-1 block">{t("sales.customerNote")}</label>
                  <textarea
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder={t("sales.customerNote")}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none h-16"
                  />
                </div>

                {/* Auth hint */}
                <p className="text-xs text-slate-400 mb-3 text-center">{t("publicShop.loginHint")}</p>

                {/* Error */}
                {submitError && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{submitError}</div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setBuyingProduct(null)}
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={handleBuy}
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 disabled:opacity-50 transition"
                  >
                    {submitting ? t("common.loading") : t("sales.confirmPurchase")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <LandingFooter />
      <LandingMobileBar />
    </div>
  );
}
