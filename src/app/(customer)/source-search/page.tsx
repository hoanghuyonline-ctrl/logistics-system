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
  notification,
  Empty
} from "antd";
import {
  GlobalOutlined,
  CompassOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  SearchOutlined,
  WarningOutlined
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
}

function SearchDashboard() {
  const { t } = useI18n();

  // States
  const [platform, setPlatform] = useState<Platform>("taobao");
  const [iframeUrl, setIframeUrl] = useState("https://h5.m.taobao.com/");
  const [searchQuery, setSearchQuery] = useState("");
  const [pastedLink, setPastedLink] = useState("");
  const [searchResults, setSearchResults] = useState<ProductItem[]>([]);
  const [parsedProduct, setParsedProduct] = useState<ProductItem | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(3980);
  const [quantity, setQuantity] = useState<number>(1);
  
  // Loading states
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingParse, setLoadingParse] = useState(false);
  const [submittingType, setSubmittingType] = useState<"ECOMMERCE" | "CONSIGNMENT" | null>(null);
  
  // Track firewall blocks
  const [isBlocked, setIsBlocked] = useState(false);

  // Sync platform selections with embedded iframe target
  useEffect(() => {
    if (platform === "taobao") {
      setIframeUrl("https://h5.m.taobao.com/");
    } else if (platform === "1688") {
      setIframeUrl("https://m.1688.com/");
    } else {
      setIframeUrl("https://m.tmall.com/");
    }
    setSearchQuery("");
    setSearchResults([]);
    setPastedLink("");
    setParsedProduct(null);
    setIsBlocked(false);
  }, [platform]);

  // Fetch exchange rate configurations from backend
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
  const handleKeywordSearch = async () => {
    if (!searchQuery.trim()) {
      message.warning("Vui lòng nhập từ khóa tìm kiếm!");
      return;
    }

    setLoadingSearch(true);
    setIsBlocked(false);
    setSearchResults([]);

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
      setLoadingSearch(false);
    }
  };

  // Perform authentic Link extraction calling backend route
  const handleParseLink = async () => {
    if (!pastedLink.trim()) {
      message.warning("Vui lòng dán link sản phẩm muốn bóc tách!");
      return;
    }

    setLoadingParse(true);
    setParsedProduct(null);

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
      setLoadingParse(false);
    }
  };

  // Order creation hook calling the authentic logistics REST endpoint
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
          notes: `Đơn hàng mua hộ tự động được trích xuất thời gian thực qua WebView Wrapper.`
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
          notes: `Đơn ký gửi tự động được trích xuất thời gian thực qua WebView Wrapper.`
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
        subtitle="Cổng trích xuất giá thành & link gốc thời gian thực, ngụy trang WebView bảo mật"
      />

      <Row gutter={[24, 24]} className="max-w-[1600px] mx-auto px-4 mt-6">
        
        {/* Left Viewport: Native WebView wrapper terminal box */}
        <Col xs={24} lg={15}>
          <Card
            bordered={false}
            className="shadow-lg rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col relative"
            title={
              <div className="flex items-center justify-between text-slate-100 py-2">
                <div className="flex items-center gap-2">
                  <CompassOutlined className="text-blue-400 animate-spin" />
                  <span className="text-sm font-bold font-mono">NATIVE WEBVIEW TERMINAL WRAPPER</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag color="orange" className="font-bold border-none uppercase text-[10px]">
                    Brand Masking Active
                  </Tag>
                  <Tag color="green" className="font-bold border-none uppercase text-[10px]">
                    Client IP Secured
                  </Tag>
                </div>
              </div>
            }
          >
            {/* Platform tab selector buttons */}
            <div className="flex gap-2 mb-4 bg-slate-950 p-2 rounded-2xl border border-slate-850">
              <Button
                type={platform === "taobao" ? "primary" : "text"}
                onClick={() => setPlatform("taobao")}
                className={`font-semibold rounded-xl text-xs flex-1 ${
                  platform === "taobao" ? "bg-[#FF5000] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                🛍️ Taobao H5 Mobile
              </Button>
              <Button
                type={platform === "1688" ? "primary" : "text"}
                onClick={() => setPlatform("1688")}
                className={`font-semibold rounded-xl text-xs flex-1 ${
                  platform === "1688" ? "bg-[#FF6C00] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                🏭 1688 H5 Mobile
              </Button>
              <Button
                type={platform === "tmall" ? "primary" : "text"}
                onClick={() => setPlatform("tmall")}
                className={`font-semibold rounded-xl text-xs flex-1 ${
                  platform === "tmall" ? "bg-[#C40000] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                💎 Tmall H5 Mobile
              </Button>
            </div>

            {/* Simulated browser search input inside WebView layout */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Tìm kiếm sản phẩm trên trang gốc..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onPressEnter={handleKeywordSearch}
                  className="rounded-xl bg-slate-900 border-slate-800 text-slate-200 text-xs placeholder:text-slate-500"
                />
                <Button
                  type="primary"
                  onClick={handleKeywordSearch}
                  loading={loadingSearch}
                  icon={<SearchOutlined />}
                  className="bg-blue-600 hover:bg-blue-700 border-none font-bold rounded-xl text-xs px-5"
                >
                  Tìm kiếm
                </Button>
              </div>
            </div>

            {/* Embedded IFrame Sandboxed Client Viewport */}
            <div className="relative w-full h-[600px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
              
              {/* Floating Shield Overlays */}
              <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-slate-950/95 to-slate-950/0 z-35 pointer-events-none flex items-center justify-between px-4">
                <span className="text-[10px] text-slate-400 font-mono">MASK: stealth_header_strip_on</span>
                <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">DOM SHIELD ACTIVE</span>
              </div>

              {/* Live Iframe Portal */}
              <iframe
                id="native-webview-iframe"
                src={iframeUrl}
                className="w-full h-full border-none z-10"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                title="Sourcing Frame Target"
              />

              <div className="absolute bottom-0 left-0 w-full h-10 bg-slate-950 z-35 pointer-events-none flex items-center justify-center">
                <span className="text-[9px] text-slate-500 font-mono">Bắc Trung Hải Logistics - Safe Sandbox</span>
              </div>
            </div>
          </Card>
        </Col>

        {/* Right Viewport: Link Snatcher Console & Price Calculator */}
        <Col xs={24} lg={9}>
          <div className="space-y-6">
            
            {/* Link Snatcher Input Box */}
            <Card
              bordered={false}
              className="shadow-lg rounded-3xl bg-white border border-slate-100"
              title={
                <div className="flex items-center gap-2 text-slate-800">
                  <LinkOutlined className="text-blue-600" />
                  <span className="text-sm font-extrabold uppercase">Báo Giá Link Gốc VIP</span>
                </div>
              }
            >
              <p className="text-slate-500 text-xs leading-relaxed mb-4">
                Copy link từ khung nhúng WebView dán vào đây để bóc tách giá gốc CNY và tự động quy đổi ra VNĐ:
              </p>

              <div className="space-y-3">
                <Input.TextArea
                  placeholder="Dán link sản phẩm Taobao/1688/Tmall..."
                  value={pastedLink}
                  onChange={(e) => setPastedLink(e.target.value)}
                  rows={3}
                  className="rounded-2xl border-slate-200 text-xs"
                />
                <Button
                  type="primary"
                  onClick={handleParseLink}
                  loading={loadingParse}
                  icon={<GlobalOutlined />}
                  className="w-full min-h-[40px] rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-md hover:from-blue-700 hover:to-indigo-700 font-semibold text-xs flex items-center justify-center"
                >
                  Bóc tách giá trị thực tế
                </Button>
              </div>
            </Card>

            {/* Display Parsed Product Details from Link */}
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
                    <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">
                      {parsedProduct.titleVi}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                      ID: {parsedProduct.id}
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
                      <span>Phí dịch vụ mua hộ (5%):</span>
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

            {/* Keyword Search Result List */}
            {searchResults.length > 0 && !parsedProduct && (
              <Card
                bordered={false}
                className="shadow-lg rounded-3xl bg-white border border-slate-100 max-h-[500px] overflow-y-auto"
                title={
                  <div className="text-slate-800 text-xs font-bold uppercase">
                    Kết quả bóc tách từ khóa ({searchResults.length})
                  </div>
                }
              >
                <div className="space-y-4">
                  {searchResults.map((item) => (
                    <div key={item.id} className="flex gap-3 border-b border-slate-50 pb-3 last:border-b-0 last:pb-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt={item.titleVi}
                        className="w-14 h-14 rounded-xl object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-slate-800 text-xs truncate">{item.titleVi}</h5>
                        <p className="text-[10px] text-slate-400 truncate font-mono">{item.supplier}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-orange-600 font-bold text-xs font-mono">
                            {formatVND(item.priceCNY * exchangeRate)}
                          </span>
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => {
                              setParsedProduct(item);
                              message.success(`Đã chọn sản phẩm: ${item.titleVi}`);
                            }}
                            className="bg-blue-600 border-none rounded-lg text-[10px] h-6"
                          >
                            Chọn sản phẩm
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Empty State Fallback Guard */}
            {isBlocked && (
              <Card bordered={false} className="shadow-lg rounded-3xl bg-white border border-slate-100 p-6 text-center">
                <div className="text-amber-500 mb-2">
                  <WarningOutlined style={{ fontSize: 32 }} />
                </div>
                <div className="font-bold text-slate-800 text-xs mb-2">
                  MÁY CHỦ BỊ NGHẼN BẢO MẬT
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Hệ thống đang nghẽn mạch bảo mật, vui lòng dán trực tiếp đường link sản phẩm vào ô bên dưới
                </p>
              </Card>
            )}

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
