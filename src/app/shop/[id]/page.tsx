"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LandingNavbar, LandingFooter, LandingMobileBar } from "@/components/landing";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";
import { ShoppingBag } from "lucide-react";

const PENDING_KEY = "pending_sales_request";

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  estimatedPrice: string | null;
  imageUrl: string | null;
}

interface ColorOption {
  name: string;
  hex: string;
}

interface ProductVariants {
  type: "electronics" | "clothing" | "none";
  primaryLabel: string;
  primaryOptions: string[];
  colorLabel: string;
  colorOptions: ColorOption[];
}

function getProductVariants(category: string | null): ProductVariants {
  const cat = (category || "").toLowerCase();

  const isElectronics = ["điện thoại", "công nghệ", "electronics", "phone", "tablet", "laptop", "máy tính"].some((k) => cat.includes(k));
  if (isElectronics) {
    return {
      type: "electronics",
      primaryLabel: "Dung lượng",
      primaryOptions: ["256GB", "512GB", "1TB"],
      colorLabel: "Màu sắc",
      colorOptions: [
        { name: "Titan Tự Nhiên", hex: "#A8A196" },
        { name: "Titan Đen", hex: "#3B3B3D" },
        { name: "Titan Trắng", hex: "#F2F1ED" },
        { name: "Titan Sa Mạc", hex: "#BFA48E" },
      ],
    };
  }

  const isClothing = ["quần áo", "thời trang", "clothing", "fashion", "áo", "váy", "đầm", "giày", "phụ kiện"].some((k) => cat.includes(k));
  if (isClothing) {
    return {
      type: "clothing",
      primaryLabel: "Kích cỡ",
      primaryOptions: ["S", "M", "L", "XL"],
      colorLabel: "Màu sắc",
      colorOptions: [
        { name: "Trắng", hex: "#FFFFFF" },
        { name: "Đen", hex: "#222222" },
        { name: "Hồng", hex: "#F9A8D4" },
        { name: "Be", hex: "#D4C5A9" },
      ],
    };
  }

  return { type: "none", primaryLabel: "", primaryOptions: [], colorLabel: "", colorOptions: [] };
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useI18n();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedPrimary, setSelectedPrimary] = useState("");
  const [selectedColor, setSelectedColor] = useState(0);

  const variants = product ? getProductVariants(product.category) : null;
  const [quantity, setQuantity] = useState(1);
  const [customerNote, setCustomerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"features" | "specs">("features");

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/products/${id}`);
      if (res.ok) {
        setProduct(await res.json());
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    if (product) {
      const v = getProductVariants(product.category);
      if (v.primaryOptions.length > 0) setSelectedPrimary(v.primaryOptions[0]);
      setSelectedColor(0);
    }
  }, [product]);

  const pendingSubmitted = useRef(false);
  useEffect(() => {
    if (authStatus !== "authenticated" || pendingSubmitted.current) return;
    let raw: string | null = null;
    try { raw = window.localStorage.getItem(PENDING_KEY); } catch { /* */ }
    if (!raw) return;
    pendingSubmitted.current = true;
    try { window.localStorage.removeItem(PENDING_KEY); } catch { /* */ }
    let payload: Record<string, unknown>;
    try { payload = JSON.parse(raw) as Record<string, unknown>; } catch { return; }

    (async () => {
      try {
        const res = await fetch("/api/sales-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast(t("sales.purchaseSuccess"), "success");
          router.push("/shop/requests");
        } else {
          toast(t("publicShop.submitError"), "error");
        }
      } catch {
        toast(t("publicShop.submitError"), "error");
      }
    })();
  }, [authStatus, router, t, toast]);

  const formatPrice = (price: string | null) => {
    if (!price) return t("sales.contactForPrice");
    return parseFloat(price).toLocaleString("vi-VN") + " \u20AB";
  };

  const handleBuy = async () => {
    if (!product) return;
    setSubmitting(true);
    const optionParts: string[] = [];
    if (variants && variants.type !== "none") {
      if (selectedPrimary) optionParts.push(`${variants.primaryLabel}: ${selectedPrimary}`);
      if (variants.colorOptions[selectedColor]) optionParts.push(`${variants.colorLabel}: ${variants.colorOptions[selectedColor].name}`);
    }
    const selectedOptions = optionParts.length > 0 ? optionParts.join(" | ") : undefined;

    const payload = {
      productId: product.id,
      productName: product.name,
      quantity,
      customerNote: customerNote || undefined,
      selectedOptions,
    };

    try {
      const res = await fetch("/api/sales-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast(t("sales.purchaseSuccess"), "success");
        router.push("/shop/requests");
      } else if (res.status === 401) {
        try {
          window.localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
        } catch {
          /* localStorage unavailable */
        }
        router.push(`/login?callbackUrl=/shop/${id}`);
      } else {
        const err = await res.json();
        toast(err.error || t("publicShop.submitError"), "error");
      }
    } catch {
      toast(t("publicShop.submitError"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <LandingNavbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-slate-400 text-lg">{t("common.loading")}</div>
        </main>
        <LandingFooter />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <LandingNavbar />
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <span className="text-6xl">404</span>
          <p className="text-slate-500 text-lg">{t("productDetail.notFound")}</p>
          <button
            onClick={() => router.push("/shop")}
            className="px-6 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition"
          >
            {t("productDetail.backToShop")}
          </button>
        </main>
        <LandingFooter />
      </div>
    );
  }

  const estimatedTotal = product.estimatedPrice
    ? parseFloat(product.estimatedPrice) * quantity
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-14 sm:pb-0">
      <LandingNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <button onClick={() => router.push("/shop")} className="hover:text-orange-600 transition">
            {t("publicShop.navLabel")}
          </button>
          <span>/</span>
          {product.category && (
            <>
              <span className="text-slate-400">{product.category}</span>
              <span>/</span>
            </>
          )}
          <span className="text-slate-800 font-medium truncate max-w-[200px] sm:max-w-none">{product.name}</span>
        </nav>

        {/* Main content — 2 columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Left Column — Image Gallery */}
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden aspect-square flex items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-300">
                  <ShoppingBag className="w-16 h-16 text-slate-300" />
                  <span className="text-sm">{t("productDetail.noImage")}</span>
                </div>
              )}
            </div>
            {/* Thumbnail strip (single image repeated for visual effect) */}
            {product.imageUrl && (
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-16 h-16 rounded-lg border-2 overflow-hidden cursor-pointer transition ${
                      i === 0 ? "border-orange-500" : "border-slate-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={product.imageUrl!}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column — Product Details */}
          <div className="space-y-5">
            {/* Category badge */}
            {product.category && (
              <span className="inline-block text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                {product.category}
              </span>
            )}

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-red-600">
                {formatPrice(product.estimatedPrice)}
              </span>
            </div>

            {/* Variant Selectors — Dynamic by category */}
            {variants && variants.type !== "none" && (
              <>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    {variants.primaryLabel}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {variants.primaryOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSelectedPrimary(opt)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                          selectedPrimary === opt
                            ? "border-orange-500 bg-orange-50 text-orange-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    {variants.colorLabel}: <span className="font-normal text-slate-500">{variants.colorOptions[selectedColor]?.name}</span>
                  </label>
                  <div className="flex gap-3">
                    {variants.colorOptions.map((color, idx) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(idx)}
                        title={color.name}
                        className={`w-8 h-8 rounded-full border-2 transition ${
                          selectedColor === idx
                            ? "border-orange-500 ring-2 ring-orange-200"
                            : "border-slate-300 hover:border-slate-400"
                        }`}
                        style={{ backgroundColor: color.hex }}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Promotion box */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4">
              <h3 className="text-sm font-bold text-orange-700 mb-2">{t("productDetail.promoTitle")}</h3>
              <ul className="space-y-1.5 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">{"\u2714"}</span>
                  {t("productDetail.promo1")}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">{"\u2714"}</span>
                  {t("productDetail.promo2")}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">{"\u2714"}</span>
                  {t("productDetail.promo3")}
                </li>
              </ul>
            </div>

            {/* Quantity */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">{t("sales.quantity")}</label>
              <div className="flex items-center gap-2">
                <button
                  className="w-9 h-9 rounded-lg border border-slate-300 flex items-center justify-center text-lg font-bold text-slate-600 hover:bg-slate-50"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  {"\u2212"}
                </button>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center border border-slate-300 rounded-lg px-2 py-2 text-sm font-medium"
                />
                <button
                  className="w-9 h-9 rounded-lg border border-slate-300 flex items-center justify-center text-lg font-bold text-slate-600 hover:bg-slate-50"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Estimated total */}
            {estimatedTotal !== null && (
              <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm text-slate-600">{t("sales.estimatedTotal")}</span>
                <span className="text-xl font-bold text-orange-600">
                  {estimatedTotal.toLocaleString("vi-VN")} {"\u20AB"}
                </span>
              </div>
            )}

            {/* Customer note */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">{t("sales.customerNote")}</label>
              <textarea
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder={t("productDetail.notePlaceholder")}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm resize-none h-20 focus:border-orange-400 focus:ring-1 focus:ring-orange-200 outline-none transition"
              />
            </div>

            {/* Login hint */}
            {authStatus !== "authenticated" && (
              <p className="text-xs text-slate-400 text-center">{t("publicShop.loginHint")}</p>
            )}

            {/* MUA NGAY button */}
            <button
              onClick={handleBuy}
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-lg font-extrabold hover:from-orange-600 hover:to-red-600 active:scale-[0.99] disabled:opacity-50 transition shadow-lg shadow-orange-200"
            >
              {submitting ? t("common.loading") : t("sales.buyNow")}
            </button>
          </div>
        </div>

        {/* Bottom Section — Tabs */}
        <div className="mt-10">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab("features")}
              className={`px-6 py-3 text-sm font-semibold transition border-b-2 ${
                activeTab === "features"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t("productDetail.features")}
            </button>
            {variants?.type === "electronics" && (
              <button
                onClick={() => setActiveTab("specs")}
                className={`px-6 py-3 text-sm font-semibold transition border-b-2 ${
                  activeTab === "specs"
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {t("productDetail.specs")}
              </button>
            )}
          </div>

          <div className="bg-white rounded-b-2xl rounded-tr-2xl border border-t-0 border-slate-200 p-6 sm:p-8">
            {activeTab === "specs" && variants?.type === "electronics" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      [t("productDetail.specScreen"), '6.9" Super Retina XDR OLED'],
                      [t("productDetail.specChip"), "Apple A20 Pro"],
                      [t("productDetail.specRam"), "12 GB"],
                      [t("productDetail.specStorage"), selectedPrimary || "—"],
                      [t("productDetail.specCamera"), "48MP + 48MP + 12MP"],
                      [t("productDetail.specBattery"), "4685 mAh"],
                      [t("productDetail.specOS"), "iOS 20"],
                      [t("productDetail.specSim"), "eSIM / Nano SIM"],
                      [t("productDetail.specWeight"), "227 g"],
                    ].map(([label, value], idx) => (
                      <tr key={label} className={idx % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                        <td className="px-4 py-3 font-medium text-slate-700 w-1/3">{label}</td>
                        <td className="px-4 py-3 text-slate-600">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none text-slate-700">
                {product.description ? (
                  <div className="whitespace-pre-line">{product.description}</div>
                ) : (
                  <p className="text-slate-400 italic">{t("productDetail.noDescription")}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <LandingFooter />
      <LandingMobileBar />
    </div>
  );
}
