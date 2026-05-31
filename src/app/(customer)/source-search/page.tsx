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
  LinkOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  GlobalOutlined,
  LaptopOutlined,
  SyncOutlined
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

  // Platform & Viewport Urls
  const [platform, setPlatform] = useState<Platform>("taobao");
  const [viewportUrl, setViewportUrl] = useState("https://h5.m.taobao.com/");
  const [pastedLink, setPastedLink] = useState("");
  
  // States
  const [parsedProduct, setParsedProduct] = useState<ProductItem | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(3980);
  const [quantity, setQuantity] = useState<number>(1);
  
  // SKU Options
  const [selectedColor, setSelectedColor] = useState<string>("Đen");
  const [selectedSize, setSelectedSize] = useState<string>("XL");
  
  // Loading & Submitting
  const [loading, setLoading] = useState(false);
  const [submittingType, setSubmittingType] = useState<"ECOMMERCE" | "CONSIGNMENT" | null>(null);

  // Sync platforms with respective target viewport URL
  useEffect(() => {
    if (platform === "taobao") {
      setViewportUrl("https://h5.m.taobao.com/");
    } else if (platform === "1688") {
      setViewportUrl("https://m.1688.com/");
    } else {
      setViewportUrl("https://m.tmall.com/");
    }
    setPastedLink("");
    setParsedProduct(null);
    setSelectedColor("Đen");
    setSelectedSize("XL");
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

  // Listen to frame messages for real-time DOM extraction bypass
  useEffect(() => {
    const handleFrameMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "SOURCING_EXTRACTED") {
        const { url, price, title, imageUrl } = e.data;
        const itemId = url?.match(/[?&]id=(\d+)/)?.[1] || "EXT-" + Date.now();
        setParsedProduct({
          id: itemId,
          platform,
          titleVi: title || "Sản phẩm trích xuất từ khung nhúng",
          titleZh: title || "Extracted Product",
          priceCNY: parseFloat(price) || 99.0,
          imageUrl: imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60",
          supplier: `${platform.toUpperCase()} Sourcing Hub`,
          salesCount: "999+",
          attributes: { source: "DOM_STRIPPER" }
        });
        setPastedLink(url || "");
        message.success("Đã đồng bộ thành công dữ liệu sản phẩm từ Khung nhúng!");
      }
    };

    window.addEventListener("message", handleFrameMessage);
    return () => window.removeEventListener("message", handleFrameMessage);
  }, [platform]);

  // Perform authentic Link extraction calling backend route
  const handleParseLink = async () => {
    if (!pastedLink.trim()) {
      message.warning("Vui lòng nhập hoặc dán link sản phẩm muốn bóc tách!");
      return;
    }

    setLoading(true);
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
          message.error("Không trích xuất được thông tin từ link này. Vui lòng dán link sản phẩm chuẩn Taobao/1688/Tmall!");
        }
      } else {
        message.error("Giao dịch kết nối bị chặn bởi tường lửa đối tác.");
      }
    } catch (e) {
      message.error("Lỗi mạng khi trích xuất giá thành.");
    } finally {
      setLoading(false);
    }
  };

  // Create order hook calling the authentic logistics REST endpoint with strict double-click guard
  const handleCreateOrder = async (type: "ECOMMERCE" | "CONSIGNMENT", product: ProductItem) => {
    if (submittingType !== null) return; // Strict lock against duplicate clicks
    setSubmittingType(type);

    try {
      let payload: Record<string, unknown> = {};
      const originalUrl = pastedLink.trim() || `https://s.taobao.com/search?q=${encodeURIComponent(product.titleZh)}`;

      // Capture dynamic SkuID and attributes details
      const colorCode = selectedColor === "Đen" ? "BLK" : selectedColor === "Trắng" ? "WHT" : selectedColor === "Đỏ" ? "RED" : "BLU";
      const generatedSkuId = `SKU-${product.platform.toUpperCase()}-${product.id}-${colorCode}-${selectedSize}`;
      const productSpecs = `Màu sắc: ${selectedColor} | Kích cỡ: ${selectedSize} | SkuID: ${generatedSkuId}`;

      if (type === "ECOMMERCE") {
        payload = {
          orderType: "ECOMMERCE",
          productName: product.titleVi,
          productLink: originalUrl,
          productImage: product.imageUrl,
          productSpecs: productSpecs,
          quantity: quantity,
          unitPriceCNY: product.priceCNY,
          notes: `Đơn mua hộ tự động bóc tách DOM từ Client-Side Viewport.`
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
              specs: productSpecs
            }
          ],
          notes: `Đơn ký gửi tự động bóc tách DOM từ Client-Side Viewport.`
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
            <div className="space-y-1 mt-1 text-xs text-slate-700">
              <p>Mã đơn hàng: <Tag color="blue" className="font-mono">{createdOrder.orderCode}</Tag></p>
              <p>Sản phẩm: <strong>{createdOrder.productName || product.titleVi}</strong></p>
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
    <div className="min-h-screen pb-24 bg-slate-50/50">
      <PageHeader
        title="Tìm kiếm nguồn hàng đa phương thức"
        subtitle="Khung nhúng bóc tách giao diện (Client-Side Viewport) - Trích xuất giá trị thực tế & liên kết gốc tức thì"
      />

      <Row gutter={[24, 24]} className="max-w-[1500px] mx-auto px-4 mt-6">
        
        {/* Left Side: Client-Side Embedded Viewport Frame */}
        <Col xs={24} lg={14}>
          <Card
            bordered={false}
            className="shadow-sm rounded-3xl bg-white border border-slate-100 p-4"
            title={
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2 text-slate-800">
                  <LaptopOutlined className="text-blue-600 animate-pulse" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">CỔNG NHÚNG H5 MOBILE SÀN GỐC</span>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    onClick={() => setPlatform("taobao")}
                    size="small"
                    className={`font-bold rounded-lg text-[10px] ${
                      platform === "taobao" ? "bg-[#FF5000] text-white border-none" : "bg-slate-50 text-slate-600"
                    }`}
                  >
                    Taobao
                  </Button>
                  <Button
                    onClick={() => setPlatform("1688")}
                    size="small"
                    className={`font-bold rounded-lg text-[10px] ${
                      platform === "1688" ? "bg-[#FF6C00] text-white border-none" : "bg-slate-50 text-slate-600"
                    }`}
                  >
                    1688
                  </Button>
                  <Button
                    onClick={() => setPlatform("tmall")}
                    size="small"
                    className={`font-bold rounded-lg text-[10px] ${
                      platform === "tmall" ? "bg-[#C40000] text-white border-none" : "bg-slate-50 text-slate-600"
                    }`}
                  >
                    Tmall
                  </Button>
                </div>
              </div>
            }
          >
            <p className="text-slate-500 text-[11px] leading-relaxed mb-4">
              Khách hàng tự thao tác tìm kiếm bằng hình ảnh hoặc từ khóa trực tiếp bên trong khung di động bên dưới. Mọi thông tin được xử lý an toàn thông qua kết nối sạch của bạn.
            </p>

            {/* Simulated Mobile Device Viewport */}
            <div className="relative w-full h-[580px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
              <iframe
                id="sourcing-mobile-viewport"
                src={viewportUrl}
                className="w-full h-full border-none"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                title="Active Sourcing Viewport"
              />
            </div>
          </Card>
        </Col>

        {/* Right Side: Sourcing Snatcher Console & computed price card - Generous padding bottom to avoid Zalo widget overlap */}
        <Col xs={24} lg={10} className="pb-32 sm:pb-36">
          <div className="space-y-6">
            
            {/* VIP Link Sourcing Console */}
            <Card
              bordered={false}
              className="shadow-sm rounded-3xl bg-white border border-slate-100"
              title={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800">
                    <LinkOutlined className="text-blue-600" />
                    <span className="text-xs font-extrabold uppercase tracking-wider">BẢNG ĐIỀU KHIỂN BÓC TÁCH</span>
                  </div>
                  <Button
                    type="link"
                    icon={<SyncOutlined />}
                    onClick={() => {
                      // Trigger fallback simulation of extraction if cross-origin iframe blocked
                      if (pastedLink.trim()) {
                        handleParseLink();
                      } else {
                        message.info("Vui lòng sao chép liên kết từ Khung nhúng dán vào ô bên dưới để đồng bộ dữ liệu!");
                      }
                    }}
                    className="text-xs text-blue-600 font-bold p-0"
                  >
                    Đồng bộ từ Khung nhúng
                  </Button>
                </div>
              }
            >
              <p className="text-slate-500 text-[11px] leading-relaxed mb-4">
                Sao chép địa chỉ liên kết sản phẩm (URL) từ Khung nhúng và dán vào đây để bóc tách giá thành CNY thực tế:
              </p>

              <div className="space-y-4">
                <Input.TextArea
                  placeholder="Dán link sản phẩm của bạn..."
                  value={pastedLink}
                  onChange={(e) => setPastedLink(e.target.value)}
                  rows={3}
                  className="rounded-2xl border-slate-200 text-xs p-3"
                />
                <Button
                  type="primary"
                  onClick={handleParseLink}
                  loading={loading}
                  icon={<GlobalOutlined />}
                  className="w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-md hover:from-blue-700 hover:to-indigo-700 font-bold text-xs flex items-center justify-center"
                >
                  Bóc Tách Báo Giá Thực Tế
                </Button>
              </div>
            </Card>

            {/* Display Parsed Product Card details */}
            {parsedProduct && (
              <Card
                bordered={false}
                className="shadow-sm rounded-3xl bg-white border border-slate-100 animate-fadeIn"
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

                  <Divider className="my-2.5" />

                  {/* Dynamic Color Selector */}
                  <div className="space-y-1.5">
                    <span className="font-semibold text-slate-700 text-xs">Phân loại màu sắc:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["Đen", "Trắng", "Đỏ", "Xanh"].map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all border ${
                            selectedColor === color
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Size Selector */}
                  <div className="space-y-1.5 pt-1.5">
                    <span className="font-semibold text-slate-700 text-xs">Kích thước / Size:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["S", "M", "L", "XL", "Free Size"].map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all border ${
                            selectedSize === size
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Divider className="my-2.5" />

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

                  <div className="flex items-center justify-between text-xs pt-1.5">
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

                  {/* Pricing summaries estimators */}
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

                  {/* Action order submission triggers */}
                  <div className="space-y-2 pt-2">
                    <Button
                      type="primary"
                      icon={<ShoppingCartOutlined />}
                      onClick={() => handleCreateOrder("ECOMMERCE", parsedProduct)}
                      loading={submittingType === "ECOMMERCE"}
                      disabled={submittingType !== null}
                      className="w-full bg-[#FF5000] border-none text-white hover:bg-[#e04600] font-bold rounded-2xl text-xs py-3 h-auto flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                    >
                      Mua Trực Tiếp (Order)
                    </Button>
                    <Button
                      type="default"
                      icon={<FileTextOutlined />}
                      onClick={() => handleCreateOrder("CONSIGNMENT", parsedProduct)}
                      loading={submittingType === "CONSIGNMENT"}
                      disabled={submittingType !== null}
                      className="w-full border-blue-500 text-blue-600 hover:text-blue-700 hover:border-blue-700 font-bold rounded-2xl text-xs py-3 h-auto flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      Ký Gửi / Ủy Thác (Bến bãi)
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Exchange rate summaries card */}
            <Card bordered={false} className="shadow-sm rounded-3xl bg-blue-50/50 border border-blue-100 p-1">
              <div className="flex items-center gap-2 text-xs text-blue-800">
                <DollarOutlined />
                <span>Tỷ giá quy đổi: <strong>1 CNY = {exchangeRate.toLocaleString("vi-VN")} đ</strong></span>
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
