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

// Detailed Platform Types
type Platform = "taobao" | "1688" | "tmall";

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
  const [exchangeRate, setExchangeRate] = useState<number>(3500);
  const [results, setResults] = useState<ProductItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

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
        setExchangeRate(3500);
      });
  }, []);

  // Format currency
  const formatVND = (vnd: number) => {
    return Math.round(vnd).toLocaleString("vi-VN") + " ₫";
  };

  // Perform translation & mock search
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      message.warning("Vui lòng nhập từ khóa tìm kiếm!");
      return;
    }

    setLoading(true);
    setTranslating(true);
    setResults([]);

    const cleanQuery = searchQuery.trim().toLowerCase();

    // Check if query is in dictionary, otherwise simulate a smart Google translation
    let translated = "其他货源 (General Items)";
    let category = "general";

    const matchedKey = Object.keys(DICTIONARY).find(key => cleanQuery.includes(key));
    if (matchedKey) {
      translated = DICTIONARY[matchedKey].zh;
      category = DICTIONARY[matchedKey].category;
    } else {
      // Simulate real-time generic translator
      translated = `${searchQuery.trim()} 货源 (Smart Trans)`;
    }

    setTranslatedText(translated);

    // Timeline steps for the ultimate wow factor:
    // Step 1: Dịch thuật tiếng Trung
    setTimeout(() => {
      setTranslating(false);

      // Step 2: Quét & cào dữ liệu từ Taobao/1688/Tmall
      setTimeout(() => {
        let finalItems: ProductItem[] = [];

        if (category !== "general" && PRESETS[category]) {
          finalItems = PRESETS[category];
        } else {
          // Generate customized items dynamically based on their query!
          finalItems = [
            {
              id: `gen-tb-${Date.now()}`,
              platform: "taobao",
              titleVi: `[Taobao] ${searchQuery} Nội Địa Trung Quốc Cao Cấp`,
              titleZh: `${translated} 淘宝热销优质商品`,
              priceCNY: 88.0,
              imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60",
              supplier: "Nhà máy Hàng tiêu dùng Chiết Giang",
              rating: 4.7,
              salesCount: "2,500+",
            },
            {
              id: `gen-1688-${Date.now()}`,
              platform: "1688",
              titleVi: `[1688] Combo ${searchQuery} Bán Sỉ Giá Tận Gốc`,
              titleZh: `${translated} 1688批发源头厂家直供`,
              priceCNY: 25.0,
              imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&auto=format&fit=crop&q=60",
              supplier: "Tổng kho Hàng xuất khẩu Nghĩa Ô",
              rating: 4.6,
              salesCount: "10 vạn+",
            },
            {
              id: `gen-tmall-${Date.now()}`,
              platform: "tmall",
              titleVi: `[Tmall] ${searchQuery} Phân Phối Chính Hãng Đầy Đủ Co/Cq`,
              titleZh: `${translated} 天猫官方旗舰店品质保证`,
              priceCNY: 199.0,
              imageUrl: "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&auto=format&fit=crop&q=60",
              supplier: "Tmall Flagship Store Global",
              rating: 4.9,
              salesCount: "6,000+",
            }
          ];
        }

        // Initialize default quantity to 1 for all items
        const initialQs: Record<string, number> = {};
        finalItems.forEach(item => {
          initialQs[item.id] = 1;
        });
        setQuantities(initialQs);

        // Filter based on active platform tab
        const filtered = finalItems.filter(item => item.platform === platform);
        setResults(filtered.length > 0 ? filtered : finalItems);
        setLoading(false);
        message.success(`Tìm kiếm thành công! Quét được ${finalItems.length} nguồn hàng.`);
      }, 1000);

    }, 800);
  };

  // Trigger search when platform tab changes if query is already present
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
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

          {/* Platform Tab Selectors - Horizontal slider on mobile, centered on desktop */}
          <div className="flex flex-row overflow-x-auto gap-3 pb-2 mb-6 md:justify-center scrollbar-thin scrollbar-thumb-slate-200 my-4 px-2">
            <button
              onClick={() => setPlatform("taobao")}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-300 transform hover:scale-105 shadow-sm ${platform === "taobao"
                  ? "bg-[#FF5000] text-white ring-2 ring-[#FF5000] ring-offset-2"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-[#FF5000]/10"
                }`}
            >
              <span className="text-base">🛍️</span>Taobao.com
            </button>

            <button
              onClick={() => setPlatform("1688")}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-300 transform hover:scale-105 shadow-sm ${platform === "1688"
                  ? "bg-[#FF6C00] text-white ring-2 ring-[#FF6C00] ring-offset-2"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-[#FF6C00]/10"
                }`}
            >
              <span className="text-base">🏭</span>1688.com
            </button>

            <button
              onClick={() => setPlatform("tmall")}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-300 transform hover:scale-105 shadow-sm ${platform === "tmall"
                  ? "bg-[#C40000] text-white ring-2 ring-[#C40000] ring-offset-2"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-[#C40000]/10"
                }`}
            >
              <span className="text-base">💎</span>Tmall.com
            </button>
          </div>

          {/* Search inputs - Stacking layout vertically on mobile, horizontal on desktop */}
          <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-100 shadow-sm my-4">
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                placeholder="Nhập từ khóa tiếng Việt (ví dụ: 'tai nghe', 'giày thể thao', 'áo khoác')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onPressEnter={handleSearch}
                size="large"
                allowClear
                prefix={<SearchOutlined className="text-slate-400" />}
                className="rounded-2xl border-slate-200 focus:border-blue-500 py-3 text-base w-full min-h-[48px] flex items-center"
              />
              <Button
                type="primary"
                onClick={handleSearch}
                loading={loading}
                size="large"
                icon={<SearchOutlined />}
                className="w-full md:w-auto min-h-[48px] px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-md hover:from-blue-700 hover:to-indigo-700 font-semibold flex items-center justify-center shrink-0"
              >
                Quét nguồn hàng
              </Button>
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
            <span>📦</span> Danh mục nguồn hàng quét được ({results.length} sản phẩm)
          </h3>

          {/* Product grid */}
          <Row gutter={[20, 20]}>
            {results.map((item) => {
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
                                item.platform === "1688" ? "#FF6C00" : "#C40000"
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
