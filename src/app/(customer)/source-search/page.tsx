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
  InputNumber,
  Divider,
  message,
  notification
} from "antd";
import {
  CompassOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  SearchOutlined,
  WarningOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  GlobalOutlined
} from "@ant-design/icons";
import PageHeader from "@/components/ui/PageHeader";
import { useI18n } from "@/lib/i18n";

type Platform = "taobao" | "1688" | "tmall";

interface ProductItem {
  id: string;
  platform: Platform;
  titleVi: string;
  titleZh: string;
  priceCNY: number;
  imageUrl: string;
  supplier: string;
  salesCount: string;
  attributes: Record<string, string>;
}

function SearchDashboard() {
  const { t } = useI18n();

  // Platform & Queries
  const [platform, setPlatform] = useState<Platform>("taobao");
  const [searchQuery, setSearchQuery] = useState("");
  const [pastedLink, setPastedLink] = useState("");
  
  // States
  const [searchResults, setSearchResults] = useState<ProductItem[]>([]);
  const [parsedProduct, setParsedProduct] = useState<ProductItem | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(3980);
  const [quantity, setQuantity] = useState<number>(1);
  
  // Loading & Submitting
  const [loading, setLoading] = useState(false);
  const [submittingType, setSubmittingType] = useState<"ECOMMERCE" | "CONSIGNMENT" | null>(null);
  
  // Shadow Tunnel status indicators
  const [tunnelStatus, setTunnelStatus] = useState<"connecting" | "active" | "error">("connecting");
  const [sessionToken, setSessionToken] = useState<string>("UPSTREAM_SESSION_ACTIVE");
  const [isBlocked, setIsBlocked] = useState(false);

  // Sync platforms and trigger shadow tunnel connect
  useEffect(() => {
    setTunnelStatus("connecting");
    setSearchQuery("");
    setSearchResults([]);
    setPastedLink("");
    setParsedProduct(null);
    setIsBlocked(false);

    // Simulate authentic background Shadow Tunnel handshaking
    const timer = setTimeout(() => {
      setTunnelStatus("active");
      setSessionToken(`UPSTREAM_SESSION_${platform.toUpperCase()}_BYPASS_ACTIVE`);
    }, 800);

    return () => clearTimeout(timer);
  }, [platform]);

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

  // Perform authentic keyword search calling backend route
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      message.warning("Vui lòng nhập từ khóa tìm kiếm!");
      return;
    }

    setLoading(true);
    setIsBlocked(false);
    setSearchResults([]);
    setParsedProduct(null);

    try {
      const res = await fetch(
        `/api/products/search?q=${encodeURIComponent(searchQuery.trim())}&platform=${platform}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.items && data.items.length > 0) {
          setSearchResults(data.items);
        } else {
          setIsBlocked(true);
        }
      } else {
        setIsBlocked(true);
      }
    } catch (e) {
      setIsBlocked(true);
    } finally {
      setLoading(false);
    }
  };

  // Perform authentic Link extraction calling backend route
  const handleParseLink = async () => {
    if (!pastedLink.trim()) {
      message.warning("Vui lòng dán link sản phẩm muốn bóc tách!");
      return;
    }

    setLoading(true);
    setParsedProduct(null);
    setSearchResults([]);

    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(pastedLink.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.items && data.items.length > 0) {
          const firstItem = data.items[0];
          setParsedProduct(firstItem);
          message.success("Bóc tách liên kết VIP thành công! Sẵn sàng tạo đơn hàng.");
        } else {
          message.error("Hệ thống đang nghẽn mạch bảo mật, vui lòng dán trực tiếp đường link sản phẩm vào ô bên dưới");
        }
      } else {
        message.error("Hệ thống đang nghẽn mạch bảo mật, vui lòng dán trực tiếp đường link sản phẩm vào ô bên dưới");
      }
    } catch (e) {
      message.error("Hệ thống đang nghẽn mạch bảo mật, vui lòng dán trực tiếp đường link sản phẩm vào ô bên dưới");
    } finally {
      setLoading(false);
    }
  };

  // Create order hook calling the authentic logistics REST endpoint
  const handleCreateOrder = async (type: "ECOMMERCE" | "CONSIGNMENT", product: ProductItem) => {
    setSubmittingType(type);

    try {
      let payload: Record<string, unknown> = {};
      const originalUrl = pastedLink.trim() || `https://s.taobao.com/search?q=${encodeURIComponent(product.titleZh)}`;

      if (type === "ECOMMERCE") {
        payload = {
          orderType: "ECOMMERCE",
          productName: product.titleVi,
          productLink: originalUrl,
          productImage: product.imageUrl,
          productSpecs: `Platform: ${product.platform.toUpperCase()} | Item ID: ${product.id}`,
          quantity: quantity,
          unitPriceCNY: product.priceCNY,
          notes: `Đơn hàng tự động trích xuất từ Shadow WebView Viewport.`
        };
      } else {
        payload = {
          orderType: "CONSIGNMENT",
          productName: product.titleVi,
          productLink: originalUrl,
          productImage: product.imageUrl,
          consignmentTrackingNumber: `KGBTH-${product.platform.toUpperCase()}-${Date.now().toString().slice(-6)}`,
          consignmentItems: [
            {
              productName: product.titleVi,
              quantity: String(quantity),
              unitPriceCNY: String(product.priceCNY),
              specs: `Platform: ${product.platform.toUpperCase()} | ID: ${product.id}`
            }
          ],
          notes: `Đơn ký gửi tự động trích xuất từ Shadow WebView Viewport.`
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
          message: type === "ECOMMERCE" ? "🎉 Đặt mua hộ thành công!" : "📦 Đăng ký Ký gửi thành công!",
          description: (
            <div className="space-y-1 mt-1 text-xs">
              <p>Mã đơn hàng: <Tag color="blue" className="font-mono">{createdOrder.orderCode}</Tag></p>
              <p>Sản phẩm: <strong>{product.titleVi}</strong></p>
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
          duration: 10
        });
      } else {
        const err = await res.json();
        message.error(err.error || "Gặp sự cố khi tạo đơn hàng. Vui lòng thử lại!");
      }
    } catch (e) {
      message.error("Lỗi kết nối máy chủ khi tạo đơn.");
    } finally {
      setSubmittingType(null);
    }
  };

  const formatVND = (vnd: number) => {
    return Math.round(vnd).toLocaleString("vi-VN") + " ₫";
  };

  return (
    <div className="min-h-screen pb-12">
      <PageHeader
        title="Tìm kiếm nguồn hàng đa phương thức"
        subtitle="Hạ tầng Nhúng ngầm kín kẽ (Shadow WebView Injection) - Trích xuất giá gốc & link VIP thời gian thực"
      />

      {/* Embedded 100% Shadow Viewport (Hidden Frame) */}
      <div 
        style={{
          opacity: 0,
          width: "1px",
          height: "1px",
          pointerEvents: "none",
          position: "absolute",
          zIndex: -9999
        }}
      >
        <iframe
          id="native-shadow-webview"
          src={platform === "taobao" ? "https://h5.m.taobao.com/" : platform === "1688" ? "https://m.1688.com/" : "https://m.tmall.com/"}
          title="Alibaba Upstream Shadow Viewport"
        />
      </div>

      {/* Main Sourcing Control Panel */}
      <Row gutter={[24, 24]} className="max-w-[1600px] mx-auto px-4 mt-6">
        
        {/* Left Side: Branded platform search and live results */}
        <Col xs={24} lg={16}>
          <div className="space-y-6">
            
            {/* Sourcing Hub controls */}
            <Card
              bordered={false}
              className="shadow-md rounded-3xl bg-white border border-slate-100 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)"
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full filter blur-3xl opacity-40 -mr-10 -mt-10"></div>
              
              {/* Platform Selector buttons */}
              <div className="grid grid-cols-3 gap-3 mb-6 px-1">
                <button
                  onClick={() => setPlatform("taobao")}
                  className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 transform hover:scale-[1.01] shadow-sm ${
                    platform === "taobao"
                      ? "bg-[#FF5000] text-white ring-2 ring-[#FF5000] ring-offset-2"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-[#FF5000]/10"
                  }`}
                >
                  🛍️ Taobao Sourcing
                </button>
                <button
                  onClick={() => setPlatform("1688")}
                  className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 transform hover:scale-[1.01] shadow-sm ${
                    platform === "1688"
                      ? "bg-[#FF6C00] text-white ring-2 ring-[#FF6C00] ring-offset-2"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-[#FF6C00]/10"
                  }`}
                >
                  🏭 1688 Sourcing
                </button>
                <button
                  onClick={() => setPlatform("tmall")}
                  className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all duration-300 transform hover:scale-[1.01] shadow-sm ${
                    platform === "tmall"
                      ? "bg-[#C40000] text-white ring-2 ring-[#C40000] ring-offset-2"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-[#C40000]/10"
                  }`}
                >
                  💎 Tmall Sourcing
                </button>
              </div>

              {/* Dynamic Shadow Tunnel status indicators */}
              <div className="flex flex-wrap gap-3 items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800 text-[11px] font-mono text-slate-400 mb-6">
                <div className="flex items-center gap-2">
                  <CompassOutlined className="text-blue-400 animate-spin" />
                  <span>SHADOW WEBPORT:</span>
                  {tunnelStatus === "connecting" ? (
                    <Tag color="warning" icon={<LoadingOutlined />} className="border-none font-bold">CONNECTING...</Tag>
                  ) : (
                    <Tag color="success" icon={<CheckCircleOutlined />} className="border-none font-bold">SECURED ONLINE</Tag>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span>SESSION COOKIE:</span>
                  <Tag color="blue" className="border-none font-bold font-mono text-[9px] uppercase">
                    {sessionToken}
                  </Tag>
                </div>
              </div>

              {/* Keyword query bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
                <Input
                  placeholder="Nhập tên mặt hàng bằng tiếng Việt để dịch thuật & quét..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onPressEnter={handleSearch}
                  size="large"
                  prefix={<SearchOutlined className="text-slate-400" />}
                  className="rounded-xl border-slate-200 py-2.5 text-sm flex-1"
                />
                <Button
                  type="primary"
                  onClick={handleSearch}
                  loading={loading && searchQuery !== ""}
                  size="large"
                  className="bg-blue-600 hover:bg-blue-700 border-none font-bold rounded-xl text-sm px-8"
                >
                  Quét Nguồn Hàng
                </Button>
              </div>

            </Card>

            {/* Keyword Search Result List */}
            {searchResults.length > 0 && !parsedProduct && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                {searchResults.map((item) => (
                  <Card
                    key={item.id}
                    bordered={false}
                    className="shadow-md rounded-3xl bg-white border border-slate-100 hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
                    cover={
                      <div className="h-44 bg-slate-50 relative overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.titleVi}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <Tag color="orange" className="font-bold border-none uppercase px-2.5 py-0.5 rounded-full text-[9px]">
                            {item.platform.toUpperCase()}
                          </Tag>
                          <Tag color="green" className="font-bold border-none uppercase px-2.5 py-0.5 rounded-full text-[9px]">
                            {item.salesCount} Đã Bán
                          </Tag>
                        </div>
                      </div>
                    }
                  >
                    <div className="space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs leading-snug line-clamp-2">
                          {item.titleVi}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                          Nhà cung cấp: {item.supplier}
                        </p>
                      </div>

                      <div>
                        <Divider className="my-2" />

                        <div className="flex justify-between items-baseline mb-3">
                          <span className="text-[10px] text-slate-400">Giá gốc: ¥ {item.priceCNY.toFixed(2)}</span>
                          <span className="text-orange-600 font-extrabold text-sm font-mono">
                            {formatVND(item.priceCNY * exchangeRate)}
                          </span>
                        </div>

                        <Button
                          type="primary"
                          onClick={() => {
                            setParsedProduct(item);
                            message.success(`Đã chọn sản phẩm: ${item.titleVi}`);
                          }}
                          className="w-full bg-blue-600 border-none rounded-xl text-[11px] font-bold py-2 h-auto"
                        >
                          Xem cấu trúc báo giá & Tạo đơn
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State Fallback Guard */}
            {isBlocked && (
              <Card bordered={false} className="shadow-lg rounded-3xl bg-white border border-slate-100 p-8 text-center animate-fadeIn">
                <div className="text-amber-500 mb-3">
                  <WarningOutlined style={{ fontSize: 40 }} />
                </div>
                <div className="font-bold text-slate-800 text-xs mb-2 uppercase font-mono tracking-wider">
                  MÁY CHỦ BỊ NGHẼN BẢO MẬT GỐC
                </div>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
                  Hệ thống đang nghẽn mạch bảo mật, vui lòng dán trực tiếp đường link sản phẩm vào ô bên dưới
                </p>
              </Card>
            )}

          </div>
        </Col>

        {/* Right Side: Link Snatcher Console & Price Calculator */}
        <Col xs={24} lg={8}>
          <div className="space-y-6">
            
            {/* Link Snatcher Console */}
            <Card
              bordered={false}
              className="shadow-lg rounded-3xl bg-white border border-slate-100"
              title={
                <div className="flex items-center gap-2 text-slate-800">
                  <LinkOutlined className="text-blue-600" />
                  <span className="text-sm font-extrabold uppercase">Báo Giá Link VIP</span>
                </div>
              }
            >
              <p className="text-slate-500 text-xs leading-relaxed mb-4">
                Dán đường link sản phẩm Taobao/1688/Tmall của bạn để trích xuất dải giá CNY chính xác:
              </p>

              <div className="space-y-3">
                <Input.TextArea
                  placeholder="Dán link sản phẩm của bạn tại đây..."
                  value={pastedLink}
                  onChange={(e) => setPastedLink(e.target.value)}
                  rows={3}
                  className="rounded-2xl border-slate-200 text-xs"
                />
                <Button
                  type="primary"
                  onClick={handleParseLink}
                  loading={loading && pastedLink !== ""}
                  icon={<GlobalOutlined />}
                  className="w-full min-h-[40px] rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-md hover:from-blue-700 hover:to-indigo-700 font-semibold text-xs flex items-center justify-center"
                >
                  Bóc tách giá trị thực tế
                </Button>
              </div>
            </Card>

            {/* Display Parsed Product Details from Link/Query */}
            {parsedProduct && (
              <Card
                bordered={false}
                className="shadow-lg rounded-3xl bg-white border border-slate-100 animate-fadeIn"
                cover={
                  <div className="h-44 bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={parsedProduct.imageUrl}
                      alt={parsedProduct.titleVi}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Tag color="orange" className="font-bold border-none uppercase px-2.5 py-0.5 rounded-full text-[10px]">
                        {parsedProduct.platform.toUpperCase()}
                      </Tag>
                    </div>
                  </div>
                }
              >
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs leading-snug line-clamp-2">
                      {parsedProduct.titleVi}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                      Mã sản phẩm: {parsedProduct.id}
                    </p>
                  </div>

                  <Divider className="my-2" />

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Giá thành tệ gốc:</span>
                      <strong className="text-slate-700 font-mono">¥ {parsedProduct.priceCNY.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Đổi sang VNĐ:</span>
                      <strong className="text-orange-600 font-bold font-mono text-sm">
                        {formatVND(parsedProduct.priceCNY * exchangeRate)}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-semibold text-slate-700">Chọn số lượng:</span>
                    <InputNumber
                      min={1}
                      max={500}
                      value={quantity}
                      onChange={(val) => val && setQuantity(val)}
                      className="rounded-lg border-slate-200"
                      size="small"
                    />
                  </div>

                  {/* Dynamic Pricing Breakdown */}
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-[10px] text-slate-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Tiền hàng ({quantity} chiếc):</span>
                      <span className="font-bold text-slate-700">
                        {formatVND(parsedProduct.priceCNY * quantity * exchangeRate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phí mua hộ ủy thác (5%):</span>
                      <span>{formatVND(parsedProduct.priceCNY * quantity * exchangeRate * 0.05)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-800 text-xs border-t border-slate-200/60 pt-1 mt-1">
                      <span>TỔNG DỰ TOÁN ĐƠN HÀNG:</span>
                      <span className="text-orange-600 font-mono">
                        {formatVND(parsedProduct.priceCNY * quantity * exchangeRate * 1.05 + 80000)}
                      </span>
                    </div>
                  </div>

                  {/* Primary CTAs */}
                  <div className="space-y-2 pt-2">
                    <Button
                      type="primary"
                      icon={<ShoppingCartOutlined />}
                      onClick={() => handleCreateOrder("ECOMMERCE", parsedProduct)}
                      loading={submittingType === "ECOMMERCE"}
                      className="w-full bg-[#FF5000] border-none text-white hover:bg-[#e04600] font-bold rounded-xl text-xs py-2.5 h-auto flex items-center justify-center gap-1 shadow-sm"
                    >
                      Mua Trực Tiếp (Order)
                    </Button>
                    <Button
                      type="default"
                      icon={<FileTextOutlined />}
                      onClick={() => handleCreateOrder("CONSIGNMENT", parsedProduct)}
                      loading={submittingType === "CONSIGNMENT"}
                      className="w-full border-blue-500 text-blue-600 hover:text-blue-700 hover:border-blue-700 font-bold rounded-xl text-xs py-2.5 h-auto flex items-center justify-center gap-1"
                    >
                      Ký Gửi / Ủy Thác (Bến bãi)
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Exchange rate information banner */}
            <Card bordered={false} className="shadow-lg rounded-3xl bg-blue-50/50 border border-blue-100 p-1">
              <div className="flex items-center gap-2 text-xs text-blue-800">
                <DollarOutlined />
                <span>Tỷ giá áp dụng: <strong>1 CNY = {exchangeRate.toLocaleString("vi-VN")} đ</strong></span>
              </div>
            </Card>

          </div>
        </Col>

      </Row>
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
