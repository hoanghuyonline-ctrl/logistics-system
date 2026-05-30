"use client";

import React, { useState, useEffect, Suspense } from "react";
import {
  Input,
  Button,
  Card,
  Row,
  Col,
  Badge,
  Spin,
  InputNumber,
  Space,
  Divider,
  Tag,
  message,
  notification
} from "antd";
import {
  SearchOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  TranslationOutlined
} from "@ant-design/icons";
import PageHeader from "@/components/ui/PageHeader";
import { useI18n } from "@/lib/i18n";

// Safe Google Sanitization filter to secure search query & results
export function sanitizeData(text: string): boolean {
  const forbiddenPatterns = [
    /cd\s+/i,
    /git\s+/i,
    /pm2/i,
    /xcopy/i,
    /rmdir/i,
    /npm\s+run/i,
    /node\s+/i,
    /npx\s+/i,
    /rm\s+-rf/i,
    /deploy/i,
    /powershell/i,
    /cmd/i,
    /bash/i,
    /sudo/i
  ];
  return !forbiddenPatterns.some(pattern => pattern.test(text));
}

// Detailed Platform Types
type Platform = "taobao" | "1688" | "tmall" | "other";

// Product Data Schema
interface ProductItem {
  id: string;
  platform: Platform;
  titleVi: string;
  titleZh: string;
  priceCNY: number;
  imageUrl: string;
  supplier: string;
  rating: number;
  salesCount: string;
  attributes?: Record<string, string>;
}

// Pre-defined high-quality search items representing realistic supplier outputs
const PRESETS: Record<string, ProductItem[]> = {
  headphone: [
    {
      id: "tb-head-01",
      platform: "taobao",
      titleVi: "Tai nghe Bluetooth Chụp Tai HIFI Chống Ồn Chủ Động ANC",
      titleZh: "ANC头戴式蓝牙耳机高音质主动降噪HIFI重低音",
      priceCNY: 158.0,
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
      supplier: "Cửa hàng Kỹ thuật Số Thâm Quyến",
      rating: 4.8,
      salesCount: "1.2 vạn+",
    },
    {
      id: "tb-head-02",
      platform: "1688",
      titleVi: "Tai Nghe Bluetooth TWS Thể Thao Không Dây Chống Nước IPX7",
      titleZh: "运动蓝牙耳机无线降噪真无线防水双耳入耳式TWS",
      priceCNY: 45.0,
      imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60",
      supplier: "Xưởng Linh kiện Điện tử Nghĩa Ô",
      rating: 4.6,
      salesCount: "5.5 vạn+",
    },
    {
      id: "tb-head-03",
      platform: "tmall",
      titleVi: "Tai Nghe Gaming Esport Không Dây Led RGB Âm Thanh Vòm 7.1",
      titleZh: "电竞游戏耳机头戴式7.1声道无线有线双模RGB发光",
      priceCNY: 299.0,
      imageUrl: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&auto=format&fit=crop&q=60",
      supplier: "Tmall Flagship Store Headset",
      rating: 4.9,
      salesCount: "8,000+",
    }
  ],
  shoes: [
    {
      id: "sh-shoes-01",
      platform: "taobao",
      titleVi: "Giày Thể Thao Nam Chạy Bộ Thoáng Khí Cao Cấp Phong Cách Hàn Quốc",
      titleZh: "男鞋夏季透气网鞋轻便跑步鞋男潮鞋防滑耐磨运动鞋",
      priceCNY: 128.0,
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60",
      supplier: "Hãng Giày Thời Trang Phúc Kiến",
      rating: 4.7,
      salesCount: "3.4 vạn+",
    },
    {
      id: "sh-shoes-02",
      platform: "1688",
      titleVi: "Giày Sneaker Unisex Cổ Thấp Da PU Cao Cấp Sỉ Tận Xưởng",
      titleZh: "厂家直销板鞋男低帮休闲小白鞋耐磨时尚运动鞋皮面",
      priceCNY: 38.0,
      imageUrl: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500&auto=format&fit=crop&q=60",
      supplier: "Tổng kho Giày dép Ôn Châu",
      rating: 4.5,
      salesCount: "12 vạn+",
    },
    {
      id: "sh-shoes-03",
      platform: "tmall",
      titleVi: "Giày Trượt Ván Thể Thao Cao Cấp Siêu Bền Chống Nước",
      titleZh: "官方正品专业滑板鞋男皮面防水透气防滑耐磨潮鞋",
      priceCNY: 245.0,
      imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&auto=format&fit=crop&q=60",
      supplier: "Tmall Flagship Store Sneaker Pro",
      rating: 4.9,
      salesCount: "1.5 vạn+",
    }
  ],
  clothes: [
    {
      id: "cl-cloth-01",
      platform: "taobao",
      titleVi: "Áo Thun Nam Cotton Cổ Tròn Dáng Rộng Unisex Cao Cấp",
      titleZh: "重磅纯棉短袖t恤男夏季潮牌宽松五分袖打底纯色体恤",
      priceCNY: 59.0,
      imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
      supplier: "Cửa hàng Thời trang Triều Châu",
      rating: 4.7,
      salesCount: "10 vạn+",
    },
    {
      id: "cl-cloth-02",
      platform: "1688",
      titleVi: "Quần Jeans Nam Dáng Suông Ống Rộng Phong Cách Vintage",
      titleZh: "男装直筒宽松牛仔裤长裤秋季国潮港风复古男士休闲裤",
      priceCNY: 42.0,
      imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&auto=format&fit=crop&q=60",
      supplier: "Xưởng May Mặc Quảng Châu",
      rating: 4.6,
      salesCount: "8 vạn+",
    },
    {
      id: "cl-cloth-03",
      platform: "tmall",
      titleVi: "Váy Nữ Dáng Dài Trễ Vai Sang Trọng Dự Tiệc Cao Cấp",
      titleZh: "法式复古一字肩连衣裙女夏高级感气质赫本风长裙",
      priceCNY: 189.0,
      imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=60",
      supplier: "Tmall Lady Elegant Fashion",
      rating: 4.9,
      salesCount: "5,000+",
    }
  ]
};

