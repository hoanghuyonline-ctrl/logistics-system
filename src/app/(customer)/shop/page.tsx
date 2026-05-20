"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  estimatedPrice: string | null;
  imageUrl: string | null;
  isActive: boolean;
}

interface WalletInfo {
  balance: string;
  debt: string;
}

export default function ShopPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [buyingProduct, setBuyingProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customerNote, setCustomerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [prodRes, walletRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/wallet"),
      ]);
      if (prodRes.ok) setProducts(await prodRes.json());
      if (walletRes.ok) setWallet(await walletRes.json());
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];

  const filtered = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  const formatPrice = (price: string | null) => {
    if (!price) return t("sales.contactForPrice");
    return parseFloat(price).toLocaleString("vi-VN") + " ₫";
  };

  const handleBuy = async () => {
    if (!buyingProduct) return;
    setSubmitting(true);
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
        toast(t("sales.purchaseSuccess"), "success");
        setBuyingProduct(null);
        setQuantity(1);
        setCustomerNote("");
      } else {
        const err = await res.json();
        toast(err.error || "Error", "error");
      }
    } catch {
      toast("Error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title={t("sales.shopTitle")} subtitle={t("sales.shopSubtitle")} />

      {/* Wallet summary */}
      {wallet && (
        <div className="mb-4 flex items-center gap-4 text-sm text-slate-600">
          <span>{t("sales.walletBalance")}: <strong className="text-green-600">{parseFloat(wallet.balance).toLocaleString("vi-VN")} ₫</strong></span>
          {parseFloat(wallet.debt) > 0 && (
            <span>{t("sales.walletDebt")}: <strong className="text-red-600">{parseFloat(wallet.debt).toLocaleString("vi-VN")} ₫</strong></span>
          )}
        </div>
      )}

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

      {/* Product grid — Shopee-like */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">{t("sales.noProducts")}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition group cursor-pointer"
              onClick={() => { setBuyingProduct(product); setQuantity(1); setCustomerNote(""); }}
            >
              {/* Image */}
              <div className="aspect-square bg-slate-50 flex items-center justify-center overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                ) : (
                  <span className="text-4xl text-slate-300">🛍️</span>
                )}
              </div>
              {/* Info */}
              <div className="p-2.5">
                <h3 className="text-sm font-medium text-slate-800 line-clamp-2 leading-tight mb-1">{product.name}</h3>
                {product.category && (
                  <span className="text-[11px] text-slate-400">{product.category}</span>
                )}
                <div className="mt-1.5">
                  <span className="text-orange-600 font-bold text-sm">
                    {formatPrice(product.estimatedPrice)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Buy modal */}
      {buyingProduct && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setBuyingProduct(null)}>
          <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl p-5 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Product header */}
            <div className="flex gap-3 mb-4">
              <div className="w-20 h-20 bg-slate-50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                {buyingProduct.imageUrl ? (
                  <img src={buyingProduct.imageUrl} alt={buyingProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🛍️</span>
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
                >−</button>
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
                  {(parseFloat(buyingProduct.estimatedPrice) * quantity).toLocaleString("vi-VN")} ₫
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

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setBuyingProduct(null)}
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
          </div>
        </div>
      )}
    </div>
  );
}
