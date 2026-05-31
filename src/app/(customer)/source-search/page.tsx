"use client";

import React, { useState, useEffect, Suspense } from "react";
import {
  Input,
  Button,
  Card,
  Row,
  Col,
  Tag,
  Spin,
  message,
  notification
} from "antd";
import {
  SearchOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  TranslationOutlined,
  CameraOutlined
} from "@ant-design/icons";
import PageHeader from "@/components/ui/PageHeader";
import { useI18n } from "@/lib/i18n";

// Detailed Platform Types
type Platform = "taobao" | "1688" | "tmall";

// Chinese keyword mapping for translation
const DICTIONARY: Record<string, { zh: string; category: string }> = {
  "tai nghe": { zh: "蓝牙耳机", category: "headphone" },
  "headphone": { zh: "耳机", category: "headphone" },
  "bluetooth": { zh: "无线耳机", category: "headphone" },
  "giay": { zh: "运动鞋", category: "shoes" },
  "giày": { zh: "时尚板鞋", category: "shoes" },
  "shoes": { zh: "男鞋女鞋", category: "shoes" },
  "ao": { zh: "夏季衣服", category: "clothes" },
  "áo": { zh: "潮流短袖", category: "clothes" },
  "quan": { zh: "牛仔裤", category: "clothes" },
  "quần": { zh: "长裤子", category: "clothes" },
  "váy": { zh: "连衣裙", category: "clothes" },
  "clothes": { zh: "精品服装", category: "clothes" }
};

// Robust translate helper
function translateKeyword(query: string): string {
  const q = query.toLowerCase().trim();
  if (!q) return "";
  
  if (DICTIONARY[q]) return DICTIONARY[q].zh;
  
  for (const [key, val] of Object.entries(DICTIONARY)) {
    if (q.includes(key)) return val.zh;
  }
  
  return q; 
}