// Chinese keyword mapping for realistic translation demonstration
const DICTIONARY: Record<string, { zh: string, category: string }> = {
  "tai nghe": { zh: "蓝牙耳机 (Headphones)", category: "headphone" },
  "headphone": { zh: "耳机 (Headset)", category: "headphone" },
  "bluetooth": { zh: "无线耳机 (Wireless Buds)", category: "headphone" },
  "giay": { zh: "运动鞋 (Sneakers)", category: "shoes" },
  "giày": { zh: "时尚板鞋 (Fashion Shoes)", category: "shoes" },
  "shoes": { zh: "男鞋女鞋 (Footwear)", category: "shoes" },
  "ao": { zh: "夏季衣服 (T-Shirt)", category: "clothes" },
  "áo": { zh: "潮流短袖 (Short Sleeve)", category: "clothes" },
  "quan": { zh: "牛仔裤 (Jeans)", category: "clothes" },
  "quần": { zh: "长裤子 (Pants)", category: "clothes" },
  "váy": { zh: "连衣裙 (Dress)", category: "clothes" },
  "clothes": { zh: "精品服装 (Apparel)", category: "clothes" }
};

function SearchDashboard() {
  const { t } = useI18n();

  // States
  const [platform, setPlatform] = useState<Platform>("taobao");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [exchangeRate, setExchangeRate] = useState<number>(3980);
  const [results, setResults] = useState<ProductItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Dynamic Google-system semantic filters states
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [availableFilters, setAvailableFilters] = useState<Array<{ key: string; label: string; options: string[] }>>([]);

  // State to hold active filtered results dynamically synchronized with filters and scroll append logic
  const [filteredResults, setFilteredResults] = useState<ProductItem[]>([]);

  // Synchronize filtered results whenever primary results or active filters update
  useEffect(() => {
    const filtered = results.filter((item) => {
      if (!sanitizeData(item.titleVi) || !sanitizeData(item.titleZh) || !sanitizeData(item.supplier)) return false;
      if (minPrice !== null && item.priceCNY < minPrice) return false;
      if (maxPrice !== null && item.priceCNY > maxPrice) return false;
      if (selectedSize && item.attributes?.size !== selectedSize) return false;
      if (selectedColor && item.attributes?.color !== selectedColor) return false;
      return true;
    });
    setFilteredResults(filtered);
  }, [results, minPrice, maxPrice, selectedSize, selectedColor]);

  // Fetch exchange rate on mount
  useEffect(() => {
    fetch("/api/settings/exchange-rate")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.exchange_rate) {
          setExchangeRate(parseFloat(data.exchange_rate));
        }
      })
      .catch(() => {
        // Fallback to default
        setExchangeRate(3980);
      });
  }, []);

  // Format currency
  const formatVND = (vnd: number) => {
    return Math.round(vnd).toLocaleString("vi-VN") + " ₫";
  };

  // Handle Instant Camera Capture & Scan with auto-submit
  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setTranslating(true);
    setSearchQuery("Tìm kiếm bằng hình ảnh (Chụp trực tiếp)");
    setPage(1);
    setHasMore(true);

    // Reset filters
    setMinPrice(null);
    setMaxPrice(null);
    setSelectedSize(null);
    setSelectedColor(null);
    setAvailableFilters([]);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/source-search/image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Lỗi máy chủ quét hình ảnh");
      }

      const data = await res.json();
      setTranslatedText(data.translated || "以图搜图 (Image Sourcing)");
      
      // Filter out sanitizeData compliant and active items
      const apiNewData = data.items.filter((item: ProductItem) => {
        if (!sanitizeData(item.titleVi) || !sanitizeData(item.titleZh) || !sanitizeData(item.supplier)) return false;
        return true;
      });

      setFilteredResults(apiNewData);
      setResults(data.items);
      setTotal(data.total);
      setAvailableFilters(data.filters || []);

      const maxPages = Math.ceil(data.total / limit);
      if (data.items.length === 0 || 1 >= maxPages) {
        setHasMore(false);
      }

      // Initialize default quantity to 1 for all items
      setQuantities((prev) => {
        const updated = { ...prev };
        data.items.forEach((item: ProductItem) => {
          if (!(item.id in updated)) {
            updated[item.id] = 1;
          }
        });
        return updated;
      });

      message.success(`Quét ảnh thành công! Đã tìm thấy ${data.items.length} nguồn hàng tương đồng.`);
    } catch (err: any) {
      console.error("[image-capture-scan] Error:", err);
      message.error(err.message || "Không thể quét ảnh lúc này. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setTranslating(false);
    }
  };

  // Perform translation & mock search via API route
  const handleSearch = (targetPage = 1, append = false) => {
    if (!searchQuery.trim()) {
      message.warning("Vui lòng nhập từ khóa tìm kiếm!");
      return;
    }

    if (!sanitizeData(searchQuery)) {
      message.error("Từ khóa tìm kiếm không hợp lệ hoặc chứa các mã lệnh không được phép!");
      return;
    }

    setLoading(true);
    if (!append) {
      setTranslating(true);
      setHasMore(true);
    }
    
    // Capping page to avoid displaying page numbers exceeding totalPages
    const currentTotalPages = total > 0 ? Math.ceil(total / limit) : 1;
    const cappedPage = targetPage > currentTotalPages && total > 0 ? currentTotalPages : targetPage;
    setPage(cappedPage);

    // Reset user active filters on fresh query search (page 1)
    if (targetPage === 1 && !append) {
      setMinPrice(null);
      setMaxPrice(null);
      setSelectedSize(null);
      setSelectedColor(null);
      setAvailableFilters([]);
    }

    let url = `/api/source-search?q=${encodeURIComponent(searchQuery)}&platform=${platform}&limit=${limit}&page=${cappedPage}`;
    if (minPrice !== null) url += `&min_price=${minPrice}`;
    if (maxPrice !== null) url += `&max_price=${maxPrice}`;
    if (selectedSize) url += `&size=${selectedSize}`;
    if (selectedColor) url += `&color=${selectedColor}`;
    
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Search API call failed");
        return res.json();
      })
      .then((data) => {
        setTranslatedText(data.translated);
        
        // Filter new incoming data with sanitizeData and existing active filter options
        const apiNewData = data.items.filter((item: ProductItem) => {
          if (!sanitizeData(item.titleVi) || !sanitizeData(item.titleZh) || !sanitizeData(item.supplier)) return false;
          if (minPrice !== null && item.priceCNY < minPrice) return false;
          if (maxPrice !== null && item.priceCNY > maxPrice) return false;
          if (selectedSize && item.attributes?.size !== selectedSize) return false;
          if (selectedColor && item.attributes?.color !== selectedColor) return false;
          return true;
        });

        // Strict pagination guard checking
        const currentTotal = data.total || 0;
        const maxPages = Math.ceil(currentTotal / limit);
        if (data.items.length === 0 || cappedPage >= maxPages) {
          setHasMore(false);
        }

        if (append) {
          // Append data using dynamic array spread syntax as requested by Ban quan tri
          setFilteredResults((prev) => [...prev, ...apiNewData]);
          setResults((prev) => {
            const merged = [...prev];
            data.items.forEach((item: ProductItem) => {
              if (!merged.some((m) => m.id === item.id)) {
                merged.push(item);
              }
            });
            return merged;
          });
        } else {
          setFilteredResults(apiNewData);
          setResults(data.items);
        }
        setTotal(currentTotal);
        setAvailableFilters(data.filters || []);

        // Initialize default quantity to 1 for all items
        setQuantities((prev) => {
          const updated = { ...prev };
          data.items.forEach((item: ProductItem) => {
            if (!(item.id in updated)) {
              updated[item.id] = 1;
            }
          });
          return updated;
        });

        if (append) {
          if (data.items.length > 0) {
            message.success(`Đã tải thêm ${data.items.length} nguồn hàng (Trang ${cappedPage}).`);
          }
        } else {
          if (data.items.length > 0) {
            message.success(`Tìm kiếm thành công! Quét được ${data.items.length} nguồn hàng.`);
          }
        }
      })
      .catch((e) => {
        console.error(e);
        message.error("Lỗi kết nối khi quét nguồn hàng.");
      })
      .finally(() => {
        setLoading(false);
        setTranslating(false);
      });
  };

  // Infinite scroll listener to auto load subsequent pages on mobile & desktop
  useEffect(() => {
    const handleScroll = () => {
      const totalPages = Math.ceil(total / limit);
      if (loading || results.length === 0 || page >= totalPages || !hasMore) return;
      
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;
      
      // If near the bottom within 150px
      if (scrollHeight - scrollTop - clientHeight < 150) {
        const nextPage = page + 1;
        handleSearch(nextPage, true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, results, page, total, searchQuery, platform, minPrice, maxPrice, selectedSize, selectedColor, hasMore]);

  // Trigger search when platform tab changes if query is already present
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(1);
    }
  }, [platform]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Order Creation Flow
  const createOrder = async (item: ProductItem, type: "ECOMMERCE" | "CONSIGNMENT") => {
    const qty = quantities[item.id] || 1;
    setSubmittingId(`${item.id}-${type}`);

    try {
      let payload: Record<string, unknown> = {};

      if (type === "ECOMMERCE") {
        payload = {
          orderType: "ECOMMERCE",
          productName: item.titleVi,
          productLink: `https://item.${item.platform}.com/item.htm?id=${item.id}`,
          productImage: item.imageUrl,
          productSpecs: `Platform: ${item.platform.toUpperCase()} | Supplier: ${item.supplier}`,
          quantity: qty,
          unitPriceCNY: item.priceCNY,
          notes: `Đặt mua tự động từ Tìm kiếm nguồn hàng đa phương thức. Nhà cung cấp: ${item.supplier}.`
        };
      } else {
        // CONSIGNMENT requires consignmentTrackingNumber
        payload = {
          orderType: "CONSIGNMENT",
          productName: item.titleVi,
          productLink: `https://item.${item.platform}.com/item.htm?id=${item.id}`,
          productImage: item.imageUrl,
          consignmentTrackingNumber: `KGBTH-${item.platform.toUpperCase()}-${Date.now().toString().slice(-6)}`,
          consignmentItems: [
            {
              productName: item.titleVi,
              quantity: String(qty),
              unitPriceCNY: String(item.priceCNY),
              specs: `Platform: ${item.platform.toUpperCase()} | Nhà cung cấp: ${item.supplier}`
            }
          ],
          notes: `Lệnh ký gửi tự động từ nguồn hàng ${item.platform.toUpperCase()}. Chờ cập nhật mã vận đơn thực tế.`
        };
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdOrder = await res.json();

        notification.success({
          message: type === "ECOMMERCE" ? "🎉 Đặt hàng trực tiếp thành công!" : "📦 Đăng ký Ký gửi thành công!",
          description: (
            <div className="space-y-1 mt-1">
              <p>Mã đơn hàng: <Tag color="blue" className="font-mono">{createdOrder.orderCode}</Tag></p>
              <p>Sản phẩm: <strong>{item.titleVi}</strong></p>
              <p>Số lượng: <strong>{qty}</strong></p>
              <Divider className="my-1.5" />
              <Button
                type="primary"
                size="small"
                href={`/orders/${createdOrder.id}`}
                className="bg-blue-600 border-none shadow-sm hover:bg-blue-700 mt-1"
              >
                Xem chi tiết đơn hàng
              </Button>
            </div>
          ),
          duration: 10,
          placement: "topRight"
        });
      } else {
        const err = await res.json();
        message.error(err.error || "Gặp sự cố khi tạo đơn hàng. Vui lòng thử lại!");
      }
    } catch (e) {
      console.error(e);
      message.error("Lỗi kết nối máy chủ khi đặt hàng.");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <PageHeader
        title="Tìm kiếm nguồn hàng đa phương thức"
        subtitle="Quét nguồn hàng trực tiếp từ Taobao, 1688, Tmall bằng tiếng Việt - Đặt mua hộ hoặc Ký gửi về Việt Nam tức thì"
      />

      {/* Main Sourcing Hub */}
      <Card
        bordered={false}
        className="mb-8 shadow-md rounded-2xl bg-white border border-slate-100 overflow-hidden relative"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)"
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full filter blur-3xl opacity-40 -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-100 rounded-full filter blur-3xl opacity-40 -ml-10 -mb-10"></div>

        <div className="max-w-4xl mx-auto py-4 relative z-10">

          {/* Platform Tab Selectors - Fixed 2x2 Grid on Mobile, 4 columns on Desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 my-4 px-2">
            <button
              onClick={() => setPlatform("taobao")}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-sm ${platform === "taobao"
                  ? "bg-[#FF5000] text-white ring-2 ring-[#FF5000] ring-offset-2"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-[#FF5000]/10"
                }`}
            >
              <span className="text-base">🛍️</span>Taobao.com
            </button>

            <button
              onClick={() => setPlatform("1688")}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-sm ${platform === "1688"
                  ? "bg-[#FF6C00] text-white ring-2 ring-[#FF6C00] ring-offset-2"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-[#FF6C00]/10"
                }`}
            >
              <span className="text-base">🏭</span>1688.com
            </button>

            <button
              onClick={() => setPlatform("tmall")}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-sm ${platform === "tmall"
                  ? "bg-[#C40000] text-white ring-2 ring-[#C40000] ring-offset-2"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-[#C40000]/10"
                }`}
            >
              <span className="text-base">💎</span>Tmall.com
            </button>

            <button
              onClick={() => setPlatform("other")}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-sm ${platform === "other"
                  ? "bg-[#2563EB] text-white ring-2 ring-[#2563EB] ring-offset-2"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-[#2563EB]/10"
                }`}
            >
              <span className="text-base">🌐</span>Website Khác
            </button>
          </div>

          {/* Search inputs - Stacking layout vertically on mobile, horizontal on desktop */}
          <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-100 shadow-sm my-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 flex gap-2 items-center">
                <Input
                  placeholder="Dễ tìm nguồn (Tiếng Việc)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onPressEnter={() => handleSearch(1)}
                  size="large"
                  allowClear
                  prefix={<SearchOutlined className="text-slate-400" />}
                  suffix={
                    searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors duration-200 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        Dọn
                      </button>
                    )
                  }
                  className="rounded-2xl border-slate-200 focus:border-blue-500 py-3 text-base w-full min-h-[48px] flex items-center"
                />

                {/* Instant Capture & Scan Camera Button */}
                <label className="flex items-center justify-center w-12 h-12 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 text-slate-500 cursor-pointer transition-all duration-200 shrink-0 shadow-sm" title="Chụp ảnh tìm nguồn ngay">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2.25"
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                    />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleImageCapture}
                  />
                </label>
              </div>
              <Button
                type="primary"
                onClick={() => handleSearch(1)}
                loading={loading}
                size="large"
                icon={<SearchOutlined />}
                className="w-full md:w-auto min-h-[48px] px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-md hover:from-blue-700 hover:to-indigo-700 font-semibold flex items-center justify-center shrink-0"
              >
                Quét nguồn hàng
              </Button>
            </div>

            {/* Real-time Google Sourcing Filters Block */}
            <div className="mt-4 pt-4 border-t border-slate-100 px-1 animate-fadeIn">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3 uppercase tracking-wider font-bold">
                <span>⚡</span>
                <span>Bộ lọc thực chiến nâng cao:</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Price range */}
                <div className="space-y-1.5">
                  <span className="text-xs text-slate-500 font-semibold block">Khoảng giá (¥ CNY):</span>
                  <div className="flex items-center gap-2">
                    <InputNumber
                      placeholder="Tối thiểu (¥)"
                      value={minPrice ?? undefined}
                      onChange={(val) => setMinPrice(val)}
                      className="w-full rounded-xl border-slate-200 text-xs font-semibold h-9 flex items-center"
                      min={0}
                    />
                    <span className="text-slate-400">-</span>
                    <InputNumber
                      placeholder="Tối đa (¥)"
                      value={maxPrice ?? undefined}
                      onChange={(val) => setMaxPrice(val)}
                      className="w-full rounded-xl border-slate-200 text-xs font-semibold h-9 flex items-center"
                      min={0}
                    />
                  </div>
                </div>

                {/* 2. Sizes */}
                {availableFilters.some(f => f.key === "size") && (
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-500 font-semibold block">Kích cỡ (Size):</span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {["S", "M", "L", "XL", "XXL"].map((sz) => {
                        const isSelected = selectedSize === sz;
                        return (
                          <button
                            key={sz}
                            onClick={() => setSelectedSize(selectedSize === sz ? null : sz)}
                            className={`py-1.5 text-xs font-semibold rounded-xl transition-all duration-300 transform active:scale-95 shadow-sm border ${
                              isSelected
                                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                                : "bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100"
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Colors */}
                {availableFilters.some(f => f.key === "color") && (
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-500 font-semibold block">Màu sắc:</span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {["Đen", "Trắng", "Đỏ", "Xanh", "Xám"].map((col) => {
                        const isSelected = selectedColor === col;
                        return (
                          <button
                            key={col}
                            onClick={() => setSelectedColor(selectedColor === col ? null : col)}
                            className={`py-1.5 text-xs font-semibold rounded-xl transition-all duration-300 transform active:scale-95 shadow-sm border truncate px-1 ${
                              isSelected
                                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                                : "bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100"
                            }`}
                            title={col}
                          >
                            {col}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Voltage & Type for Electronics */}
                {availableFilters.some(f => f.key === "voltage" || f.key === "type") && (
                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <span className="text-xs text-slate-500 font-semibold block">Thông số thiết bị điện:</span>
                    <div className="flex flex-wrap gap-2">
                      {availableFilters.map((f) => (
                        <div key={f.key} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-1 text-xs">
                          <span className="text-slate-500 font-medium">{f.label}:</span>
                          <div className="flex gap-1">
                            {f.options.map((opt) => {
                              const isSelected = selectedSize === opt || selectedColor === opt;
                              return (
                                <button
                                  key={opt}
                                  onClick={() => {
                                    if (f.key === "voltage") {
                                      setSelectedSize(selectedSize === opt ? null : opt);
                                    } else {
                                      setSelectedColor(selectedColor === opt ? null : opt);
                                    }
                                  }}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all duration-200 ${
                                    isSelected
                                      ? "bg-blue-600 border-blue-600 text-white"
                                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reset Filters trigger */}
              {(minPrice !== null || maxPrice !== null || selectedSize !== null || selectedColor !== null) && (
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => {
                      setMinPrice(null);
                      setMaxPrice(null);
                      setSelectedSize(null);
                      setSelectedColor(null);
                    }}
                    className="text-[11px] font-bold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors duration-200"
                  >
                    ❌ Xóa nhanh tất cả bộ lọc
                  </button>
                </div>
              )}
            </div>

            {/* Translation & Exchange status banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 px-2 text-xs text-slate-500 gap-2 my-2">
              <div className="flex items-center gap-1">
                <TranslationOutlined className="text-blue-500" />
                <span>Tự động dịch thuật và tối ưu từ khóa thông minh sang tiếng Trung</span>
              </div>
              <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium self-start sm:self-auto">
                <DollarOutlined />
                <span>Tỷ giá mua hộ hiện tại: <strong>1 CNY = {exchangeRate.toLocaleString("vi-VN")} đ</strong></span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Loading States */}
      {loading && searchQuery.includes("hình ảnh") ? (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <style>{`
            @keyframes scan-line-anim {
              0% { top: 0%; }
              50% { top: 100%; }
              100% { top: 0%; }
            }
            .animate-scan-line {
              position: absolute;
              animation: scan-line-anim 2.5s infinite linear;
            }
          `}</style>
          
          {/* Scanning frame container */}
          <div className="relative w-72 h-72 border-4 border-dashed border-blue-500 rounded-3xl overflow-hidden bg-slate-900 shadow-2xl flex items-center justify-center">
            {/* Laser scanning bar */}
            <div className="absolute left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-400 shadow-lg shadow-blue-500/80 animate-scan-line z-20"></div>
            
            {/* Image Placeholder representing the raw photo */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] z-0"></div>

            {/* Bounding box marker */}
            <div className="absolute w-48 h-48 border-2 border-emerald-400 rounded-2xl z-10 flex flex-col justify-between p-2 shadow-inner shadow-emerald-500/20">
              <span className="text-[10px] text-emerald-400 font-mono bg-slate-900/90 px-1 py-0.5 rounded self-start">Object Target: 94.7%</span>
              <span className="text-[9px] text-slate-300 font-mono bg-slate-900/90 px-1 py-0.5 rounded self-end">x:144 y:240 w:912 h:1120</span>
            </div>
            
            <span className="text-4xl z-10 animate-pulse">📸</span>
          </div>

          <div className="text-center space-y-2 mt-6 max-w-md">
            <h3 className="font-extrabold text-slate-800 text-lg flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
              AI Auto-Crop & Object Localization...
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Thuật toán Google đang tự động bóc tách sản phẩm, tính toán Bounding Box tọa độ để cắt bỏ nilon bao bì và rác nền xung quanh trước khi truy vấn API Trung Quốc.
            </p>
          </div>
        </div>
      ) : (
        <>
          {translating && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Spin indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />} />
              <div className="text-center space-y-1">
                <h3 className="font-semibold text-slate-800 text-lg">Đang dịch thuật ngầm từ khóa...</h3>
                <p className="text-slate-400 text-sm italic">Quá trình tối ưu hóa ngôn ngữ thương mại điện tử Trung Quốc</p>
              </div>
            </div>
          )}

          {loading && !translating && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Spin indicator={<LoadingOutlined style={{ fontSize: 40 }} className="text-orange-500" spin />} />
              <div className="text-center space-y-1">
                <h3 className="font-semibold text-slate-800 text-lg">Đang kết nối API quét nguồn hàng...</h3>
                <p className="text-slate-400 text-sm">Đang trích xuất dữ liệu từ các nhà máy & cửa hàng nội địa Trung Quốc</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* No Search results empty state */}
      {!loading && results.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center max-w-xl mx-auto my-8">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="font-bold text-slate-800 text-lg mb-1">Khởi tạo quy trình tìm hàng</h3>
          <p className="text-slate-500 text-sm mb-4 leading-relaxed">
            Nhập tên mặt hàng bạn mong muốn bằng tiếng Việt. Hệ thống AI của chúng tôi sẽ dịch sang thuật ngữ chuyên ngành Trung Quốc, sau đó quét các xưởng lớn tại Taobao, 1688, Tmall để đưa về báo giá tốt nhất.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Tag color="orange" className="cursor-pointer py-1 px-3 rounded-full text-xs font-semibold hover:opacity-80" onClick={() => { setSearchQuery("tai nghe bluetooth"); }}>🔍 Tai nghe Bluetooth</Tag>
            <Tag color="cyan" className="cursor-pointer py-1 px-3 rounded-full text-xs font-semibold hover:opacity-80" onClick={() => { setSearchQuery("giày sneaker"); }}>🔍 Giày Sneaker</Tag>
            <Tag color="magenta" className="cursor-pointer py-1 px-3 rounded-full text-xs font-semibold hover:opacity-80" onClick={() => { setSearchQuery("áo sơ mi"); }}>🔍 Áo sơ mi nam/nữ</Tag>
          </div>
        </div>
      )}

      {/* Search results displays */}
      {!loading && results.length > 0 && (
        <div className="max-w-6xl mx-auto px-4">

          {/* Active search translation banner */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Dịch thuật thông minh sang tiếng Trung: <strong className="text-emerald-700 font-mono bg-emerald-100/80 px-2 py-0.5 rounded">{translatedText}</strong>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Dữ liệu nguồn hàng được hiển thị dưới dạng giá bán lẻ/bán sỉ đã tối ưu.</p>
              </div>
            </div>
            <Tag color="emerald" className="font-semibold text-xs py-0.5 px-2.5 rounded-full">Đã tối ưu dịch thuật</Tag>
          </div>

          <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
            <span>📦</span> {filteredResults.length} sản phẩm quét được
          </h3>

          {/* Product grid with fallback */}
          {filteredResults.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl shadow-sm my-6">
              <span className="text-4xl">🔍</span>
              <h4 className="font-bold text-slate-700 mt-3">Không tìm thấy sản phẩm nào khớp bộ lọc</h4>
              <p className="text-slate-400 text-xs mt-1">Vui lòng bấm bỏ chọn các bộ lọc Semantic để hiển thị đầy đủ hàng hóa.</p>
              <Button 
                onClick={() => {
                  setMinPrice(null);
                  setMaxPrice(null);
                  setSelectedSize(null);
                  setSelectedColor(null);
                }}
                className="mt-4 rounded-xl font-semibold text-xs border-blue-500 text-blue-600 h-9"
              >
                Xóa tất cả bộ lọc
              </Button>
            </div>
          ) : (
            <Row gutter={[20, 20]}>
              {filteredResults.map((item) => {
              const qty = quantities[item.id] || 1;
              const productCostCNY = item.priceCNY * qty;
              const productCostVND = productCostCNY * exchangeRate;

              // Calculate default ecommerce breakdown for visual transparency
              const serviceFeeVND = productCostVND * 0.05;
              const chinaShippingVND = 50000;
              const vnDeliveryVND = 30000;
              const totalCostVND = productCostVND + serviceFeeVND + chinaShippingVND + vnDeliveryVND;

              return (
                <Col xs={24} sm={12} lg={8} key={item.id}>
                  <Card
                    hoverable
                    className="h-full rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    cover={
                      <div className="relative h-56 bg-slate-50 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.titleVi}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        />
                        {/* Platform badge */}
                        <div className="absolute top-3 left-3">
                          <Tag
                            color={
                              item.platform === "taobao" ? "#FF5000" :
                                item.platform === "1688" ? "#FF6C00" :
                                  item.platform === "tmall" ? "#C40000" : "#2563EB"
                            }
                            className="font-bold text-[11px] uppercase tracking-wide border-none px-2.5 py-0.5 text-white shadow-sm rounded-full"
                          >
                            {item.platform.toUpperCase()}
                          </Tag>
                        </div>
                      </div>
                    }
                  >
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        {/* Product Title */}
                        <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 mb-1" title={item.titleVi}>
                          {item.titleVi}
                        </h4>

                        {/* Chinese Original */}
                        <p className="text-slate-400 text-xs truncate mb-3" title={item.titleZh}>
                          🇨🇳 {item.titleZh}
                        </p>

                        <div className="flex items-center justify-between text-xs text-slate-500 mb-3 bg-slate-50 px-2.5 py-1.5 rounded-xl">
                          <span>⭐ {item.rating}</span>
                          <span>Đã bán: <strong className="text-slate-700">{item.salesCount}</strong></span>
                        </div>

                        {/* Pricing displays */}
                        <div className="mb-4">
                          <div className="flex items-baseline justify-between">
                            <span className="text-slate-400 text-xs">Giá gốc tệ:</span>
                            <span className="text-slate-800 font-semibold font-mono text-sm">¥ {item.priceCNY.toFixed(2)}</span>
                          </div>

                          <div className="flex items-baseline justify-between mt-1">
                            <span className="text-slate-400 text-xs">Giá VND (tỷ giá {exchangeRate}):</span>
                            <strong className="text-orange-600 font-bold font-mono text-base">{formatVND(item.priceCNY * exchangeRate)}</strong>
                          </div>
                        </div>

                        <Divider className="my-3" />

                        {/* Quantity selection & calculation info */}
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-slate-700 text-xs font-semibold">Chọn số lượng:</span>
                          <InputNumber
                            min={1}
                            max={100}
                            value={qty}
                            onChange={(val) => {
                              if (val) {
                                setQuantities(prev => ({ ...prev, [item.id]: val }));
                              }
                            }}
                            className="rounded-lg border-slate-200"
                            size="small"
                          />
                        </div>

                        {/* Cost breakdown for full transparency */}
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-slate-500 space-y-1 mb-4">
                          <div className="flex justify-between">
                            <span>Tiền hàng ({qty} chiếc):</span>
                            <span className="font-semibold text-slate-700">{formatVND(productCostVND)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Phí dịch vụ mua hộ (5%):</span>
                            <span className="text-slate-700">{formatVND(serviceFeeVND)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Ship nội địa TQ (mặc định):</span>
                            <span className="text-slate-700">{formatVND(chinaShippingVND)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Giao hàng nội địa VN (mặc định):</span>
                            <span className="text-slate-700">{formatVND(vnDeliveryVND)}</span>
                          </div>
                          <Divider className="my-1" />
                          <div className="flex justify-between font-bold text-slate-800 text-xs">
                            <span>TỔNG DỰ TOÁN:</span>
                            <span className="text-orange-600 font-mono">{formatVND(totalCostVND)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Dual Action Buttons */}
                      <div className="space-y-2 pt-2">
                        <Button
                          type="primary"
                          icon={<ShoppingCartOutlined />}
                          onClick={() => createOrder(item, "ECOMMERCE")}
                          loading={submittingId === `${item.id}-ECOMMERCE`}
                          className="w-full bg-[#FF5000] border-none text-white hover:bg-[#e04600] font-semibold rounded-xl py-2 h-auto flex items-center justify-center gap-1 shadow-sm"
                        >
                          Mua Trực Tiếp (Order)
                        </Button>

                        <Button
                          type="default"
                          icon={<FileTextOutlined />}
                          onClick={() => createOrder(item, "CONSIGNMENT")}
                          loading={submittingId === `${item.id}-CONSIGNMENT`}
                          className="w-full border-blue-500 text-blue-600 hover:text-blue-700 hover:border-blue-700 font-semibold rounded-xl py-2 h-auto flex items-center justify-center gap-1"
                        >
                          Ký Gửi / Ủy Thác (Bến bãi)
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
          )}

          {/* Pagination Controls */}
          {total > limit && (
            <div className="flex justify-center items-center gap-4 mt-8 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm max-w-md mx-auto">
              <Button
                disabled={page <= 1}
                onClick={() => handleSearch(page - 1)}
                className="rounded-xl border-slate-200 font-semibold text-xs h-9 flex items-center justify-center"
              >
                ◀ Trang trước
              </Button>
              <span className="text-slate-600 text-xs font-semibold whitespace-nowrap">
                Trang {Math.min(page, Math.ceil(total / limit) || 1)} / {Math.ceil(total / limit) || 1}
              </span>
              <Button
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => handleSearch(page + 1)}
                className="rounded-xl border-slate-200 font-semibold text-xs h-9 flex items-center justify-center"
              >
                Trang tiếp theo ▶
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Info Guidelines for the users */}
      <div className="max-w-4xl mx-auto mt-12 bg-blue-50/50 border border-blue-100 rounded-3xl p-6">
        <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
          <InfoCircleOutlined className="text-blue-500" /> Hướng dẫn đặt hàng qua Sourcing Platform
        </h4>
        <ul className="text-slate-600 text-xs space-y-2 list-disc list-inside">
          <li><strong>Mua Trực Tiếp:</strong> Đơn hàng sẽ được tạo dưới dạng đơn <strong>ECOMMERCE</strong>. Bắc Trung Hải sẽ thu mua trực tiếp theo báo giá dự kiến trên và giao về địa chỉ của bạn.</li>
          <li><strong>Ký Gửi / Ủy Thác:</strong> Đơn hàng được tạo dưới dạng đơn <strong>CONSIGNMENT</strong>. Hệ thống tự động thiết lập một mã vận đơn tạm thời. Bạn chỉ cần gửi hàng đến địa chỉ kho Trung Quốc của chúng tôi để được vận chuyển.</li>
          <li><strong>Tỷ giá và Chi phí:</strong> Tỷ giá mua hộ được liên kết tự động và đồng bộ với hệ thống cấu hình tài chính của Bắc Trung Hải Logistics.</li>
        </ul>
      </div>
    </div>
  );
}

export default function SourceSearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    }>
      <SearchDashboard />
    </Suspense>
  );
}