function SearchDashboard() {
  const { t } = useI18n();

  // States
  const [platform, setPlatform] = useState<Platform>("taobao");
  const [searchQuery, setSearchQuery] = useState("");
  const [exchangeRate, setExchangeRate] = useState<number>(3980);
  const [translatedText, setTranslatedText] = useState("");

  // Update dynamic translation preview
  useEffect(() => {
    setTranslatedText(translateKeyword(searchQuery));
  }, [searchQuery]);

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
        setExchangeRate(3980);
      });
  }, []);

  // Handle direct forward redirect link
  const handleRedirectSearch = () => {
    if (!searchQuery.trim()) {
      message.warning("Vui lòng nhập từ khóa tìm kiếm!");
      return;
    }

    const keywordZh = translatedText || searchQuery.trim();
    let url = "";

    if (platform === "taobao") {
      url = `https://s.taobao.com/search?q=${encodeURIComponent(keywordZh)}`;
    } else if (platform === "1688") {
      url = `https://s.1688.com/youyuan/index.htm?keywords=${encodeURIComponent(keywordZh)}`;
    } else {
      url = `https://list.tmall.com/search_product.htm?q=${encodeURIComponent(keywordZh)}`;
    }

    // Open target page directly
    window.open(url, "_blank");

    notification.success({
      message: "🚀 Chuyển hướng liên kết thành công!",
      description: `Đã mở trang tìm kiếm gốc của ${platform.toUpperCase()} với từ khóa dịch: "${keywordZh}". Trình duyệt đang sử dụng địa chỉ mạng IP sạch của bạn để tránh bị chặn hệ thống.`,
      duration: 6
    });
  };

  return (
    <div className="min-h-screen pb-12">
      <PageHeader
        title="Tìm kiếm nguồn hàng đa phương thức"
        subtitle="Cổng dịch thuật và điều hướng liên kết VIP đến nguồn hàng tận xưởng Taobao, 1688, Tmall"
      />

      {/* Main Sourcing Hub */}
      <Card
        bordered={false}
        className="mb-8 shadow-md rounded-2xl bg-white border border-slate-100 overflow-hidden relative"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)"
        }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full filter blur-3xl opacity-40 -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-100 rounded-full filter blur-3xl opacity-40 -ml-10 -mb-10"></div>

        <div className="max-w-4xl mx-auto py-4 relative z-10">

          {/* Platform Tab Selectors */}
          <div className="grid grid-cols-3 gap-3 mb-6 my-4 px-2">
            <button
              onClick={() => setPlatform("taobao")}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-sm ${
                platform === "taobao"
                  ? "bg-[#FF5000] text-white ring-2 ring-[#FF5000] ring-offset-2"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-[#FF5000]/10"
              }`}
            >
              <span className="text-base">🛍️</span>Taobao.com
            </button>

            <button
              onClick={() => setPlatform("1688")}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-sm ${
                platform === "1688"
                  ? "bg-[#FF6C00] text-white ring-2 ring-[#FF6C00] ring-offset-2"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-[#FF6C00]/10"
              }`}
            >
              <span className="text-base">🏭</span>1688.com
            </button>

            <button
              onClick={() => setPlatform("tmall")}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-sm ${
                platform === "tmall"
                  ? "bg-[#C40000] text-white ring-2 ring-[#C40000] ring-offset-2"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-[#C40000]/10"
              }`}
            >
              <span className="text-base">💎</span>Tmall.com
            </button>
          </div>

          {/* Search Inputs */}
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-100 shadow-sm my-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Nhập tên mặt hàng bằng tiếng Việt để tự động dịch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onPressEnter={handleRedirectSearch}
                  size="large"
                  allowClear
                  prefix={<SearchOutlined className="text-slate-400" />}
                  className="rounded-2xl border-slate-200 focus:border-blue-500 py-3 text-base w-full min-h-[48px] flex items-center"
                />
              </div>
              <Button
                type="primary"
                onClick={handleRedirectSearch}
                size="large"
                icon={<SearchOutlined />}
                className="w-full md:w-auto min-h-[48px] px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-md hover:from-blue-700 hover:to-indigo-700 font-semibold flex items-center justify-center shrink-0"
              >
                Quét nguồn hàng
              </Button>
            </div>

            {/* Real-time Translator Display */}
            {searchQuery.trim() !== "" && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl animate-fadeIn">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <TranslationOutlined className="text-blue-500" />
                  <span>Kết quả dịch thuật tự động sang tiếng Trung:</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-800">
                    {translatedText || searchQuery}
                  </span>
                  <Tag color="blue" className="font-semibold text-[10px] rounded-full border-none py-0.5 px-2">
                    VIP Translator Ready
                  </Tag>
                </div>
              </div>
            )}

            {/* Exchange rate banner */}
            <div className="flex justify-between items-center mt-4 px-1 text-xs text-slate-500">
              <span className="italic text-slate-400">Được tối ưu cho mạng tiêu dùng IP sạch</span>
              <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                <DollarOutlined />
                <span>Tỷ giá mua hộ liên kết: <strong>1 CNY = {exchangeRate.toLocaleString("vi-VN")} đ</strong></span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Camera & Sourcing Image Sạch Guidelines Card */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        
        {/* Guidelines for Native Sourcing */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <InfoCircleOutlined className="text-blue-500" /> Hướng dẫn tìm kiếm gốc an toàn
            </h4>
            <ul className="text-slate-600 text-xs space-y-3 list-inside list-disc">
              <li><strong>Tránh bị chặn:</strong> Mở link trực tiếp giúp trình duyệt của bạn giao tiếp trực tiếp với Taobao/1688, không đi qua server trung gian để không bị block IP.</li>
              <li><strong>Báo giá tối ưu:</strong> Hệ thống logistics tự động áp tỷ giá mua hộ <strong>{exchangeRate.toLocaleString("vi-VN")} đ/CNY</strong> khi bạn tạo đơn ký gửi hoặc mua hộ từ các link đã tìm thấy.</li>
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-50 flex gap-2">
            <Tag color="orange" className="cursor-pointer font-semibold" onClick={() => setSearchQuery("tai nghe bluetooth")}>🔍 Tai nghe</Tag>
            <Tag color="cyan" className="cursor-pointer font-semibold" onClick={() => setSearchQuery("giày sneaker")}>🔍 Giày dép</Tag>
            <Tag color="magenta" className="cursor-pointer font-semibold" onClick={() => setSearchQuery("áo sơ mi")}>🔍 Quần áo</Tag>
          </div>
        </div>

        {/* Camera Native Guidelines Sạch */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm mb-3 flex items-center gap-2 text-indigo-300">
              <CameraOutlined /> Luồng Tìm Kiếm Hình Ảnh Sạch 100%
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed mb-4">
              Để đảm bảo chụp gì ra nấy, tránh bị chặn captchas tải ảnh vô tận, vui lòng click mở trực tiếp trang chủ đối tác, sau đó sử dụng biểu tượng Camera ngay tại thanh tìm kiếm của họ bằng IP kết nối cá nhân của bạn:
            </p>
            <div className="space-y-2 text-[11px] text-slate-400 font-mono">
              <p>✔️ Bước 1: Mở nhanh trang chủ Taobao/1688 bằng link bên dưới.</p>
              <p>✔️ Bước 2: Nhấn vào biểu tượng 📷 (Camera) trên thanh tìm kiếm gốc.</p>
              <p>✔️ Bước 3: Tải ảnh sản phẩm lên để nhận kết quả khớp 100%.</p>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              type="primary"
              size="small"
              onClick={() => window.open("https://www.taobao.com", "_blank")}
              className="bg-orange-500 border-none text-white hover:bg-orange-600 font-bold rounded-xl text-[11px] h-8 flex-1"
            >
              Mở Taobao Gốc ↗
            </Button>
            <Button
              type="default"
              size="small"
              onClick={() => window.open("https://www.1688.com", "_blank")}
              className="bg-white/10 border-none text-white hover:bg-white/20 font-bold rounded-xl text-[11px] h-8 flex-1"
            >
              Mở 1688 Gốc ↗
            </Button>
          </div>
        </div>

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
